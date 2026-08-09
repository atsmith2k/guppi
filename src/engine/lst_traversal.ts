import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ts from 'typescript';
import { GuppiDB, ASTSymbol, MemoryItem, FactTriple } from '../db/client.js';

export interface LSTNode {
  id: string;
  kind: string;
  name?: string;
  startLine: number;
  endLine: number;
  startChar: number;
  endChar: number;
  docstring?: string;
  signature?: string;
  text: string;
  children: LSTNode[];
}

export interface LSTSymbolMatch {
  id: string;
  symbolName: string;
  kind: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  signature: string;
  docstring?: string;
  scopePath: string;
  relatedMemories?: { title: string; category: string }[];
  factTriples?: { subject: string; relation: string; object: string }[];
}

export interface LSTReference {
  callerSymbol: string;
  calleeSymbol: string;
  filePath: string;
  lineNumber: number;
  lineSnippet: string;
  callType: 'direct_call' | 'method_invocation' | 'instantiation' | 'type_reference' | 'import';
}

export class LSTTraversalEngine {
  constructor(private db: GuppiDB, private workspaceDir: string = process.cwd()) {}

  /**
   * Parse a source file into a Lossless Semantic Tree (LST).
   */
  public parseFileToLST(filePath: string): LSTNode {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceDir, filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(absPath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      absPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const convertNode = (node: ts.Node, parentScope: string = ''): LSTNode => {
      const kindName = ts.SyntaxKind[node.kind];
      const startLineObj = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const endLineObj = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      
      const startLine = startLineObj.line + 1;
      const endLine = endLineObj.line + 1;
      const startChar = startLineObj.character;
      const endChar = endLineObj.character;

      let name: string | undefined;
      if (ts.isClassDeclaration(node) && node.name) name = node.name.text;
      else if (ts.isFunctionDeclaration(node) && node.name) name = node.name.text;
      else if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) name = node.name.text;
      else if (ts.isInterfaceDeclaration(node) && node.name) name = node.name.text;
      else if (ts.isTypeAliasDeclaration(node) && node.name) name = node.name.text;
      else if (ts.isPropertyDeclaration(node) && node.name && ts.isIdentifier(node.name)) name = node.name.text;
      else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) name = node.name.text;

      const scope = name ? (parentScope ? `${parentScope} > ${name}` : name) : parentScope;

      let docstring: string | undefined;
      const jsDoc = (node as any).jsDoc;
      if (jsDoc && jsDoc.length > 0) {
        docstring = jsDoc.map((doc: any) => doc.comment || '').join('\n').trim();
      }

      const nodeText = content.substring(node.getStart(sourceFile), node.getEnd());

      const children: LSTNode[] = [];
      ts.forEachChild(node, (child) => {
        // Filter out token nodes or trivia children to keep tree semantic
        if (child.kind > ts.SyntaxKind.LastToken) {
          children.push(convertNode(child, scope));
        }
      });

      return {
        id: `lst_${startLine}_${endLine}_${kindName}_${name || 'anon'}`,
        kind: kindName,
        name,
        startLine,
        endLine,
        startChar,
        endChar,
        docstring,
        signature: name ? `${kindName} ${name}` : undefined,
        text: nodeText,
        children,
      };
    };

