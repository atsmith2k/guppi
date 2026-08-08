# AGENTS.md — GUPPI Self-Development Rules & Architectural Context

This workspace contains **GUPPI** (*General-purpose Unifying Pluggable Intelligence*), a standalone agentic sidecar, RAG memory engine, and telemetry deck.

## 🚀 Quick Commands
- `guppi status`: Check indexed files, RAG memory counts, and telemetry.
- `guppi onboard`: Re-index codebase files, AST symbols, dependency graphs, and rule documents.
- `guppi query "<prompt>"`: Search GUPPI's hybrid SQLite RAG memory & symbol index.
- `guppi remember "<title>" "<content>"`: Record key architectural decisions into persistent memory.
- `guppi plan "<goal>"`: Decompose goal into multi-agent DAG task plan (Poached from Aider & Superpowers).
- `guppi tasks`: List active task plans and DAG step completion progress.
- `guppi facts [query]`: Query extracted subject-relation-object Fact Graph (Poached from Mem0 & MemGPT).
- `guppi eval`: Display Agent RAG precision, faithfulness & latency report (Poached from DeepEval & AgentOps).
- `guppi callgraph [symbol]`: Build call graph and simulate signature mutation risk (Poached from Tree-Sitter & GraphRAG).
- `guppi impact "<symbol>"`: Evaluate downstream breaking change risk across callers and files.
- `guppi checkpoint "<role>" "<summary>"`: Save subagent session checkpoint and state to GUPPI memory.
- `guppi fix "<error_log>"`: Parse error traceback and receive surgical auto-repair patch recommendation.
- `guppi backups`: List active shadow file backup snapshots created before code edits.
- `guppi start`: Boot the background server daemon & Web Control Deck on `http://localhost:3737`.

## 🗂️ Virtual Context Filesystem (`guppi://`) & MCP Resources
GUPPI exposes standard MCP resources that agents can read or browse:
- `guppi://memories/all`: All workspace RAG memories & decisions.
- `guppi://memories/decisions`: Filtered architectural decisions.
- `guppi://symbols/all`: Complete codebase AST symbol map.
- `guppi://git/history`: Git commit history & diff summaries.
- `guppi://brainstorm/blueprint`: Latest synthesized Brainstorm Spec Blueprint image.
- `guppi://tasks/active`: Active task execution plans and DAG steps.
- `guppi://facts/graph`: Extracted subject-relation-object Fact Graph.
- `guppi://eval/reports`: Agent RAG precision and latency evaluation reports.
- `guppi://graph/callgraph`: AST symbol call graph nodes and call hierarchy edges.
- `guppi://telemetry/latest`: Live tool execution traces & latencies.
- `guppi://guardrails/rules`: Active pre-flight safety & secret rules.
- `guppi://working/scratchpad`: Working memory scratchpad tier.
- `guppi://graph/dependencies`: AST dependency graph and call/import relations.
- `guppi://checkpoints/active`: Subagent session handoff checkpoints.
- `guppi://feedback/recent`: Execution feedback logs & suggested auto-fix diffs.
- `guppi://backups/recent`: Active shadow file backup snapshots.

## 🔌 Available MCP Tools
- `guppi_task_plan_create`: Decompose goal into multi-agent DAG task plan.
- `guppi_task_step_update`: Update step status in DAG orchestrator.
- `guppi_episodic_remember`: Store episodic memory & extract Fact Graph triples.
- `guppi_query_facts`: Query extracted subject-relation-object Fact Triples.
- `guppi_evaluate_run`: Benchmark precision, faithfulness, latency, and token cost.
- `guppi_call_graph_build`: Scan AST symbols and build caller-callee call graph hierarchy.
- `guppi_signature_mutate_simulate`: Simulate signature mutation & evaluate breaking change risk.
- `guppi_onboard`: Trigger codebase scan & AST indexing.
- `guppi_query_context`: Hybrid RAG search over workspace knowledge.
- `guppi_brainstorm_start`: Start interactive Q&A brainstorming session (Starbursting, SCAMPER, 5-Whys).
- `guppi_brainstorm_answer`: Submit answer & advance brainstorming phase or synthesize spec blueprint.
- `guppi_skeletonize`: Generate token-compressed AST code skeleton (~70-80% token savings).
- `guppi_git_rag`: Query Git commit history & diff database.
- `guppi_compact_session`: Save structured Handoff Checkpoint to Working Memory.
- `guppi_remember`: Store long-term architectural decisions.
- `guppi_working_memory`: Read/write working scratchpad memory tier during task execution.
- `guppi_link_knowledge`: Create Knowledge Graph edge (`memory_id` -> `target_symbol_or_file`).
- `guppi_inspect_symbol`: Query function/class AST signatures without opening files.
- `guppi_guard_check`: Run pre-flight safety & secret detection checks.
- `guppi_log_telemetry`: Log tool call traces, latencies, and token counts.
- `guppi_impact_analysis`: Evaluate downstream breaking changes across callers/imports.
- `guppi_dependency_trace`: Trace symbol imports, call references, and class extensions.
- `guppi_subagent_checkpoint`: Manage subagent checkpoints, state serialization, and context handoffs.
- `guppi_auto_fix_suggest`: Parse error logs/tracebacks and receive surgical auto-repair diffs.
- `guppi_guard_enforce`: Pre-flight safety audit & non-destructive shadow backup creation.
- `guppi_rollback_file`: Roll back a file to its latest shadow backup snapshot.

