# Changelog

All notable changes to GUPPI are documented in this file.

## [2.0.0] — 2026-08-08

### New Feature Pillars

#### Task Execution Planner & Multi-Agent DAG Orchestrator
- Decomposes high-level goals into multi-step Directed Acyclic Graph (DAG) task plans.
- Assigns agent roles per step: `Architect`, `Code Generator`, `Test Engineer`, `Reviewer`.
- Tracks step-level completion progress with percentage rollup.
- New engine: `src/engine/task_planner.ts` (`TaskPlannerEngine`)
- New CLI commands: `guppi plan "<goal>"`, `guppi tasks`
- New MCP tools: `guppi_task_plan_create`, `guppi_task_step_update`
- New MCP resource: `guppi://tasks/active`
- New dashboard tab: TaskPlannerTab

#### Decay-Ranked Episodic Agent Memory & Fact Graph Extractor
- Implements Ebbinghaus forgetting curve retention scoring ($R = e^{-\Delta t/S}$).
- Automatically extracts subject-relation-object Fact Triples from code context.
- Full-text search over Fact Graph with FTS5 virtual table.
- New engine: `src/engine/episodic_memory.ts` (`EpisodicMemoryEngine`)
- New CLI command: `guppi facts [query]`
- New MCP tools: `guppi_episodic_remember`, `guppi_query_facts`
- New MCP resource: `guppi://facts/graph`
- New dashboard tab: EpisodicMemoryTab

#### Agent RAG Precision Eval Studio
- Benchmarks agent context precision (keyword overlap scoring).
- Computes answer faithfulness ratings (claim-sentence verification).
- Tracks per-run latency (ms) and estimated token costs.
- Aggregates averages across all evaluation runs for reporting.
- New engine: `src/engine/agent_eval.ts` (`AgentEvalEngine`)
- New CLI command: `guppi eval`
- New MCP tool: `guppi_evaluate_run`
- New MCP resource: `guppi://eval/reports`
- New dashboard tab: AgentEvalTab

#### AST Symbol Call Graph & Signature Mutation Simulator
- Scans TypeScript AST symbols across the codebase to build caller-callee call hierarchies.
- Simulates function/method signature mutations with instant Breaking Change Risk Scores (0–100%).
- Reports affected downstream call sites and provides refactoring safety recommendations.
- New engine: `src/engine/symbol_call_graph.ts` (`SymbolCallGraphEngine`)
- New CLI command: `guppi callgraph [symbol]`
- New MCP tools: `guppi_call_graph_build`, `guppi_signature_mutate_simulate`
- New MCP resource: `guppi://graph/callgraph`
- New dashboard tab: CallGraphTab

### Agentic Assistance Engines (v1.x additions)

- **DependencyAnalyzer** (`src/engine/dependency_analyzer.ts`): Symbol dependency graph builder and downstream impact analyzer.
- **AgentHandoffEngine** (`src/engine/agent_handoff.ts`): Subagent checkpoint serialization, scratchpad sync, and handoff package generator.
- **ExecutionFeedbackEngine** (`src/engine/execution_feedback.ts`): Error log parser, RAG bug solution matcher, and surgical auto-fix synthesizer.
- **GuardEnforcerEngine** (`src/engine/guard_enforcer.ts`): Pre-flight safety auditor, shadow backup creator, and file rollback engine.

### Database Schema

- Added 7 new SQLite tables: `task_plans`, `task_steps`, `episodic_memories`, `fact_triples`, `eval_runs`, `call_graph_nodes`, `call_graph_edges`.
- Added FTS5 virtual table: `fact_triples_fts`.
- Added TypeScript interfaces and query helper methods for all new tables.

### REST API

- 9 new Express endpoints across `/api/tasks`, `/api/episodic`, `/api/eval`, `/api/callgraph`.

### MCP Protocol

- 7 new MCP tools (total now 20).
- 4 new MCP virtual context resources (total now 16).

### Dashboard

- 5 new React dashboard tabs: TaskPlanner, EpisodicMemory, AgentEval, CallGraph, AgenticAssist.
- All tabs integrated into App.tsx sidebar navigation.

### Testing

- New test suite: `test/poached_features.spec.ts` (4 tests).
- New test suite: `test/agentic_assist.spec.ts` (4 tests).
- All 8 tests passing.

### Documentation

- Updated `README.md` with all new feature pillars, CLI commands, MCP tools, virtual resources, and architecture layout.
- Updated `AGENTS.md` with all new engines, CLI commands, MCP tools, and virtual context resources.

---

## [1.0.0] — 2026-08-07

### Initial Release

- Programmatic codebase onboarding with AST symbol parsing.
- Cortex RAG Memory with hybrid BM25/FTS5 search.
- AST Code Skeletonizer (~70–80% token savings).
- Git History and Diff RAG.
- Interactive Q&A Brainstorm Studio.
- Self-Healing Engine with emergency backups.
- Multi-Repo Knowledge Mesh.
- Automated Unit Test Generator.
- Virtual Context Filesystem (`guppi://` MCP resources).
- Web Control Deck at `http://localhost:3737`.
- 13 MCP tools, 8 virtual resources.
- Pre-flight safety guardrails with secret detection.
- Local and offline architecture.