    return convertNode(sourceFile);
  }

  /**
   * Query LST nodes using selector path or kind/name filters.
   */
  public queryLSTTree(filePath: string, selector: string): LSTNode[] {
    const root = this.parseFileToLST(filePath);
    const matches: LSTNode[] = [];

    const parts = selector.split('>').map((s) => s.trim());

    const search = (node: LSTNode, depth: number) => {
      const targetSelector = parts[depth];
      if (!targetSelector) return;

      let kindMatch = true;
      let nameMatch = true;

      // Handle selector like ClassDeclaration[name="OnboardingEngine"]
      const nameAttrMatch = targetSelector.match(/^([a-zA-Z0-9_$]+)?(?:\[name=["']([^"']+)["']\])?$/);
      if (nameAttrMatch) {
        const expectedKind = nameAttrMatch[1];
        const expectedName = nameAttrMatch[2];

        if (expectedKind && !node.kind.toLowerCase().includes(expectedKind.toLowerCase())) {
          kindMatch = false;
        }
        if (expectedName && node.name !== expectedName) {
          nameMatch = false;
        }
      } else {
        if (!node.kind.toLowerCase().includes(targetSelector.toLowerCase()) && node.name !== targetSelector) {
          kindMatch = false;
          nameMatch = false;
        }
      }

      if (kindMatch && nameMatch) {
        if (depth === parts.length - 1) {
          matches.push(node);
        } else {
          for (const child of node.children) {
            search(child, depth + 1);
          }
        }
      } else {
        // Also check children at depth 0 if searching at root
        if (depth === 0) {
          for (const child of node.children) {
            search(child, 0);
          }
        }
      }
    };

    search(root, 0);
    return matches;
  }

  /**
   * Serena-style fuzzy & scope-aware symbol lookup enriched with GUPPI Memory & Facts.
   */
  public findSymbols(query: string, scope?: string): LSTSymbolMatch[] {
    const symbols = this.db.querySymbols(query, 50);
    const results: LSTSymbolMatch[] = [];

    for (const sym of symbols) {
      if (scope && !sym.file_path.toLowerCase().includes(scope.toLowerCase()) && !sym.symbol_name.toLowerCase().includes(scope.toLowerCase())) {
        continue;
      }

      // Query GUPPI RAG Memory for associated architectural decisions
      const mems = this.db.searchMemories(sym.symbol_name, 3).map((m: MemoryItem) => ({ title: m.title, category: m.category }));

      // Query GUPPI Fact Graph triples
      const facts = this.db.queryFactTriples(sym.symbol_name, 20)
        .map((f: FactTriple) => ({ subject: f.subject, relation: f.relation, object: f.object }));

      results.push({
        id: sym.id,
        symbolName: sym.symbol_name,
        kind: sym.kind,
        filePath: sym.file_path,
        lineStart: sym.line_start,
        lineEnd: sym.line_end,
        signature: sym.signature,
        docstring: sym.docstring,
        scopePath: `${sym.kind} ${sym.symbol_name} in ${sym.file_path}`,
        relatedMemories: mems,
        factTriples: facts,
      });
    }

    return results;
  }

  /**
   * Serena-style cross-file symbol reference lookup.
   */
  public findReferences(symbolName: string): LSTReference[] {
    const references: LSTReference[] = [];
    const files = this.db.getCodeIndex();

    for (const file of files) {
      const absPath = path.isAbsolute(file.path) ? file.path : path.join(this.workspaceDir, file.path);
      if (!fs.existsSync(absPath)) continue;

      const content = fs.readFileSync(absPath, 'utf-8');
      const lines = content.split('\n');

      let currentCaller = 'module';
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const declMatch = line.match(/(?:function|class|interface|type)\s+([a-zA-Z0-9_$]+)/);
        if (declMatch) currentCaller = declMatch[1];

        if (line.includes(symbolName)) {
          let callType: LSTReference['callType'] = 'direct_call';
          if (line.includes(`import `) || line.includes(`require(`)) callType = 'import';
          else if (line.includes(`new ${symbolName}`)) callType = 'instantiation';
          else if (line.includes(`.${symbolName}(`)) callType = 'method_invocation';
          else if (line.match(new RegExp(`:\\s*${symbolName}`))) callType = 'type_reference';

          // Avoid self-declaration match
          if (!line.match(new RegExp(`(?:function|class|interface|type)\\s+${symbolName}\\b`))) {
            references.push({
              callerSymbol: currentCaller,
              calleeSymbol: symbolName,
              filePath: file.path,
              lineNumber: lineNum,
              lineSnippet: line.trim(),
              callType,
            });
          }
        }
      });
    }

    return references;
  }

  /**
   * Generate a token-efficient Lossless Folded Code Slice.
   * Strips implementation bodies while keeping imports, interfaces, type aliases, class signatures, and docstrings.
   */
  public skeletonSlice(filePath: string): string {
    const root = this.parseFileToLST(filePath);
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceDir, filePath);
    const rawContent = fs.readFileSync(absPath, 'utf-8');
    const lines = rawContent.split('\n');

    // Identify implementation ranges to fold (e.g., function/method bodies)
    const foldRanges: { start: number; end: number }[] = [];

    const collectFolds = (node: LSTNode) => {
      if (
        (node.kind === 'Block' || node.kind === 'MethodDeclaration' || node.kind === 'FunctionDeclaration') &&
        node.endLine - node.startLine > 3
      ) {
        // Fold body inner lines
        foldRanges.push({ start: node.startLine + 1, end: node.endLine - 1 });
      } else {
        for (const child of node.children) {
          collectFolds(child);
        }
      }
    };

    collectFolds(root);

    // Merge ranges
    const isLineFolded = (lineNum: number) => {
      return foldRanges.some((r) => lineNum >= r.start && lineNum <= r.end);
    };

    const outputLines: string[] = [];
    let inFoldBlock = false;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (isLineFolded(lineNum)) {
        if (!inFoldBlock) {
          outputLines.push(`    /* ... [Implementation Folded (Lines ${lineNum}-${lineNum + 5})] ... */`);
          inFoldBlock = true;
        }
      } else {
        inFoldBlock = false;
        outputLines.push(line);
      }
    });

    return outputLines.join('\n');
  }

  /**
   * Serena-style atomic symbol body replacement.
   * Creates shadow backup snapshot before applying edit.
   */
  public replaceSymbolBody(
    filePath: string,
    symbolName: string,
    newBodyText: string
  ): { success: boolean; backupId: string; modifiedCode: string } {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceDir, filePath);
    if (!fs.existsSync(absPath)) throw new Error(`File not found: ${filePath}`);

    // 1. Create Pre-flight Shadow Backup Snapshot
    const backupRecord = this.db.createShadowBackup(absPath);
    const backupId = backupRecord.id;

    // 2. Query target symbol in LST
    const nodes = this.queryLSTTree(filePath, symbolName);
    if (nodes.length === 0) {
      throw new Error(`Symbol "${symbolName}" not found in LST for ${filePath}`);
    }

    const targetNode = nodes[0];
    const originalContent = fs.readFileSync(absPath, 'utf-8');

    // 3. Slice and replace target node text losslessly
    const beforeText = originalContent.substring(0, targetNode.startChar);
    const afterText = originalContent.substring(targetNode.endChar);
    const modifiedCode = `${beforeText}${newBodyText}${afterText}`;

    // 4. Save to disk
    fs.writeFileSync(absPath, modifiedCode, 'utf-8');

    return {
      success: true,
      backupId,
      modifiedCode,
    };
  }
}
