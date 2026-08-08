# AGENTS.md — GUPPI Self-Development Rules & Architectural Context

This workspace contains **GUPPI** (*General-purpose Unifying Pluggable Intelligence*), a standalone agentic sidecar, RAG memory engine, and telemetry deck.

## 🚀 Quick Commands
- `guppi status`: Check indexed files, RAG memory counts, and telemetry.
- `guppi onboard`: Re-index codebase files, AST symbols, and rule documents.
- `guppi query "<prompt>"`: Search GUPPI's hybrid SQLite RAG memory & symbol index.
- `guppi remember "<title>" "<content>"`: Record key architectural decisions into persistent memory.
- `guppi start`: Boot the background server daemon & Web Control Deck on `http://localhost:3737`.

## 🗂️ Virtual Context Filesystem (`guppi://`) & MCP Resources
GUPPI exposes standard MCP resources that agents can read or browse:
- `guppi://memories/all`: All workspace RAG memories & decisions.
- `guppi://memories/decisions`: Filtered architectural decisions.
- `guppi://symbols/all`: Complete codebase AST symbol map.
- `guppi://git/history`: Git commit history & diff summaries.
- `guppi://brainstorm/blueprint`: Latest synthesized Brainstorm Spec Blueprint image.
- `guppi://telemetry/latest`: Live tool execution traces & latencies.
- `guppi://guardrails/rules`: Active pre-flight safety & secret rules.
- `guppi://working/scratchpad`: Working memory scratchpad tier.

## 🔌 Available MCP Tools
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

## 🏗️ Architecture Layout
- [src/db/client.ts](file:///Users/ashton/git/something/src/db/client.ts): SQLite database connection with WAL mode, FTS5 virtual tables (`memories_fts`, `codebase_fts`, `git_commits_fts`), working memory scratchpad, and knowledge graph relations.
- [src/engine/onboarder.ts](file:///Users/ashton/git/something/src/engine/onboarder.ts): Programmatic codebase traversal & onboarding engine.
- [src/engine/brainstorm.ts](file:///Users/ashton/git/something/src/engine/brainstorm.ts): Interactive Q&A ideation, persona evaluation, and spec blueprint synthesizer.
- [src/engine/skeletonizer.ts](file:///Users/ashton/git/something/src/engine/skeletonizer.ts): AST code skeletonizer & token compressor.
- [src/engine/auto_memory.ts](file:///Users/ashton/git/something/src/engine/auto_memory.ts): Self-evolving auto-memory & comment extractor.
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
