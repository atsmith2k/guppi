import { PillarModule } from './types.js';
import { GuppiDB } from '../../db/client.js';
import { OnboardingEngine } from '../../engine/onboarder.js';
import { RAGEngine } from '../../engine/rag.js';
import { CodeSkeletonizer } from '../../engine/skeletonizer.js';

export function createContextPillar(db: GuppiDB): PillarModule {
  const onboarder = new OnboardingEngine(db);
  const ragEngine = new RAGEngine(db);

  return {
    pillarName: 'Context & Compression',
    description: 'Workspace onboarding, AST code skeletonization, symbol inspection, and git history search.',
    resources: [
      {
        uri: 'guppi://symbols/all',
        name: 'Codebase AST Symbol Map',
        description: 'Complete AST symbol index of functions, classes, and types across the workspace.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://git/history',
        name: 'Git Commit History & Diffs',
        description: 'Git commit history and file diff summaries for change rationale research.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://recipes/tool_selection',
        name: 'Agentic Tool Selection Recipes Matrix',
        description: 'Decision matrix mapping developer tasks to optimal GUPPI tool execution chains.',
        mimeType: 'application/json',
      },
    ],
    tools: [
      {
        name: 'guppi_onboard',
        description:
          '🔄 WORKSPACE RE-SCAN: Run after creating or refactoring major files to refresh GUPPI AST index, symbol signatures, dependency graphs, and rule files.',
        inputSchema: {
          type: 'object',
          properties: {
            force: { type: 'boolean', description: 'Force re-indexing all workspace files' },
          },
        },
      },
      {
        name: 'guppi_query_context',
        description:
          '🔍 HYBRID RAG SEARCH: Perform semantic BM25/FTS5 search over past architectural decisions, project rules, bug solutions, and AST symbol signatures before starting complex tasks.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Semantic context query or technical question' },
            maxItems: { type: 'number', description: 'Max number of memory items to return (default 5)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'guppi_skeletonize',
        description:
          '⚡ MANDATORY TOKEN SAVER (70-80% Savings): Use INSTEAD OF reading entire 150+ line files when exploring class structures or signatures. Strips function implementation bodies while retaining imports, class/interface signatures, and docstrings.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path to skeletonize' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'guppi_inspect_symbol',
        description:
          '⚡ INSTANT SYMBOL LOOKUP: Retrieve function, class, or type AST signatures, docstrings, exports, and line numbers without reading large source files.',
        inputSchema: {
          type: 'object',
          properties: {
            symbolName: { type: 'string', description: 'Name of function, class, or type' },
          },
          required: ['symbolName'],
        },
      },
      {
        name: 'guppi_git_rag',
        description:
          '📜 GIT DIFF RAG: Search git commit history and diff database to discover WHY code changes were made or who modified specific components.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Commit query or keyword search' },
          },
          required: ['query'],
        },
      },
    ],
    async handleReadResource(uri: string) {
      if (uri === 'guppi://symbols/all') {
        const symbols = db.querySymbols('', 200);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(symbols, null, 2) }] };
      }
      if (uri === 'guppi://git/history') {
        const commits = db.queryGitCommits('', 50);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(commits, null, 2) }] };
      }
      if (uri === 'guppi://recipes/tool_selection') {
        const recipes = {
          task_recipes: [
            {
              goal: 'Understanding large source files without blowing context window',
              recommended_chain: ['guppi_skeletonize', 'guppi_inspect_symbol'],
              benefit: 'Saves 70-80% LLM tokens while providing exact signatures.',
            },
            {
              goal: 'Refactoring a function signature or public method',
              recommended_chain: ['guppi_inspect_symbol', 'guppi_signature_mutate_simulate', 'guppi_impact_analysis', 'guppi_guard_enforce'],
              benefit: 'Evaluates downstream callers and creates safety backup before edit.',
            },
            {
              goal: 'Fixing runtime build failure or test error',
              recommended_chain: ['guppi_auto_fix_suggest', 'guppi_self_heal', 'guppi_rollback_file'],
              benefit: 'Parses traceback, matches past RAG solutions, and proposes surgical patch.',
            },
            {
              goal: 'Decomposing complex multi-agent feature request',
              recommended_chain: ['guppi_brainstorm_start', 'guppi_task_plan_create', 'guppi_task_step_update', 'guppi_subagent_checkpoint'],
              benefit: 'Structured DAG execution plan and subagent context handoffs.',
            },
          ],
        };
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(recipes, null, 2) }] };
      }
      return null;
    },
    async handleToolCall(name: string, args: any) {
      if (name === 'guppi_onboard') {
        const report = await onboarder.runOnboarding();
        return {
          content: [
            {
              type: 'text',
              text: `✅ GUPPI Onboarding Complete!\n\n- Project: ${report.projectName}\n- Framework: ${report.framework}\n- Total Files Indexed: ${report.totalFiles}\n- Total Lines: ${report.totalLines}\n- AST Symbols Extracted: ${report.symbolCount}\n- Rule Files Found: ${report.ruleFilesFound.join(', ') || 'None'}\n- Memories Created: ${report.memoriesCreated}\n- Duration: ${report.durationMs}ms\n\n💡 Next Suggested Agent Action: Query workspace context using guppi_query_context or explore AST symbols with guppi_inspect_symbol.`,
            },
          ],
        };
      }

      if (name === 'guppi_query_context') {
        const query = (args?.query as string) || '';
        const maxItems = (args?.maxItems as number) || 5;
        const res = ragEngine.queryContext(query, maxItems);
        return {
          content: [
            {
              type: 'text',
              text: `${res.synthesizedContext}\n\n💡 Next Suggested Agent Action: If modifying complex files, run guppi_guard_enforce to create a shadow backup snapshot first.`,
            },
          ],
        };
      }

      if (name === 'guppi_skeletonize') {
        const filePath = (args?.filePath as string) || '';
        const skeleton = CodeSkeletonizer.skeletonizeFile(filePath);
        return {
          content: [
            {
              type: 'text',
              text: `### AST Code Skeleton for \`${filePath}\` (Implementation Bodies Folded):\n\`\`\`typescript\n${skeleton}\n\`\`\`\n\n💡 Next Suggested Agent Action: Inspect specific symbols with guppi_inspect_symbol or simulate changes with guppi_signature_mutate_simulate.`,
            },
          ],
        };
      }

      if (name === 'guppi_inspect_symbol') {
        const symbolName = (args?.symbolName as string) || '';
        const symbols = db.querySymbols(symbolName);
        if (symbols.length === 0) {
          return { content: [{ type: 'text', text: `No AST symbols found matching "${symbolName}".` }] };
        }
        let output = `### AST Symbols matching "${symbolName}":\n`;
        symbols.forEach((s) => {
          output += `- \`${s.signature}\` (${s.kind}) in [${s.file_path}](file://${s.file_path}#L${s.line_start}-L${s.line_end})\n`;
          if (s.docstring) output += `  Docstring: ${s.docstring.trim()}\n`;
        });
        output += `\n💡 Next Suggested Agent Action: Run guppi_impact_analysis on "${symbolName}" to evaluate downstream breaking changes before editing.`;
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_git_rag') {
        const query = (args?.query as string) || '';
        const commits = db.queryGitCommits(query, 10);
        if (commits.length === 0) {
          return { content: [{ type: 'text', text: `No Git commits found matching "${query}".` }] };
        }
        let text = `### Git History matches for "${query}":\n`;
        commits.forEach((c) => {
          text += `- [**${c.hash}**] ${c.message} (${c.author}, ${c.date})\n  Files:\n${c.files_changed}\n\n`;
        });
        return { content: [{ type: 'text', text }] };
      }

      return null;
    },
  };
}
