# AGENTS.md — GUPPI Self-Development Rules & Architectural Context

This workspace contains **GUPPI** (*General-purpose Unifying Pluggable Intelligence*), a standalone agentic sidecar, RAG memory engine, and telemetry deck.

## Quick Commands
- `guppi status`: Check indexed files, RAG memory counts, and telemetry.
- `guppi onboard`: Re-index codebase files, AST symbols, dependency graphs, and rule documents.
- `guppi symbol <name>`: Scope-aware symbol search enriched with memory.
- `guppi tree <file> [selector]`: Query Lossless Semantic Tree (LST) structure for a file.
- `guppi refs <symbol>`: Find cross-file call references, instantiations, and usages.
- `guppi query "<prompt>"`: Search GUPPI's hybrid SQLite RAG memory and symbol index.
- `guppi remember "<title>" "<content>"`: Record key architectural decisions into persistent memory.
- `guppi plan "<goal>"`: Decompose goal into multi-agent DAG task plan.
- `guppi tasks`: List active task plans and DAG step completion progress.
- `guppi facts [query]`: Query extracted subject-relation-object Fact Graph.
- `guppi eval`: Display Agent RAG precision, faithfulness, and latency report.
- `guppi callgraph [symbol]`: Build call graph and simulate signature mutation risk.
- `guppi impact "<symbol>"`: Evaluate downstream breaking change risk across callers and files.
- `guppi checkpoint "<role>" "<summary>"`: Save subagent session checkpoint and state to GUPPI memory.
- `guppi fix "<error_log>"`: Parse error traceback and receive surgical auto-repair patch recommendation.
- `guppi backups`: List active shadow file backup snapshots created before code edits.
- `guppi start`: Boot the background server daemon and Web Control Deck on `http://localhost:3737`.

## Virtual Context Filesystem (`guppi://`) & MCP Resources
GUPPI exposes standard MCP resources that agents can read or browse:
- `guppi://memories/all`: All workspace RAG memories and decisions.
- `guppi://memories/decisions`: Filtered architectural decisions.
- `guppi://symbols/all`: Complete codebase AST symbol map.
- `guppi://lst/symbols/all`: Lossless Semantic Symbols index enriched with memory links.
- `guppi://recipes/codebase_traversal`: Decision matrix for symbol navigation.
- `guppi://recipes/tool_selection`: Agentic Tool Selection recipes matrix.
- `guppi://git/history`: Git commit history and diff summaries.
- `guppi://brainstorm/blueprint`: Latest synthesized Brainstorm Spec Blueprint image.
- `guppi://tasks/active`: Active task execution plans and DAG steps.
- `guppi://facts/graph`: Extracted subject-relation-object Fact Graph.
- `guppi://eval/reports`: Agent RAG precision and latency evaluation reports.
- `guppi://graph/callgraph`: AST symbol call graph nodes and call hierarchy edges.
- `guppi://telemetry/latest`: Live tool execution traces and latencies.
- `guppi://guardrails/rules`: Active pre-flight safety and secret rules.
- `guppi://working/scratchpad`: Working memory scratchpad tier.
- `guppi://graph/dependencies`: AST dependency graph and call/import relations.
- `guppi://checkpoints/active`: Subagent session handoff checkpoints.
- `guppi://feedback/recent`: Execution feedback logs and suggested auto-fix diffs.
- `guppi://backups/recent`: Active shadow file backup snapshots.

## Available MCP Tools (Categorized into 6 Functional Pillars)

### Pillar 1: Context & Compression ([`context_pillar.ts`](file:///Users/ashton/git/something/src/server/pillars/context_pillar.ts))
- `guppi_onboard`: Trigger workspace scan and AST indexing.
- `guppi_query_context`: Hybrid RAG search over codebase knowledge.
- `guppi_skeletonize`: Generate token-compressed AST code skeleton (~70–80% token savings).
- `guppi_inspect_symbol`: Query function/class AST signatures without opening full files.
- `guppi_git_rag`: Query Git commit history and diff database.

### Pillar 2: Memory & Knowledge Graph ([`memory_pillar.ts`](file:///Users/ashton/git/something/src/server/pillars/memory_pillar.ts))
- `guppi_remember`: Store long-term architectural decisions and rules.
- `guppi_episodic_remember`: Store decay-ranked episodic memory and extract Fact Triples.
- `guppi_query_facts`: Query extracted subject-relation-object Fact Graph.
- `guppi_working_memory`: Read/write working scratchpad memory tier during execution.
- `guppi_link_knowledge`: Create Knowledge Graph edge (`memory_id` -> `target_symbol_or_file`).

### Pillar 3: Multi-Agent Planning & Handoff ([`planning_pillar.ts`](file:///Users/ashton/git/something/src/server/pillars/planning_pillar.ts))
- `guppi_task_plan_create`: Decompose goal into multi-agent DAG task plan.
- `guppi_task_step_update`: Update step status in DAG orchestrator.
- `guppi_compact_session`: Save structured Handoff Checkpoint to Working Memory.
- `guppi_subagent_checkpoint`: Manage subagent checkpoints, state serialization, and context handoffs.

