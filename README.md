<p align="center">
  <img src="assets/banner.svg" alt="GUPPI Banner" width="100%" />
</p>

<p align="center">
  <strong>Agentic sidecar daemon, Lossless Semantic Tree memory engine, and telemetry deck.</strong>
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-v20.0+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-v5.4+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/Protocol-MCP%20Stdio%20%26%20HTTP-8B5CF6?style=for-the-badge&logo=protocol" alt="MCP Protocol" /></a>
  <a href="https://sqlite.org"><img src="https://img.shields.io/badge/Database-SQLite%20WAL%20%2B%20FTS5-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-00F2FE?style=for-the-badge" alt="License" /></a>
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Offline-10B981?style=for-the-badge" alt="Privacy Guaranteed" />
</p>

---

## Overview

**GUPPI** (*General-purpose Unifying Pluggable Intelligence*) is a local agentic sidecar daemon, RAG memory engine, and telemetry deck. GUPPI integrates into workspace environments alongside AI coding environments and CLI tools (such as Antigravity CLI, Claude Code, Cursor, Windsurf, Aider, and custom agent systems).

GUPPI operates as a background sidecar process providing the following core capabilities:
- **Programmatically indexes AST symbols** and Lossless Semantic Trees (LST) for token-compressed code navigation (~70–80% context compression).
- **Maintains long-term decay-ranked RAG memory** and extracts subject-relation-object Fact Graphs across agent sessions.
- **Orchestrates multi-agent DAG task plans** with structured session handoff checkpoints.
- **Enforces pre-flight safety guardrails**, secret detection, and non-destructive shadow file backups prior to code modifications.
- **Benchmarks agent precision, faithfulness, and latency** with automated AST unit test generation.
- **Serves a Web Control Deck UI** at `http://localhost:3737`.

---

## Functional Pillars

GUPPI organizes its functionality into 6 core pillars:

| Pillar | Core Purpose | Key Tools & Engines |
| :--- | :--- | :--- |
| **1. Context & Compression** | Traverses workspace files, parses AST signatures, extracts rules (`AGENTS.md`, `CLAUDE.md`), and compresses prompt context. | `guppi_onboard`, `guppi_skeletonize`, `guppi_inspect_symbol`, `guppi_git_rag` |
| **2. Memory & Knowledge Graph** | Hybrid BM25/FTS5 text search, Ebbinghaus decay-ranked episodic memory, and subject-relation-object Fact Graph extraction. | `guppi_remember`, `guppi_episodic_remember`, `guppi_query_facts`, `guppi_working_memory` |
| **3. Multi-Agent Planning & Handoff** | Decomposes goals into multi-agent DAG task plans and manages subagent context handoff checkpoints. | `guppi_task_plan_create`, `guppi_task_step_update`, `guppi_compact_session`, `guppi_subagent_checkpoint` |
| **4. Safety, Mutation & Self-Healing** | Pre-flight safety audit, secret detection, shadow backup snapshot creation, symbol call graph mutation simulation, and traceback auto-fix. | `guppi_guard_check`, `guppi_guard_enforce`, `guppi_rollback_file`, `guppi_signature_mutate_simulate` |
| **5. Quality & Telemetry** | Agent RAG precision benchmarking, automated unit test generation, and interactive Q&A spec brainstorming. | `guppi_evaluate_run`, `guppi_log_telemetry`, `guppi_brainstorm_start`, `guppi_generate_tests` |
| **6. LST & Codebase Traversal** | Scope-aware symbol search, Lossless Semantic Tree (LST) structural querying, cross-file reference tracing, and atomic code body replacement. | `guppi_lst_find_symbols`, `guppi_lst_query_tree`, `guppi_lst_find_references`, `guppi_lst_replace_symbol` |

---

## Quick Start CLI Guide

```bash
# 1. Install dependencies and build GUPPI
npm install
npm run build
npm link

# 2. Initialize GUPPI in your project (creates .guppi/guppi.db and .guppi/mcp.json)
guppi init

# 3. Start the background daemon and Web Control Deck
guppi start

# 4. Scope-aware symbol search (LST Engine)
guppi symbol LSTTraversalEngine

# 5. Query Lossless Semantic Tree (LST) structure
guppi tree src/engine/lst_traversal.ts ClassDeclaration

# 6. Find cross-file call references
guppi refs GuppiDB

# 7. Query hybrid RAG memory
guppi query "SQLite WAL mode"

# 8. Record an architectural decision
guppi remember "Use SQLite WAL" "SQLite WAL mode enables sub-millisecond concurrent reads/writes."

# 9. Decompose goal into a multi-agent DAG task plan
guppi plan "Build OAuth2 authentication engine"

# 10. Run AST call graph and signature mutation simulator
guppi callgraph GuppiDB

# 11. Run stdio MCP server for agent integration
guppi mcp
```

