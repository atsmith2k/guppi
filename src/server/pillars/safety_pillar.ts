import { PillarModule } from './types.js';
import { GuppiDB } from '../../db/client.js';
import { GuardEngine } from '../../engine/guard.js';
import { GuardEnforcerEngine } from '../../engine/guard_enforcer.js';
import { SelfHealingEngine } from '../../engine/self_heal.js';
import { ExecutionFeedbackEngine } from '../../engine/execution_feedback.js';
import { DependencyAnalyzer } from '../../engine/dependency_analyzer.js';
import { SymbolCallGraphEngine } from '../../engine/symbol_call_graph.js';

export function createSafetyPillar(db: GuppiDB): PillarModule {
  const guardEngine = new GuardEngine(db);
  const guardEnforcer = new GuardEnforcerEngine(db);
  const selfHealingEngine = new SelfHealingEngine(db);
  const feedbackEngine = new ExecutionFeedbackEngine(db);
  const dependencyAnalyzer = new DependencyAnalyzer(db);
  const callGraphEngine = new SymbolCallGraphEngine(db);

  return {
    pillarName: 'Safety, Mutation & Self-Healing',
    description: 'Pre-flight safety guardrails, non-destructive shadow backups, rollbacks, error traceback auto-healing, AST call graph & signature mutation risk analysis.',
    resources: [
      {
        uri: 'guppi://guardrails/rules',
        name: 'Active Safety Guardrail Rules',
        description: 'Workspace pre-flight safety rules and secret patterns.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://graph/dependencies',
        name: 'Symbol & File Dependency Graph',
        description: 'AST dependency relations and import/call graph edges across the workspace.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://feedback/recent',
        name: 'Execution Feedback & Auto-Fix History',
        description: 'Log of error tracebacks, diagnostic matches, and suggested auto-fix diffs.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://backups/recent',
        name: 'Active Shadow File Backups',
        description: 'List of non-destructive shadow backup snapshots created before code edits.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://graph/callgraph',
        name: 'AST Symbol Call Graph & Call Hierarchy',
        description: 'AST symbol caller-callee call graph nodes and edges.',
        mimeType: 'application/json',
      },
    ],
    tools: [
      {
        name: 'guppi_guard_check',
        description:
          '🛡️ PRE-FLIGHT SECRET & RULE CHECK: Verify proposed code snippets or files for hardcoded secrets, API keys, or safety rule violations.',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Code snippet or file content to check' },
            filePath: { type: 'string', description: 'Target file path being created or modified' },
          },
          required: ['content'],
        },
      },
      {
        name: 'guppi_guard_enforce',
        description:
          '🛡️ PRE-FLIGHT AUDIT & SHADOW BACKUP CREATOR: Run pre-flight safety audit before editing a file and automatically create a non-destructive shadow backup snapshot in .guppi/backups/.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Target file path to backup and check' },
            proposedContent: { type: 'string', description: 'Proposed code content' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'guppi_rollback_file',
        description:
          '⏪ EMERGENCY ROLLBACK: Restore a file to its latest shadow backup snapshot if a modification introduced a build failure or regression.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path to rollback' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'guppi_self_heal',
        description:
          '🛠️ EMERGENCY SELF-HEAL & BACKUP: Create emergency backup snapshot and propose AST self-healing repair diff from error tracebacks or failed test assertions.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Target file path needing repair' },
            errorTrace: { type: 'string', description: 'Error traceback or failed assertion log' },
            failedTestName: { type: 'string', description: 'Name of failed test suite (optional)' },
          },
          required: ['filePath', 'errorTrace'],
        },
      },
      {
        name: 'guppi_auto_fix_suggest',
        description:
          '🛠️ SURGICAL AUTO-FIX SYNTHESIZER: Parse terminal error logs or test tracebacks, match against past RAG bug solutions, and receive surgical auto-repair patches.',
        inputSchema: {
          type: 'object',
          properties: {
            commandType: { type: 'string', description: 'Command type (e.g. build, test, typescript, python)' },
            stdout: { type: 'string', description: 'Standard output log' },
            stderr: { type: 'string', description: 'Standard error or traceback log' },
            exitCode: { type: 'number', description: 'Command exit code' },
            filePath: { type: 'string', description: 'Target file path needing fix' },
          },
          required: ['commandType'],
        },
      },
      {
        name: 'guppi_impact_analysis',
        description:
          '🎯 DOWNSTREAM IMPACT ANALYZER: Evaluate downstream breaking changes and caller/file risk score before editing a symbol or file.',
        inputSchema: {
          type: 'object',
          properties: {
            symbolOrPath: { type: 'string', description: 'Function/class symbol name or file path to evaluate' },
          },
          required: ['symbolOrPath'],
        },
      },
      {
        name: 'guppi_dependency_trace',
        description:
          '🕸️ DEPENDENCY TRACER: Query AST dependency graph to trace symbol imports, call references, and class inheritance.',
        inputSchema: {
          type: 'object',
          properties: {
            symbolOrPath: { type: 'string', description: 'Symbol or file path filter' },
          },
        },
      },
      {
        name: 'guppi_call_graph_build',
        description:
          '🕸️ AST CALL GRAPH BUILDER: Scan AST symbols across TypeScript files and build complete caller-callee call hierarchy (Poached from Tree-Sitter & GraphRAG).',
        inputSchema: {
          type: 'object',
        },
      },
      {
        name: 'guppi_signature_mutate_simulate',
        description:
          '🔬 MUTATION RISK SIMULATOR: Simulate mutating a function/method signature, evaluating breaking change risk (0-100%) and listing affected caller sites before editing.',
        inputSchema: {
          type: 'object',
          properties: {
            targetSymbol: { type: 'string', description: 'Function or class method symbol name' },
            proposedSignature: { type: 'string', description: 'New proposed signature' },
          },
          required: ['targetSymbol', 'proposedSignature'],
        },
      },
    ],
    async handleReadResource(uri: string) {
      if (uri === 'guppi://guardrails/rules') {
        const rules = db.getGuardrails();
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(rules, null, 2) }] };
      }
      if (uri === 'guppi://graph/dependencies') {
        const edges = db.getDependencyEdges('', 100);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(edges, null, 2) }] };
      }
      if (uri === 'guppi://feedback/recent') {
        const fb = feedbackEngine.getHistory(20);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(fb, null, 2) }] };
      }
      if (uri === 'guppi://backups/recent') {
        const backups = guardEnforcer.getBackups(20);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(backups, null, 2) }] };
      }
      if (uri === 'guppi://graph/callgraph') {
        const nodes = db.getAllCallGraphNodes();
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(nodes, null, 2) }] };
      }
      return null;
    },
    async handleToolCall(name: string, args: any) {
      if (name === 'guppi_guard_check') {
        const content = (args?.content as string) || '';
        const filePath = (args?.filePath as string) || undefined;
        const res = guardEngine.checkContent(content, filePath);
        if (res.passed) {
          return { content: [{ type: 'text', text: `✅ Guardrail Check Passed! No rule violations detected.` }] };
        }
        let output = `⚠️ Guardrail Check Failed with ${res.violations.length} violation(s):\n`;
        res.violations.forEach((v) => {
          output += `- [${v.severity.toUpperCase()}] ${v.ruleName}: ${v.message}\n  Matched: \`${v.matchedSnippet}\`\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_guard_enforce') {
        const filePath = args?.filePath as string;
        const proposedContent = args?.proposedContent as string | undefined;
        const res = guardEnforcer.preparePreFlight(filePath, proposedContent);
        let output = `🛡️ GUPPI Guard Enforcer Pre-flight Status:\n- Allowed: ${res.allowed ? '✅ YES' : '❌ NO'}\n`;
        if (res.backup) {
          output += `- Shadow Backup Snapshot Created: [${res.backup.id}] -> \`${res.backup.backup_path}\`\n`;
        }
        if (res.violations.length > 0) {
          output += `- Safety Violations:\n  ${res.violations.join('\n  ')}\n`;
        }
        output += `\n💡 Next Suggested Agent Action: Proceed with code modifications. If build/tests fail, run guppi_rollback_file to restore.`;
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_rollback_file') {
        const filePath = args?.filePath as string;
        const res = guardEnforcer.rollbackFile(filePath);
        return { content: [{ type: 'text', text: res.message }] };
      }

      if (name === 'guppi_self_heal') {
        const filePath = (args?.filePath as string) || '';
        const errorTrace = (args?.errorTrace as string) || '';
        const failedTestName = (args?.failedTestName as string) || 'Test Suite';
        const entry = selfHealingEngine.proposeSelfHeal(filePath, errorTrace, failedTestName);
        return {
          content: [
            {
              type: 'text',
              text: `🛠️ GUPPI Emergency Backup Created & Self-Healing Proposed!\n\n- Entry ID: ${entry.id}\n- File: ${entry.file_path}\n- Backup Snapshot: ${entry.backup_snapshot}\n\nProposed Fix:\n${entry.proposed_diff}`,
            },
          ],
        };
      }

      if (name === 'guppi_auto_fix_suggest') {
        const commandType = (args?.commandType as string) || 'build';
        const stdout = (args?.stdout as string) || '';
        const stderr = (args?.stderr as string) || '';
        const exitCode = (args?.exitCode as number) || 1;
        const filePath = (args?.filePath as string) || undefined;
        const res = feedbackEngine.analyzeAndProposeFix(commandType, stdout, stderr, exitCode, filePath);
        return {
          content: [
            {
              type: 'text',
              text: `🛠️ GUPPI Execution Feedback & Surgical Auto-Fix Suggestion:\n\n- Diagnosis: ${res.fix.diagnosis}\n- Target File: ${res.fix.filePath || 'Unknown'}\n- Confidence: ${(res.fix.confidence * 100).toFixed(0)}%\n${res.fix.matchedMemoryTitle ? `- Matched Past Solution: "${res.fix.matchedMemoryTitle}"\n` : ''}\nSuggested Surgical Diff:\n\`\`\`typescript\n${res.fix.suggestedPatch}\n\`\`\``,
            },
          ],
        };
      }

      if (name === 'guppi_impact_analysis') {
        const target = (args?.symbolOrPath as string) || '';
        const report = dependencyAnalyzer.evaluateImpact(target);
        return {
          content: [
            {
              type: 'text',
              text: `🎯 Impact Analysis for "${target}":\n- Risk Level: [${report.riskLevel}]\n- Recommendation: ${report.recommendation}\n- Directly Affected Symbols (${report.directlyAffectedSymbols.length}): ${report.directlyAffectedSymbols.join(', ') || 'None'}\n- Affected Files (${report.affectedFiles.length}): ${report.affectedFiles.join(', ') || 'None'}`,
            },
          ],
        };
      }

      if (name === 'guppi_dependency_trace') {
        const target = (args?.symbolOrPath as string) || '';
        const edges = db.getDependencyEdges(target, 50);
        if (edges.length === 0) {
          return { content: [{ type: 'text', text: `No AST dependency edges found for "${target}".` }] };
        }
        let text = `### AST Dependency Edges for "${target}":\n`;
        edges.forEach((e) => {
          text += `- \`${e.source_symbol}\` --[${e.edge_type}]--> \`${e.target_symbol}\` in ${e.file_path}:${e.line_number}\n`;
        });
        return { content: [{ type: 'text', text }] };
      }

      if (name === 'guppi_call_graph_build') {
        const graph = callGraphEngine.buildCallGraph();
        return {
          content: [
            {
              type: 'text',
              text: `🕸️ AST Symbol Call Graph Built!\n- Total Symbol Nodes: ${graph.nodes.length}\n- Total Call Edges: ${graph.edges.length}\n\nCall Graph Sample:\n${graph.edges.slice(0, 5).map((e) => `- \`${e.caller_symbol}\` calls \`${e.callee_symbol}\` in ${e.file_path}:${e.line_number}`).join('\n') || 'No edges detected.'}`,
            },
          ],
        };
      }

      if (name === 'guppi_signature_mutate_simulate') {
        const targetSymbol = (args?.targetSymbol as string) || '';
        const proposedSignature = (args?.proposedSignature as string) || '';
        const sim = callGraphEngine.simulateSignatureMutation(targetSymbol, proposedSignature);
        return {
          content: [
            {
              type: 'text',
              text: `🔬 Signature Mutation Simulation for "${targetSymbol}":\n- Proposed Signature: \`${proposedSignature}\`\n- Risk Score: [${sim.riskScore}%]\n- Breaking Change Call Sites (${sim.breakingChangeCount}): ${sim.affectedCallSites.map((c) => c.caller_symbol).join(', ') || 'None'}\n- Recommendation: ${sim.recommendation}\n\n💡 Next Suggested Agent Action: Run guppi_guard_enforce before applying code changes to back up callers.`,
            },
          ],
        };
      }

      return null;
    },
  };
}