### Pillar 4: Safety, Mutation & Self-Healing ([`safety_pillar.ts`](file:///Users/ashton/git/something/src/server/pillars/safety_pillar.ts))
- `guppi_guard_check`: Run pre-flight safety and secret detection checks.
- `guppi_guard_enforce`: Pre-flight safety audit and non-destructive shadow backup creation.
- `guppi_rollback_file`: Roll back a file to its latest shadow backup snapshot.
- `guppi_self_heal`: Analyze error traceback and receive surgical auto-repair patch recommendation.
- `guppi_auto_fix_suggest`: Parse error logs/tracebacks and receive surgical auto-repair diffs.
- `guppi_impact_analysis`: Evaluate downstream breaking changes across callers/imports.
- `guppi_dependency_trace`: Trace symbol imports, call references, and class extensions.
- `guppi_call_graph_build`: Scan AST symbols and build caller-callee call graph hierarchy.
- `guppi_signature_mutate_simulate`: Simulate signature mutation and evaluate breaking change risk.

### Pillar 5: Quality & Telemetry ([`quality_pillar.ts`](file:///Users/ashton/git/something/src/server/pillars/quality_pillar.ts))
- `guppi_evaluate_run`: Benchmark precision, faithfulness, latency, and token cost.
- `guppi_log_telemetry`: Log tool call traces, latencies, and token counts.
- `guppi_generate_tests`: Auto-generate unit test suites from AST signatures.
- `guppi_brainstorm_start`: Start interactive Q&A brainstorming session (Starbursting, SCAMPER, 5-Whys).
- `guppi_brainstorm_answer`: Submit answer and advance brainstorming phase or synthesize spec blueprint.
- `guppi_mesh_query`: Search cross-repo symbols and knowledge across linked multi-repo workspaces.

### Pillar 6: LST & Codebase Traversal ([`lst_pillar.ts`](file:///Users/ashton/git/something/src/server/pillars/lst_pillar.ts))
- `guppi_lst_find_symbols`: Scope-aware fuzzy symbol lookup enriched with memories and Fact Triples.
- `guppi_lst_query_tree`: Query Lossless Semantic Tree (LST) nodes using structural path selectors.
- `guppi_lst_find_references`: Locate all caller sites, instantiations, type usages, and imports across workspace.
- `guppi_lst_skeleton_slice`: Generate token-efficient folded code slice collapsing implementation bodies.
- `guppi_lst_replace_symbol`: Replace target symbol body losslessly with automatic shadow backup.

## Architecture Layout
- [src/db/client.ts](file:///Users/ashton/git/something/src/db/client.ts): SQLite database connection with WAL mode, FTS5 virtual tables (`memories_fts`, `codebase_fts`, `git_commits_fts`), dependency graphs, subagent checkpoints, execution feedback, and shadow backups.
- [src/server/mcp.ts](file:///Users/ashton/git/something/src/server/mcp.ts): Modular MCP Server orchestrating the 6 functional pillars.
- [src/server/pillars/](file:///Users/ashton/git/something/src/server/pillars/): 6 modular tool and resource registration pillars (`context_pillar`, `memory_pillar`, `planning_pillar`, `safety_pillar`, `quality_pillar`, `lst_pillar`).
- [src/engine/lst_traversal.ts](file:///Users/ashton/git/something/src/engine/lst_traversal.ts): Scope-aware Lossless Semantic Tree (LST) Engine and Reference Tracer.
- [src/engine/task_planner.ts](file:///Users/ashton/git/something/src/engine/task_planner.ts): Task Execution Planner and Multi-Agent DAG Orchestrator.
- [src/engine/episodic_memory.ts](file:///Users/ashton/git/something/src/engine/episodic_memory.ts): Decay-Ranked Episodic Agent Memory and Fact Graph Extractor.
- [src/engine/agent_eval.ts](file:///Users/ashton/git/something/src/engine/agent_eval.ts): Agent RAG Precision, Faithfulness, and Latency Benchmark Studio.
- [src/engine/symbol_call_graph.ts](file:///Users/ashton/git/something/src/engine/symbol_call_graph.ts): AST Symbol Call Graph Explorer and Signature Mutation Impact Simulator.
- [src/engine/onboarder.ts](file:///Users/ashton/git/something/src/engine/onboarder.ts): Programmatic codebase traversal, dependency graph indexing, and onboarding engine.
- [src/engine/brainstorm.ts](file:///Users/ashton/git/something/src/engine/brainstorm.ts): Interactive Q&A ideation, persona evaluation, and spec blueprint synthesizer.
- [src/dashboard/](file:///Users/ashton/git/something/src/dashboard/): React + Vite web dashboard UI served at `http://localhost:3737`.
- [docs/AGENT_WORKFLOW_GUIDE.md](file:///Users/ashton/git/something/docs/AGENT_WORKFLOW_GUIDE.md): Complete Agentic Instrumentation & Workflow Guide.

## Guidelines
1. Always run `guppi onboard` after adding major new files or modules to sync the database.
2. Store key architectural decisions using `guppi remember`.
3. Check `guppi_guard_check` before writing complex edits to verify safety rules.

