# 🐟 GUPPI — General-purpose Unifying Pluggable Intelligence

> **A standalone agentic sidecar, RAG memory engine, AST code compressor, and telemetry control deck designed to plug alongside any AI coding agent.**

[![Node.js](https://img.shields.io/badge/Node.js-v22.22+-emerald?style=flat-square&logo=node.js)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite_WAL-blue?style=flat-square&logo=sqlite)](https://sqlite.org)
[![MCP](https://img.shields.io/badge/Protocol-Model_Context_Protocol-purple?style=flat-square)](https://modelcontextprotocol.io)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local_%26_Offline-success?style=flat-square)]()

---

## 🌟 Overview

**GUPPI** (*General-purpose Unifying Pluggable Intelligence*) is a plug-and-play sidecar server and memory engine that hooks into your development workspace alongside primary AI agents (**Antigravity CLI**, **Claude Code**, **Cursor**, **Windsurf**, **Pi**, **AutoGen**, **CrewAI**).

Instead of replacing existing workflows, GUPPI operates in the background as an **"additional set of eyes"** — programmatically indexing codebase AST symbols, storing long-term architectural decisions, compressing prompts via AST code skeletonization, monitoring git diff histories, running pre-flight safety guardrails, and serving an interactive **Web Control Deck** on `http://localhost:3737`.

---

## ✨ Key Pillars & Features

| Pillar | Description | Key Engine / Tool |
| :--- | :--- | :--- |
| 🔍 **Programmatic Onboarding** | Traverses workspace files, parses AST symbols, extracts rule files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`), and indexes everything into SQLite. | `guppi onboard` / `OnboardingEngine` |
| 🧠 **Cortex RAG Memory** | Hybrid BM25/FTS5 text search + vector similarity ranking for persistent decision recall across sessions. | `guppi query` / `RAGEngine` |
| 🦴 **AST Code Skeletonizer** | Strips implementation bodies while preserving imports, class definitions, interfaces, and signatures (saves **~70%–80% LLM tokens**). | `guppi_skeletonize` / `CodeSkeletonizer` |
| 📜 **Git History & Diff RAG** | Indexes `.git` commit logs, commit messages, and diff summaries to answer questions about the *"why"* behind code changes. | `guppi_git_rag` / `git_commits_fts` |
| 💡 **Interactive Q&A Brainstorm Studio** | Guided ideation framework (Starbursting, 5-Whys, SCAMPER, Critic Pass) that synthesizes atomic **Spec Blueprints** for primary agents. | `guppi_brainstorm_start` / `BrainstormEngine` |
| 📋 **Task Planner & DAG Orchestrator** | Decomposes complex requests into multi-agent DAG task dependency graphs with role assignments (Poached from Aider & Superpowers). | `guppi plan` / `TaskPlannerEngine` |
| 🧠 **Decay-Ranked Episodic Memory & Fact Graph** | Ebbinghaus decay memory curve retention with subject-relation-object Fact Graph extraction (Poached from Mem0 & MemGPT). | `guppi facts` / `EpisodicMemoryEngine` |
| 📊 **Agent RAG Precision Eval Studio** | Benchmarks agent context precision, answer faithfulness scores, execution latency, and token costs (Poached from DeepEval & AgentOps). | `guppi eval` / `AgentEvalEngine` |
| 🕸️ **Symbol Call Graph & Mutation Simulator** | Scans AST caller-callee hierarchies and simulates signature mutations to predict breaking change risk (Poached from Tree-Sitter & GraphRAG). | `guppi callgraph` / `SymbolCallGraphEngine` |
| 🛠️ **Self-Healing Engine & Backups** | Creates emergency backup snapshots in `.guppi/backups/`, analyzes runtime error traces, and proposes AST repair diffs. | `guppi_self_heal` / `SelfHealingEngine` |
| 🌐 **Multi-Repo Knowledge Mesh** | Links external local repositories into a unified knowledge mesh for cross-codebase symbol searching. | `guppi_mesh_query` / `MultiRepoMeshEngine` |
| 🧪 **Automated Unit Test Generator** | Inspects AST function signatures and writes isolated unit test suites in `test/generated/`. | `guppi_generate_tests` / `TestGenEngine` |
| 🗂️ **Virtual Context Filesystem** | Exposes workspace knowledge as virtual resources (`guppi://memories/all`, `guppi://tasks/active`, `guppi://facts/graph`). | MCP Resources / `ReadResourceHandler` |
| 🖥️ **Web Control Deck** | Modern glassmorphic dark mode dashboard served at `http://localhost:3737`. | React + Vite Dashboard |

---

## ⚡ Quick Start CLI

```bash
# 1. Install & Link GUPPI globally
npm install
npm run build
npm link

# 2. Initialize GUPPI in your project (creates .guppi/guppi.db and .guppi/mcp.json)
guppi init

# 3. Start the background server daemon & Web Dashboard
guppi start

# 4. Check workspace status and memory counts
guppi status

# 5. Decompose a goal into a DAG task plan
guppi plan "Build OAuth2 authentication engine"

# 6. Query extracted Fact Triples graph
guppi facts "GuppiDB"

# 7. Run AST Call Graph & Signature Mutation Simulator
guppi callgraph GuppiDB

# 8. Query GUPPI RAG memory from CLI
guppi query "SQLite WAL mode"

# 9. Save an architectural decision to memory
guppi remember "Use SQLite WAL" "SQLite WAL mode enables sub-millisecond concurrent reads/writes."

# 10. Run stdio MCP server for agent pipes
guppi mcp
```

---

## 🔌 Agent Integration (Model Context Protocol - MCP)

Add this configuration snippet to your primary agent's setting file (e.g. `mcp_config.json` or `.guppi/mcp.json`):

```json
{
  "mcpServers": {
    "guppi": {
      "command": "guppi",
      "args": ["mcp"],
      "env": {
        "GUPPI_WORKSPACE": "/path/to/your/project"
      }
    }
  }
}
```

---

## 🛠️ Complete MCP Tools Reference (20 Tools)

| Tool Name | Input Parameters | Description |
| :--- | :--- | :--- |
| `guppi_task_plan_create` | `{ goal: string, title?: string }` | Decomposes goal into multi-agent DAG task plan. |
| `guppi_task_step_update` | `{ stepId: string, status: string, result?: string }` | Updates step status in DAG orchestrator. |
| `guppi_episodic_remember` | `{ topic: string, content: string, importanceScore?: number }` | Stores episodic memory & extracts Fact Graph. |
| `guppi_query_facts` | `{ query: string }` | Queries extracted subject-relation-object Fact Triples. |
| `guppi_evaluate_run` | `{ agentId: string, queryPrompt: string, responseText: string }` | Benchmarks precision, faithfulness, latency, and token cost. |
| `guppi_call_graph_build` | `{}` | Scans AST symbols and builds caller-callee graph hierarchy. |
| `guppi_signature_mutate_simulate` | `{ targetSymbol: string, proposedSignature: string }` | Simulates signature mutation & evaluates breaking change risk. |
| `guppi_onboard` | `{ force?: boolean }` | Programmatically scans workspace & AST symbols. |
| `guppi_query_context` | `{ query: string, maxItems?: number }` | Hybrid RAG search over memories, rules, and symbols. |
| `guppi_brainstorm_start` | `{ topic: string }` | Starts an interactive Q&A brainstorming session. |
| `guppi_brainstorm_answer` | `{ sessionId: string, answer: string }` | Submits Q&A answer and advances phase or synthesizes spec. |
| `guppi_skeletonize` | `{ filePath: string }` | Generates token-compressed AST code skeleton (~70–80% savings). |
| `guppi_git_rag` | `{ query: string }` | Queries Git commit history & diff database. |
| `guppi_compact_session` | `{ summary: string, nextSteps?: string }` | Saves structured Handoff Checkpoint to Working Memory. |
| `guppi_remember` | `{ title: string, content: string, category?: string }` | Saves long-term architectural decision. |
| `guppi_working_memory` | `{ action: 'get'\|'set'\|'get_all', key?: string, value?: string }` | Manages ephemeral working memory scratchpad. |
| `guppi_link_knowledge` | `{ memoryId: string, targetId: string, relationType?: string }` | Creates Knowledge Graph edge (`memory` $\rightarrow$ `symbol/file`). |
| `guppi_inspect_symbol` | `{ symbolName: string }` | Queries function/class AST signatures without opening files. |
| `guppi_guard_check` | `{ content: string, filePath?: string }` | Runs pre-flight safety & secret detection checks. |
| `guppi_log_telemetry` | `{ agentId: string, stepName: string, toolName: string }` | Logs step trace, latency, and token cost metrics. |


---

## 🗂️ Virtual Context Filesystem (`guppi://`)

GUPPI exposes standard MCP Resources that agents can browse or read:

| Resource URI | Description | MIME Type |
| :--- | :--- | :--- |
| `guppi://memories/all` | All stored workspace architectural decisions & rules. | `application/json` |
| `guppi://memories/decisions` | Filtered decision records. | `application/json` |
| `guppi://symbols/all` | Complete codebase AST symbol map. | `application/json` |
| `guppi://git/history` | Git commit log & diff summaries. | `application/json` |
| `guppi://brainstorm/blueprint` | Latest synthesized Brainstorm Spec Blueprint markdown. | `text/markdown` |
| `guppi://tasks/active` | Active task execution plans and DAG step progress. | `application/json` |
| `guppi://facts/graph` | Extracted subject-relation-object Fact Graph triples. | `application/json` |
| `guppi://eval/reports` | Agent RAG precision, faithfulness & latency reports. | `application/json` |
| `guppi://graph/callgraph` | AST symbol call graph nodes and hierarchy edges. | `application/json` |
| `guppi://graph/dependencies` | AST dependency graph and call/import relations. | `application/json` |
| `guppi://checkpoints/active` | Subagent session handoff checkpoints. | `application/json` |
| `guppi://feedback/recent` | Execution feedback logs & suggested auto-fix diffs. | `application/json` |
| `guppi://backups/recent` | Active shadow file backup snapshots. | `application/json` |
| `guppi://telemetry/latest` | Real-time tool execution traces & latencies. | `application/json` |
| `guppi://guardrails/rules` | Active safety guardrails & secret patterns. | `application/json` |
| `guppi://working/scratchpad` | Active working memory scratchpad tier. | `application/json` |

---

## 🏗️ Project Architecture Layout

```
/guppi
├── bin/
│   └── guppi.js                  # Executable CLI entrypoint
├── src/
│   ├── cli/
│   │   └── main.ts               # Commander CLI definition
│   ├── server/
│   │   ├── index.ts              # Server daemon manager
│   │   ├── api.ts                # Express REST endpoints
│   │   ├── mcp.ts                # MCP Server (Stdio & HTTP transport)
│   │   └── ws.ts                 # WebSocket event broadcaster
│   ├── db/
│   │   ├── schema.ts             # SQLite WAL schema & FTS5 virtual tables
│   │   └── client.ts             # GuppiDB client & query helpers
│   ├── engine/
│   │   ├── task_planner.ts       # Task DAG Orchestrator (Aider/Superpowers)
│   │   ├── episodic_memory.ts    # Decay-Ranked Memory & Fact Graph (Mem0/MemGPT)
│   │   ├── agent_eval.ts         # RAG Precision Benchmark Studio (DeepEval/AgentOps)
│   │   ├── symbol_call_graph.ts  # Call Graph & Mutation Simulator (Tree-Sitter/GraphRAG)
│   │   ├── dependency_analyzer.ts # Symbol dependency graph & impact analyzer
│   │   ├── agent_handoff.ts      # Subagent checkpoint & handoff engine
│   │   ├── execution_feedback.ts # Error parser & auto-fix synthesizer
│   │   ├── guard_enforcer.ts     # Shadow backup & rollback engine
│   │   ├── onboarder.ts          # Codebase & rule traversal engine
│   │   ├── brainstorm.ts         # Interactive Q&A ideation engine
│   │   ├── skeletonizer.ts       # AST code skeletonizer & token compressor
│   │   ├── auto_memory.ts        # Self-evolving comment/rule extractor
│   │   ├── self_heal.ts          # Emergency backup & repair engine
│   │   ├── mesh.ts               # Multi-repository knowledge mesh engine
│   │   ├── test_gen.ts           # AST-driven automated test suite generator
│   │   ├── rag.ts                # Hybrid RAG context synthesizer
│   │   ├── ast.ts                # AST symbol & dependency parser
│   │   ├── guard.ts              # Pre-flight safety check engine
│   │   └── telemetry.ts          # Real-time trace logger
│   └── dashboard/                # React + Vite Glassmorphic Dashboard UI
│       ├── App.tsx               # Main dashboard shell & sidebar
│       └── components/           # 15 control tabs inc. TaskPlanner, EpisodicMemory, AgentEval, CallGraph
├── test/
│   ├── agentic_assist.spec.ts    # Agentic assistance engine tests (4 tests)
│   └── poached_features.spec.ts  # Poached feature pillar tests (4 tests)
└── CHANGELOG.md                  # Release changelog
```

---

## 🛡️ Privacy & Security Guarantees

1. **100% Local & Offline**: All databases (`guppi.db`), RAG indexes, and backups remain on your local machine. No code or context is sent to third-party servers.
2. **Emergency Backup Snapshots**: GUPPI's Self-Healing Engine automatically creates backup snapshots in `.guppi/backups/` before proposing code repairs.
3. **Secret Detection Guardrails**: Pre-flight checks automatically flag hardcoded API keys, secrets, or empty catch blocks before edits are committed.

---

## 📄 License

MIT © GUPPI Development Team