---

## Agentic Integration (Model Context Protocol)

Add this configuration snippet to your agent's MCP settings file (such as `mcp_config.json` or `.guppi/mcp.json`):

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

> **Full Agentic Integration Guide**: See [`docs/AGENT_WORKFLOW_GUIDE.md`](file:///Users/ashton/git/something/docs/AGENT_WORKFLOW_GUIDE.md) for detailed instructions on instrumenting GUPPI within CLI agents, custom scripts, and system prompts.

---

## MCP Tools Reference

### Pillar 1: Context & Compression
- `guppi_onboard`: Programmatically scan workspace and re-index AST symbols.
- `guppi_query_context`: Hybrid RAG search over memories, rules, and symbols.
- `guppi_skeletonize`: Generate token-compressed AST code skeleton (~70–80% token savings).
- `guppi_inspect_symbol`: Query function and class AST signatures without reading full files.
- `guppi_git_rag`: Query Git commit history and diff database.

### Pillar 2: Memory & Knowledge Graph
- `guppi_remember`: Save long-term architectural decisions and rules.
- `guppi_episodic_remember`: Store decay-ranked episodic memory and extract Fact Triples.
- `guppi_query_facts`: Query extracted subject-relation-object Fact Graph triples.
- `guppi_working_memory`: Read/write ephemeral working memory scratchpad.
- `guppi_link_knowledge`: Create Knowledge Graph edge (`memory_id` $\rightarrow$ `target_symbol_or_file`).

### Pillar 3: Multi-Agent Planning & Handoff
- `guppi_task_plan_create`: Decompose goal into multi-agent DAG task plan.
- `guppi_task_step_update`: Update step status in DAG orchestrator.
- `guppi_compact_session`: Save structured Handoff Checkpoint to Working Memory.
- `guppi_subagent_checkpoint`: Manage subagent checkpoints and context handoffs.

### Pillar 4: Safety, Mutation & Self-Healing
- `guppi_guard_check`: Run pre-flight safety and secret detection checks.
- `guppi_guard_enforce`: Run safety audit and create non-destructive shadow backup snapshot.
- `guppi_rollback_file`: Roll back a file to its latest shadow backup snapshot.
- `guppi_self_heal`: Analyze error traceback and receive surgical auto-repair diff.
- `guppi_auto_fix_suggest`: Parse error logs and receive auto-repair patch recommendation.
- `guppi_impact_analysis`: Evaluate downstream breaking changes across callers and files.
- `guppi_signature_mutate_simulate`: Simulate signature mutation and evaluate breaking change risk.

### Pillar 5: Quality & Telemetry
- `guppi_evaluate_run`: Benchmark agent precision, faithfulness, latency, and token cost.
- `guppi_log_telemetry`: Log tool call traces, latencies, and token counts.
- `guppi_generate_tests`: Auto-generate unit test suites from AST signatures.
- `guppi_brainstorm_start`: Start interactive Q&A brainstorming session (Starbursting, SCAMPER, 5-Whys).
- `guppi_brainstorm_answer`: Submit answer and advance phase or synthesize spec blueprint.

### Pillar 6: LST & Codebase Traversal
- `guppi_lst_find_symbols`: Scope-aware and fuzzy symbol lookup enriched with memories and Fact Triples.
- `guppi_lst_query_tree`: Query Lossless Semantic Tree (LST) nodes using structural path selectors.
- `guppi_lst_find_references`: Locate all caller sites, instantiations, type usages, and imports across workspace.
- `guppi_lst_skeleton_slice`: Generate token-efficient folded code slice collapsing implementation bodies.
- `guppi_lst_replace_symbol`: Replace target symbol body losslessly while preserving formatting, with automatic shadow backup.

---

## Virtual Context Filesystem (`guppi://`)

GUPPI exposes standard MCP Resources that agents can browse or read:

| Resource URI | Description | MIME Type |
| :--- | :--- | :--- |
| `guppi://memories/all` | All stored workspace architectural decisions and rules. | `application/json` |
| `guppi://symbols/all` | Complete codebase AST symbol map. | `application/json` |
| `guppi://lst/symbols/all` | Lossless Semantic Symbols index enriched with memory links. | `application/json` |
| `guppi://recipes/codebase_traversal` | LST Traversal and symbol navigation decision matrix. | `application/json` |
| `guppi://recipes/tool_selection` | Agentic Tool Selection recipes matrix. | `application/json` |
| `guppi://git/history` | Git commit log and diff summaries. | `application/json` |
| `guppi://brainstorm/blueprint` | Latest synthesized Brainstorm Spec Blueprint markdown. | `text/markdown` |
| `guppi://tasks/active` | Active task execution plans and DAG step progress. | `application/json` |
| `guppi://facts/graph` | Extracted subject-relation-object Fact Graph triples. | `application/json` |
| `guppi://eval/reports` | Agent RAG precision, faithfulness, and latency reports. | `application/json` |
| `guppi://graph/callgraph` | AST symbol call graph nodes and hierarchy edges. | `application/json` |
| `guppi://checkpoints/active` | Subagent session handoff checkpoints. | `application/json` |
| `guppi://backups/recent` | Active shadow file backup snapshots. | `application/json` |
| `guppi://guardrails/rules` | Active safety guardrails and secret patterns. | `application/json` |

---

## Project Architecture Layout

```
/guppi
├── assets/
│   ├── logo.svg                  # Vector SVG brand emblem
│   └── banner.svg                # Header hero banner SVG
├── bin/
│   └── guppi.js                  # Executable CLI entrypoint
├── docs/
│   └── AGENT_WORKFLOW_GUIDE.md   # Complete Agentic Instrumentation & Workflow Guide
├── src/
│   ├── cli/
│   │   └── main.ts               # Commander CLI definition and commands
│   ├── server/
│   │   ├── index.ts              # Server daemon manager
│   │   ├── mcp.ts                # MCP Server (Stdio and HTTP transport)
│   │   └── pillars/              # 6 Functional Pillar Modules
│   │       ├── context_pillar.ts # Pillar 1: Context & Compression
│   │       ├── memory_pillar.ts  # Pillar 2: Memory & Knowledge Graph
│   │       ├── planning_pillar.ts # Pillar 3: Multi-Agent Planning & Handoff
│   │       ├── safety_pillar.ts  # Pillar 4: Safety & Mutation
│   │       ├── quality_pillar.ts # Pillar 5: Quality & Telemetry
│   │       └── lst_pillar.ts     # Pillar 6: LST & Codebase Traversal
│   ├── db/
│   │   ├── schema.ts             # SQLite WAL schema and FTS5 virtual tables
│   │   └── client.ts             # GuppiDB client and query helpers
│   ├── engine/
│   │   ├── lst_traversal.ts      # Serena-style LST Engine & Reference Tracer
│   │   ├── task_planner.ts       # Task DAG Orchestrator
│   │   ├── episodic_memory.ts    # Decay-Ranked Memory & Fact Graph
│   │   ├── agent_eval.ts         # RAG Precision Benchmark Studio
│   │   ├── symbol_call_graph.ts  # Call Graph & Mutation Simulator
│   │   ├── guard_enforcer.ts     # Shadow backup and rollback engine
│   │   ├── onboarder.ts          # Codebase and rule traversal engine
│   │   └── brainstorm.ts         # Interactive Q&A ideation engine
│   └── dashboard/                # React + Vite Dashboard UI
├── test/
│   ├── agentic_assist.spec.ts    # Agentic assistance engine tests
│   └── poached_features.spec.ts  # Feature pillar tests
└── CHANGELOG.md                  # Release changelog
```

---

## Privacy & Security Guarantees

1. **Local and Offline Execution**: All databases (`guppi.db`), RAG indexes, and backups remain strictly on the local filesystem. No codebase data or context is transmitted to external endpoints.
2. **Non-Destructive Shadow Backups**: GUPPI creates timestamped backup snapshots in `.guppi/backups/` before executing atomic code modifications.
3. **Pre-flight Secret Guardrails**: Pre-flight audits scan for hardcoded API keys, credentials, and empty exception catch blocks prior to committing changes.

---

## License

MIT © GUPPI Development Team

