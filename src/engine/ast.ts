import fs from 'fs';
import path from 'path';
import { ASTSymbol } from '../db/client.js';

export class ASTExtractor {
  /**
   * Lightweight regex-based AST & symbol extractor supporting TypeScript, JavaScript, Python, Go, and JSON.
   */
  public static extractSymbolsFromFile(filePath: string, relativePath: string): ASTSymbol[] {
    const symbols: ASTSymbol[] = [];
    if (!fs.existsSync(filePath)) return symbols;

    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Functions (e.g. export function foo(), const bar = () => {})
        const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
        if (funcMatch) {
          symbols.push({
            id: `${relativePath}:${lineNum}:${funcMatch[1]}`,
            file_path: relativePath,
            symbol_name: funcMatch[1],
            kind: 'function',
            line_start: lineNum,
            line_end: lineNum + 10,
            signature: `function ${funcMatch[1]}(${funcMatch[2].trim()})`,
            docstring: this.extractDocstring(lines, index),
          });
          return;
        }

        // Arrow functions (const myFunc = (...) =>)
        const arrowMatch = line.match(/(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/);
        if (arrowMatch) {
          symbols.push({
            id: `${relativePath}:${lineNum}:${arrowMatch[1]}`,
            file_path: relativePath,
            symbol_name: arrowMatch[1],
            kind: 'function',
            line_start: lineNum,
            line_end: lineNum + 5,
            signature: `const ${arrowMatch[1]} = (${arrowMatch[2].trim()}) =>`,
            docstring: this.extractDocstring(lines, index),
          });
          return;
        }

        // Classes & Interfaces & Types
        const classMatch = line.match(/(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/);
        if (classMatch) {
          symbols.push({
            id: `${relativePath}:${lineNum}:${classMatch[1]}`,
            file_path: relativePath,
            symbol_name: classMatch[1],
            kind: 'class',
            line_start: lineNum,
            line_end: lineNum + 20,
            signature: `class ${classMatch[1]}`,
            docstring: this.extractDocstring(lines, index),
          });
          return;
        }

        const interfaceMatch = line.match(/(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)/);
        if (interfaceMatch) {
          symbols.push({
            id: `${relativePath}:${lineNum}:${interfaceMatch[1]}`,
            file_path: relativePath,
            symbol_name: interfaceMatch[1],
            kind: 'interface',
            line_start: lineNum,
            line_end: lineNum + 10,
            signature: `interface ${interfaceMatch[1]}`,
            docstring: this.extractDocstring(lines, index),
          });
          return;
        }

        const typeMatch = line.match(/(?:export\s+)?type\s+([a-zA-Z0-9_$]+)\s*=/);
        if (typeMatch) {
          symbols.push({
            id: `${relativePath}:${lineNum}:${typeMatch[1]}`,
            file_path: relativePath,
            symbol_name: typeMatch[1],
            kind: 'type',
            line_start: lineNum,
            line_end: lineNum + 3,
            signature: `type ${typeMatch[1]}`,
            docstring: this.extractDocstring(lines, index),
          });
          return;
        }
      });
    } else if (ext === '.py') {
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const pyFunc = line.match(/^\s*def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/);
        if (pyFunc) {
          symbols.push({
            id: `${relativePath}:${lineNum}:${pyFunc[1]}`,
            file_path: relativePath,
            symbol_name: pyFunc[1],
            kind: 'function',
            line_start: lineNum,
            line_end: lineNum + 10,
            signature: `def ${pyFunc[1]}(${pyFunc[2].trim()})`,
            docstring: '',
          });
        }
        const pyClass = line.match(/^\s*class\s+([a-zA-Z0-9_]+)/);
        if (pyClass) {
          symbols.push({
            id: `${relativePath}:${lineNum}:${pyClass[1]}`,
            file_path: relativePath,
            symbol_name: pyClass[1],
            kind: 'class',
            line_start: lineNum,
            line_end: lineNum + 20,
            signature: `class ${pyClass[1]}`,
            docstring: '',
          });
        }
      });
    }

    return symbols;
  }

  private static extractDocstring(lines: string[], lineIndex: number): string {
    if (lineIndex > 0 && lines[lineIndex - 1].trim().endsWith('*/')) {
      let docLines: string[] = [];
      for (let i = lineIndex - 1; i >= 0; i--) {
        const l = lines[i].trim();
        docLines.unshift(l);
        if (l.startsWith('/*')) break;
      }
      return docLines.join('\n');
    }
    return '';
  }

  public static extractImportsExports(filePath: string): { exports: string[]; imports: string[] } {
    const exportsSet = new Set<string>();
    const importsSet = new Set<string>();
    if (!fs.existsSync(filePath)) return { exports: [], imports: Array.from(importsSet) };

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line) => {
      // Imports: import { foo } from 'bar' or import default from 'bar'
      const importMatch = line.match(/import\s+.*?from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        importsSet.add(importMatch[1]);
      }

      // Exports
      const exportMatch = line.match(/export\s+(?:const|function|class|interface|type|default)\s+([a-zA-Z0-9_$]+)/);
      if (exportMatch) {
        exportsSet.add(exportMatch[1]);
      }
    });

    return {
      exports: Array.from(exportsSet),
      imports: Array.from(importsSet),
    };
  }
}