## 🏗️ Architecture Layout
- [src/db/client.ts](file:///Users/ashton/git/something/src/db/client.ts): SQLite database connection with WAL mode, FTS5 virtual tables (`memories_fts`, `codebase_fts`, `git_commits_fts`), dependency graphs, subagent checkpoints, execution feedback, and shadow backups.
- [src/engine/task_planner.ts](file:///Users/ashton/git/something/src/engine/task_planner.ts): Task Execution Planner & Multi-Agent DAG Orchestrator.
- [src/engine/episodic_memory.ts](file:///Users/ashton/git/something/src/engine/episodic_memory.ts): Decay-Ranked Episodic Agent Memory & Fact Graph Extractor.
- [src/engine/agent_eval.ts](file:///Users/ashton/git/something/src/engine/agent_eval.ts): Agent RAG Precision, Faithfulness & Latency Benchmark Studio.
- [src/engine/symbol_call_graph.ts](file:///Users/ashton/git/something/src/engine/symbol_call_graph.ts): AST Symbol Call Graph Explorer & Signature Mutation Impact Simulator.
- [src/engine/onboarder.ts](file:///Users/ashton/git/something/src/engine/onboarder.ts): Programmatic codebase traversal, dependency graph indexing & onboarding engine.
- [src/engine/brainstorm.ts](file:///Users/ashton/git/something/src/engine/brainstorm.ts): Interactive Q&A ideation, persona evaluation, and spec blueprint synthesizer.
- [src/engine/dependency_analyzer.ts](file:///Users/ashton/git/something/src/engine/dependency_analyzer.ts): Symbol dependency graph builder and downstream impact analyzer.
- [src/engine/agent_handoff.ts](file:///Users/ashton/git/something/src/engine/agent_handoff.ts): Subagent checkpoint serialization, scratchpad sync, and handoff package generator.
- [src/engine/execution_feedback.ts](file:///Users/ashton/git/something/src/engine/execution_feedback.ts): Error log parser, RAG bug solution matcher, and surgical auto-fix synthesizer.
- [src/engine/guard_enforcer.ts](file:///Users/ashton/git/something/src/engine/guard_enforcer.ts): Pre-flight safety auditor, shadow backup creator, and file rollback engine.
- [src/engine/skeletonizer.ts](file:///Users/ashton/git/something/src/engine/skeletonizer.ts): AST code skeletonizer & token compressor.
- [src/engine/rag.ts](file:///Users/ashton/git/something/src/engine/rag.ts): Hybrid BM25/FTS5 text search & RAG context synthesizer.
- [src/engine/ast.ts](file:///Users/ashton/git/something/src/engine/ast.ts): AST symbol & dependency extractor.
- [src/engine/guard.ts](file:///Users/ashton/git/something/src/engine/guard.ts): Pre-flight safety check & guardrail rules.
- [src/engine/telemetry.ts](file:///Users/ashton/git/something/src/engine/telemetry.ts): Real-time agent step trace logger.
- [src/server/mcp.ts](file:///Users/ashton/git/something/src/server/mcp.ts): Model Context Protocol (MCP) Server exposing tools and virtual resources for primary agents.
- [src/dashboard/](file:///Users/ashton/git/something/src/dashboard/): React + Vite glassmorphic web dashboard UI served at `http://localhost:3737`.



## 🛡️ Guidelines
1. Always run `guppi onboard` after adding major new files or modules to sync the database.
2. Store key architectural decisions using `guppi remember`.
3. Check `guppi_guard_check` before writing complex edits to verify safety rules.
