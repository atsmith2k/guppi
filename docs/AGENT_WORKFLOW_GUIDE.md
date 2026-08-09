# GUPPI Agentic Instrumentation & Workflow Guide

> **Instructions for connecting, instrumenting, and optimizing AI coding agents using GUPPI as a persistent sidecar process.**

---

## Overview

GUPPI (*General-purpose Unifying Pluggable Intelligence*) operates as an in-process or background sidecar daemon for LLM-powered coding agents. By providing structured MCP tools, virtual context resources (`guppi://`), and local SQLite-backed memory, GUPPI addresses three main operational areas:

1. **Context Window Bloat**: Replaces multi-hundred-line file reads with token-compressed AST skeletons (~70–80% token savings) and scope-aware symbol lookups.
2. **Loss of Architectural Context & Rule Drift**: Automatically indexes project rules (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`), episodic memory (Fact Triples), and past bug fixes across agent sessions.
3. **Risk of Breaking Changes**: Simulates signature mutations across call graphs and creates pre-flight shadow backup snapshots before atomic edits are committed.

---

## 1. Connecting Primary Agents to GUPPI via MCP

GUPPI runs as a standard Model Context Protocol (MCP) server over `stdio` or HTTP.

### Option A: Local MCP Configuration (`mcp.json` / `mcp_config.json`)
Add the following block to your agent's MCP configuration file (e.g. `.guppi/mcp.json` or global agent config):

```json
{
  "mcpServers": {
    "guppi": {
      "command": "guppi",
      "args": ["mcp"],
      "env": {
        "GUPPI_WORKSPACE": "/absolute/path/to/your/project"
      }
    }
  }
}
```

### Option B: System Prompt Instrumentation
To instruct an AI agent (such as Antigravity CLI, Claude Code, or Cursor) to prioritize GUPPI tools, include this directive in your workspace `AGENTS.md`, `CLAUDE.md`, or system prompt:

```markdown
# Agent Execution Directive: GUPPI Instrumentation
Before executing file edits or reading large source files, utilize GUPPI MCP tools:
1. Run `guppi_query_context` to fetch past architectural decisions and safety rules.
2. Use `guppi_lst_find_symbols` or `guppi_lst_skeleton_slice` instead of reading full 200+ line files.
3. Trace caller impact using `guppi_lst_find_references` or `guppi_impact_analysis` before modifying public signatures.
4. If an error occurs, run `guppi_auto_fix_suggest` or `guppi_self_heal` to analyze tracebacks.
```

---

## 2. Recommended Agentic Execution Recipes Matrix

GUPPI exposes a built-in decision matrix (`guppi://recipes/tool_selection`) mapping common developer goals to tool execution chains:

| Developer Task / Goal | Recommended Tool Execution Chain | Key Benefits |
| :--- | :--- | :--- |
| **Exploring Class Structure & Signatures** | `guppi_lst_find_symbols` $\rightarrow$ `guppi_lst_skeleton_slice` | Reduces LLM tokens by 70–80% while providing exact AST signatures and docstrings. |
| **Tracing Downstream Usage & Callers** | `guppi_lst_find_references` $\rightarrow$ `guppi_call_graph_build` | Identifies every call site, instantiation, and import across the workspace. |
| **Refactoring Public Functions / Signatures** | `guppi_lst_find_symbols` $\rightarrow$ `guppi_signature_mutate_simulate` $\rightarrow$ `guppi_lst_replace_symbol` | Evaluates breaking change risk across callers and creates a shadow backup snapshot before editing. |
| **Diagnosing Build / Test Failures** | `guppi_auto_fix_suggest` $\rightarrow$ `guppi_self_heal` $\rightarrow$ `guppi_rollback_file` | Parses tracebacks, matches past RAG memory solutions, and proposes surgical patch diffs. |
| **Planning Complex Multi-Agent Features** | `guppi_brainstorm_start` $\rightarrow$ `guppi_task_plan_create` $\rightarrow$ `guppi_subagent_checkpoint` | Structured Q&A ideation, DAG step decomposition, and subagent context handoffs. |

---

## 3. Browsing Virtual Context Filesystem (`guppi://`)

Agents can directly browse or read GUPPI MCP resources using the standard `read_resource` protocol:

- `guppi://memories/all`: Workspace RAG memories and architectural rules.
- `guppi://symbols/all`: Complete AST/LST symbol index enriched with memory links.
- `guppi://recipes/codebase_traversal`: Execution decision matrix for symbol navigation.
- `guppi://tasks/active`: Multi-agent task plans and DAG step completion status.
- `guppi://facts/graph`: Subject-relation-object Fact Graph triples.
- `guppi://graph/callgraph`: AST symbol caller-callee call graph hierarchy.
- `guppi://guardrails/rules`: Active safety rules and secret patterns.

---

## 4. CLI Workflow Integration

Developers and automation scripts can interact with GUPPI directly via the command line:

```bash
# 1. Initialize & Onboard Workspace
guppi init
guppi onboard

# 2. Scope-Aware Symbol Lookup (LST Engine)
guppi symbol LSTTraversalEngine

# 3. LST Tree Query
guppi tree src/engine/lst_traversal.ts ClassDeclaration

# 4. Cross-File Reference Lookup
guppi refs GuppiDB

# 5. RAG Memory & Decision Recall
guppi query "SQLite WAL mode"

# 6. Store Key Decision
guppi remember "Use WAL Mode" "SQLite WAL mode enables sub-millisecond concurrent reads/writes."

# 7. Evaluate Mutation Risk
guppi callgraph GuppiDB

# 8. Decompose Multi-Agent Task Plan
guppi plan "Add WebSockets streaming tab to Web Dashboard"
```

---

## 5. Safety, Secret Detection & Backup Rollback

1. **Pre-flight Audit**: `guppi_guard_check` automatically scans edits for hardcoded API keys, secrets, or empty catch blocks.
2. **Shadow Backup Snapshots**: Any atomic code replacement (`guppi_lst_replace_symbol`) automatically creates a timestamped snapshot in `.guppi/backups/`.
3. **Emergency Rollback**: If a change fails build or test checks, call `guppi_rollback_file` to instantly restore the previous file state.

