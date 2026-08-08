import fs from 'fs';
import path from 'path';

export class CodeSkeletonizer {
  /**
   * Generates a compressed "code skeleton" for TypeScript, JavaScript, Python, Go, etc.
   * Strips internal function/class method implementation bodies while preserving imports,
   * type definitions, interfaces, signatures, and docstrings.
   */
  public static skeletonizeFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return `[File Not Found: ${filePath}]`;
    }

    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      let inFunctionBody = false;
      let braceDepth = 0;
      const skeletonLines: string[] = [];

      lines.forEach((line) => {
        const trimmed = line.trim();

        // Preserve imports, exports, interfaces, type aliases
        if (
          trimmed.startsWith('import ') ||
          trimmed.startsWith('export interface') ||
          trimmed.startsWith('interface ') ||
          trimmed.startsWith('export type') ||
          trimmed.startsWith('type ')
        ) {
          skeletonLines.push(line);
          return;
        }

        // Detect function / method signature start
        const isFunctionSig =
          /(?:export\s+)?(?:async\s+)?function\s+[a-zA-Z0-9_$]+/i.test(line) ||
          /(?:export\s+)?const\s+[a-zA-Z0-9_$]+\s*=\s*(?:async\s*)?\(/i.test(line) ||
          /(?:public|private|protected)?\s*(?:async\s+)?[a-zA-Z0-9_$]+\s*\([^)]*\)\s*[:{]/i.test(line);

        const isClassHeader = /(?:export\s+)?class\s+[a-zA-Z0-9_$]+/i.test(line);

        if (isClassHeader) {
          skeletonLines.push(line);
          return;
        }

        if (isFunctionSig) {
          const sig = line.substring(0, line.indexOf('{') > -1 ? line.indexOf('{') : line.length);
          skeletonLines.push(`${sig} { /* ... implementation folded ... */ }`);
        }
      });

      return skeletonLines.length > 0 ? skeletonLines.join('\n') : lines.slice(0, 30).join('\n') + '\n/* ... folded ... */';
    } else if (ext === '.py') {
      const pyLines = lines.filter(
        (l) => l.startsWith('import ') || l.startsWith('from ') || l.startsWith('def ') || l.startsWith('class ') || l.trim().startsWith('#')
      );
      return pyLines.join('\n');
    }

    // Default fallback: first 40 lines
    return lines.slice(0, 40).join('\n') + '\n/* ... implementation body folded ... */';
  }
}
