# MCP Tools Reference

GUPPI exposes 25 Model Context Protocol (MCP) tools organized into 6 functional pillars.

---

## Pillar 1: Context & Compression
- `guppi_onboard`: Programmatically scan workspace and re-index AST symbols.
- `guppi_query_context`: Hybrid RAG search over memories, rules, and symbols.
- `guppi_skeletonize`: Generate token-compressed AST code skeleton (~70–80% token savings).
- `guppi_inspect_symbol`: Query function and class AST signatures without reading full files.
- `guppi_git_rag`: Query Git commit history and diff database.

---

## Pillar 2: Memory & Knowledge Graph
- `guppi_remember`: Save long-term architectural decisions and rules.
- `guppi_episodic_remember`: Store decay-ranked episodic memory and extract Fact Triples.
- `guppi_query_facts`: Query extracted subject-relation-object Fact Graph triples.
- `guppi_working_memory`: Read/write ephemeral working memory scratchpad.
- `guppi_link_knowledge`: Create Knowledge Graph edge (`memory_id` $\rightarrow$ `target_symbol_or_file`).

---

## Pillar 3: Multi-Agent Planning & Handoff
- `guppi_task_plan_create`: Decompose goal into multi-agent DAG task plan.
- `guppi_task_step_update`: Update step status in DAG orchestrator.
- `guppi_compact_session`: Save structured Handoff Checkpoint to Working Memory.
- `guppi_subagent_checkpoint`: Manage subagent checkpoints and context handoffs.

---

## Pillar 4: Safety, Mutation & Self-Healing
- `guppi_guard_check`: Run pre-flight safety and secret detection checks.
- `guppi_guard_enforce`: Run safety audit and create non-destructive shadow backup snapshot.
- `guppi_rollback_file`: Roll back a file to its latest shadow backup snapshot.
- `guppi_self_heal`: Analyze error traceback and receive surgical auto-repair diff.
- `guppi_auto_fix_suggest`: Parse error logs and receive auto-repair patch recommendation.
- `guppi_impact_analysis`: Evaluate downstream breaking changes across callers and files.
- `guppi_signature_mutate_simulate`: Simulate signature mutation and evaluate breaking change risk.

---

## Pillar 5: Quality & Telemetry
- `guppi_evaluate_run`: Benchmark agent precision, faithfulness, latency, and token cost.
- `guppi_log_telemetry`: Log tool call traces, latencies, and token counts.
- `guppi_generate_tests`: Auto-generate unit test suites from AST signatures.
- `guppi_brainstorm_start`: Start interactive Q&A brainstorming session (Starbursting, SCAMPER, 5-Whys).
- `guppi_brainstorm_answer`: Submit answer and advance phase or synthesize spec blueprint.

---

## Pillar 6: LST & Codebase Traversal
- `guppi_lst_find_symbols`: Scope-aware and fuzzy symbol lookup enriched with memories and Fact Triples.
- `guppi_lst_query_tree`: Query Lossless Semantic Tree (LST) nodes using structural path selectors.
- `guppi_lst_find_references`: Locate all caller sites, instantiations, type usages, and imports across workspace.
- `guppi_lst_skeleton_slice`: Generate token-efficient folded code slice collapsing implementation bodies.
- `guppi_lst_replace_symbol`: Replace target symbol body losslessly while preserving formatting, with automatic shadow backup.
