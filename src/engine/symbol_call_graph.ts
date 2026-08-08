import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import { GuppiDB, CallGraphNode, CallGraphEdge } from '../db/client.js';

export class SymbolCallGraphEngine {
  constructor(private db: GuppiDB, private workspaceDir: string = process.cwd()) {}

  public buildCallGraph(): { nodes: Omit<CallGraphNode, 'id'>[]; edges: Omit<CallGraphEdge, 'id'>[] } {
    const files = glob.sync('src/**/*.{ts,tsx}', { cwd: this.workspaceDir, ignore: ['node_modules/**', 'dist/**'] });

    const nodesMap = new Map<string, Omit<CallGraphNode, 'id'>>();
    const edgesList: Omit<CallGraphEdge, 'id'>[] = [];

    // First pass: extract export class / function signatures as nodes
    for (const relPath of files) {
      const absPath = path.join(this.workspaceDir, relPath);
      const content = fs.readFileSync(absPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        // Function declaration match
        const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
        if (funcMatch) {
          nodesMap.set(funcMatch[1], {
            symbol_name: funcMatch[1],
            kind: 'function',
            file_path: relPath,
            line_number: lineNum,
            signature: `function ${funcMatch[1]}(${funcMatch[2]})`,
          });
        }

        // Class method match
        const methodMatch = line.match(/(?:public|private|protected|static|async)?\s*([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*[:{]/);
        if (methodMatch && !['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(methodMatch[1])) {
          nodesMap.set(methodMatch[1], {
            symbol_name: methodMatch[1],
            kind: 'method',
            file_path: relPath,
            line_number: lineNum,
            signature: `${methodMatch[1]}(${methodMatch[2]})`,
          });
        }
      });
    }

    // Second pass: extract call expressions linking caller symbol to callee symbol
    const knownSymbols = Array.from(nodesMap.keys());
    for (const relPath of files) {
      const absPath = path.join(this.workspaceDir, relPath);
      const content = fs.readFileSync(absPath, 'utf-8');
      const lines = content.split('\n');

      let currentCaller = 'module_body';
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // Check if entering new method/function
        const declMatch = line.match(/(?:function|class)\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*[:{]/);
        if (declMatch) {
          const found = declMatch[1] || declMatch[2];
          if (found && knownSymbols.includes(found)) {
            currentCaller = found;
          }
        }

        // Check calls to known symbols
        for (const sym of knownSymbols) {
          if (sym !== currentCaller && line.includes(sym) && (line.includes(`${sym}(`) || line.includes(`.${sym}(`) || line.includes(`new ${sym}`))) {
            edgesList.push({
              caller_symbol: currentCaller,
              callee_symbol: sym,
              file_path: relPath,
              line_number: lineNum,
              call_type: line.includes(`new ${sym}`) ? 'instantiation' : line.includes(`.${sym}`) ? 'method_invocation' : 'direct_call',
            });
          }
        }
      });
    }

    const nodes = Array.from(nodesMap.values());
    this.db.saveCallGraphNodesAndEdges(nodes, edgesList);

    return { nodes, edges: edgesList };
  }

  public simulateSignatureMutation(targetSymbol: string, proposedSignature: string): {
    targetSymbol: string;
    proposedSignature: string;
    riskScore: number;
    breakingChangeCount: number;
    affectedCallSites: CallGraphEdge[];
    recommendation: string;
  } {
    const edges = this.db.getCallGraphEdgesForSymbol(targetSymbol);
    const callers = edges.filter((e) => e.callee_symbol === targetSymbol);

    const breakingChangeCount = callers.length;
    let riskScore = 10;
    if (breakingChangeCount > 0) riskScore = Math.min(30 + breakingChangeCount * 15, 95);

    let recommendation = 'Low risk: No callers detected. Safe to refactor signature directly.';
    if (riskScore >= 70) {
      recommendation = `CRITICAL RISK (${riskScore}%): Mutating "${targetSymbol}" will break ${breakingChangeCount} call sites across the codebase. Overload method or update callers first!`;
    } else if (riskScore >= 40) {
      recommendation = `MODERATE RISK (${riskScore}%): "${targetSymbol}" has ${breakingChangeCount} caller(s). Update call parameters in affected files.`;
    }

    return {
      targetSymbol,
      proposedSignature,
      riskScore,
      breakingChangeCount,
      affectedCallSites: callers,
      recommendation,
    };
  }
}
