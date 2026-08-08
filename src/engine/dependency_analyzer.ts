import { GuppiDB, DependencyEdge } from '../db/client.js';
import fs from 'fs';
import path from 'path';

export interface ImpactReport {
  target: string;
  directlyAffectedSymbols: string[];
  affectedFiles: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  edges: DependencyEdge[];
  recommendation: string;
}

export class DependencyAnalyzer {
  private db: GuppiDB;

  constructor(db: GuppiDB) {
    this.db = db;
  }

  /**
   * Scans a file's content to extract import and call dependency edges.
   */
  public analyzeAndIndexFile(filePath: string, content?: string): DependencyEdge[] {
    const text = content ?? (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '');
    if (!text) return [];

    this.db.clearDependencyEdgesForFile(filePath);
    const lines = text.split('\n');
    const edges: Omit<DependencyEdge, 'id' | 'created_at'>[] = [];

    // Parse import statements: import { Foo, Bar } from './module';
    const importRegex = /import\s+({[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      
      // Match imports
      while ((match = importRegex.exec(line)) !== null) {
        const rawSpecifiers = match[1];
        const modulePath = match[2];
        const cleanSpecifiers = rawSpecifiers.replace(/[{}]/g, '').split(',').map((s) => s.trim().split(' as ')[0]);

        for (const specifier of cleanSpecifiers) {
          if (specifier && specifier !== '*') {
            edges.push({
              source_symbol: path.basename(filePath),
              target_symbol: specifier,
              edge_type: 'imports',
              file_path: filePath,
              line_number: lineIdx + 1,
            });
          }
        }
      }

      // Match class extensions: class Foo extends Bar
      const extendsMatch = /class\s+(\w+)\s+extends\s+(\w+)/.exec(line);
      if (extendsMatch) {
        edges.push({
          source_symbol: extendsMatch[1],
          target_symbol: extendsMatch[2],
          edge_type: 'extends',
          file_path: filePath,
          line_number: lineIdx + 1,
        });
      }

      // Match function calls to known exported functions / methods
      const callMatch = /(\w+)\s*\(/g;
      let cMatch: RegExpExecArray | null;
      while ((cMatch = callMatch.exec(line)) !== null) {
        const fnName = cMatch[1];
        if (!['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'import', 'export', 'console', 'require'].includes(fnName)) {
          edges.push({
            source_symbol: path.basename(filePath),
            target_symbol: fnName,
            edge_type: 'calls',
            file_path: filePath,
            line_number: lineIdx + 1,
          });
        }
      }
    }

    return this.db.addDependencyEdgesBatch(edges);
  }

  /**
   * Evaluates downstream breaking change impact for a symbol or file path.
   */
  public evaluateImpact(symbolOrPath: string): ImpactReport {
    const cleanTarget = path.basename(symbolOrPath);
    const matchingEdges = this.db.getDependencyEdges(cleanTarget, 500);

    const affectedSymbols = new Set<string>();
    const affectedFiles = new Set<string>();

    for (const edge of matchingEdges) {
      affectedSymbols.add(edge.source_symbol);
      affectedSymbols.add(edge.target_symbol);
      affectedFiles.add(edge.file_path);
    }

    const count = affectedFiles.size;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (count > 5) riskLevel = 'HIGH';
    else if (count > 1) riskLevel = 'MEDIUM';

    let recommendation = `Modifying "${cleanTarget}" affects ${count} file(s).`;
    if (riskLevel === 'HIGH') {
      recommendation += ` CAUTION: High downstream impact detected across ${count} files. Run regression tests before committing.`;
    } else if (riskLevel === 'MEDIUM') {
      recommendation += ` Verify callers in ${Array.from(affectedFiles).join(', ')}.`;
    } else {
      recommendation += ` Low impact. Standard unit verification recommended.`;
    }

    return {
      target: symbolOrPath,
      directlyAffectedSymbols: Array.from(affectedSymbols),
      affectedFiles: Array.from(affectedFiles),
      riskLevel,
      edges: matchingEdges,
      recommendation,
    };
  }
}
