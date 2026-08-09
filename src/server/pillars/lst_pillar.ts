import { PillarModule } from './types.js';
import { GuppiDB } from '../../db/client.js';
import { LSTTraversalEngine } from '../../engine/lst_traversal.js';

export function createLSTTraversalPillar(db: GuppiDB): PillarModule {
  const lstEngine = new LSTTraversalEngine(db);

  return {
    pillarName: 'LST & Codebase Traversal',
    description: 'Serena-style symbol searching, Lossless Semantic Tree (LST) structural queries, reference tracing, and atomic symbol edits.',
    resources: [
      {
        uri: 'guppi://lst/symbols/all',
        name: 'Lossless Semantic Symbols Index',
        description: 'Complete index of AST/LST symbols enriched with GUPPI memory links and Fact Graph triples.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://recipes/codebase_traversal',
        name: 'LST Traversal & Lookup Recipes Matrix',
        description: 'Decision matrix for Serena-style symbol navigation and LST token compression workflows.',
        mimeType: 'application/json',
      },
    ],
    tools: [
      {
        name: 'guppi_lst_find_symbols',
        description:
          '🔍 SERENA SYMBOL SEARCH: Scope-aware and fuzzy symbol lookup returning exact declarations, AST signatures, docstrings, related RAG memories, and Fact Triples.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Symbol name or search query' },
            scope: { type: 'string', description: 'Optional scope or file filter' },
          },
          required: ['query'],
        },
      },
      {
        name: 'guppi_lst_query_tree',
        description:
          '🌳 LST STRUCTURAL QUERY: Traverse a file using Lossless Semantic Tree selectors (e.g. "ClassDeclaration > MethodDeclaration[name=\'runOnboarding\']").',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path to query' },
            selector: { type: 'string', description: 'LST structural selector query' },
          },
          required: ['filePath', 'selector'],
        },
      },
      {
        name: 'guppi_lst_find_references',
        description:
          '🕸️ CROSS-FILE REFERENCE TRACER: Find all caller sites, method invocations, instantiations, type usages, and imports for a symbol across the workspace.',
        inputSchema: {
          type: 'object',
          properties: {
            symbolName: { type: 'string', description: 'Target symbol name' },
          },
          required: ['symbolName'],
        },
      },
      {
        name: 'guppi_lst_skeleton_slice',
        description:
          '⚡ LOSSLESS SKELETON SLICE: Generate token-efficient folded code slice collapsing implementation bodies while preserving top-level signatures, types, comments, and docstrings.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path to generate folded LST slice for' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'guppi_lst_replace_symbol',
        description:
          '🛠️ ATOMIC SYMBOL REPLACEMENT: Replace target symbol body losslessly while preserving surrounding code formatting. Automatically creates a shadow backup snapshot first.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path containing symbol' },
            symbolName: { type: 'string', description: 'Symbol name to replace' },
            newBodyText: { type: 'string', description: 'New replacement source code text' },
          },
          required: ['filePath', 'symbolName', 'newBodyText'],
        },
      },
    ],
    async handleReadResource(uri: string) {
      if (uri === 'guppi://lst/symbols/all') {
        const symbols = lstEngine.findSymbols('');
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(symbols, null, 2) }] };
      }
      if (uri === 'guppi://recipes/codebase_traversal') {
        const recipes = {
          traversal_recipes: [
            {
              workflow: 'High-Precision Symbol Navigation',
              chain: ['guppi_lst_find_symbols', 'guppi_lst_find_references', 'guppi_lst_skeleton_slice'],
              description: 'Locates exact symbol declaration, traces callers, and reads folded context with 80% token savings.',
            },
            {
              workflow: 'Atomic Code Transformation with Zero Risk',
              chain: ['guppi_lst_find_references', 'guppi_lst_replace_symbol', 'guppi_rollback_file'],
              description: 'Traces references, applies surgical LST symbol replacement, and provides 1-click rollback snapshot.',
            },
          ],
        };
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(recipes, null, 2) }] };
      }
      return null;
    },
    async handleToolCall(name: string, args: any) {
      if (name === 'guppi_lst_find_symbols') {
        const query = (args?.query as string) || '';
        const scope = args?.scope as string;
        const matches = lstEngine.findSymbols(query, scope);

        if (matches.length === 0) {
          return { content: [{ type: 'text', text: `No LST symbols found matching "${query}".` }] };
        }

        let output = `### 🔍 Serena LST Symbol Matches for "${query}":\n\n`;
        matches.forEach((m) => {
          output += `- **\`${m.symbolName}\`** (\`${m.kind}\`) in [${m.filePath}](file://${m.filePath}#L${m.lineStart}-L${m.lineEnd})\n`;
          output += `  Signature: \`${m.signature}\`\n`;
          if (m.docstring) output += `  Docstring: ${m.docstring}\n`;
          if (m.relatedMemories && m.relatedMemories.length > 0) {
            output += `  🧠 Related Memories: ${m.relatedMemories.map((r) => `"${r.title}"`).join(', ')}\n`;
          }
          if (m.factTriples && m.factTriples.length > 0) {
            output += `  🕸️ Fact Graph: ${m.factTriples.map((f) => `\`${f.subject}\` -> \`${f.object}\``).join(', ')}\n`;
          }
          output += `\n`;
        });
        output += `💡 Next Suggested Action: Run guppi_lst_find_references on "${query}" to trace callers across the codebase.`;
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_lst_query_tree') {
        const filePath = (args?.filePath as string) || '';
        const selector = (args?.selector as string) || '';
        const nodes = lstEngine.queryLSTTree(filePath, selector);

        if (nodes.length === 0) {
          return { content: [{ type: 'text', text: `No LST nodes matching selector "${selector}" in ${filePath}.` }] };
        }

        let output = `### 🌳 LST Nodes for "${selector}" in \`${filePath}\` (${nodes.length} matches):\n\n`;
        nodes.forEach((n) => {
          output += `- **\`${n.name || n.kind}\`** (\`${n.kind}\`) Lines ${n.startLine}-${n.endLine}\n`;
          output += `\`\`\`typescript\n${n.text.slice(0, 300)}${n.text.length > 300 ? '\n... [truncated]' : ''}\n\`\`\`\n\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_lst_find_references') {
        const symbolName = (args?.symbolName as string) || '';
        const refs = lstEngine.findReferences(symbolName);

        if (refs.length === 0) {
          return { content: [{ type: 'text', text: `No references found for symbol "${symbolName}".` }] };
        }

        let output = `### 🕸️ Cross-File References for "${symbolName}" (${refs.length} references):\n\n`;
        refs.forEach((r) => {
          output += `- [\`${r.filePath}:L${r.lineNumber}\`](file://${r.filePath}#L${r.lineNumber}) in \`${r.callerSymbol}\` [${r.callType}]\n`;
          output += `  \`${r.lineSnippet}\`\n\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_lst_skeleton_slice') {
        const filePath = (args?.filePath as string) || '';
        const skeleton = lstEngine.skeletonSlice(filePath);
        return {
          content: [
            {
              type: 'text',
              text: `### ⚡ Lossless Skeleton Slice for \`${filePath}\`:\n\`\`\`typescript\n${skeleton}\n\`\`\``,
            },
          ],
        };
      }

      if (name === 'guppi_lst_replace_symbol') {
        const filePath = (args?.filePath as string) || '';
        const symbolName = (args?.symbolName as string) || '';
        const newBodyText = (args?.newBodyText as string) || '';

        const res = lstEngine.replaceSymbolBody(filePath, symbolName, newBodyText);

        return {
          content: [
            {
              type: 'text',
              text: `✅ Atomic Symbol Replacement Complete!\n\n- Symbol: \`${symbolName}\`\n- File: \`${filePath}\`\n- Shadow Backup Created: \`${res.backupId}\`\n\n💡 Next Suggested Action: If edit needs rollback, run guppi_rollback_file with file path \`${filePath}\`.`,
            },
          ],
        };
      }

      return null;
    },
  };
}
