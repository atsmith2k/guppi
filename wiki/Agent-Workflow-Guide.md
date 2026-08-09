# GUPPI Agentic Instrumentation & Workflow Guide

> Instructions for connecting, instrumenting, and optimizing AI coding agents using GUPPI as a persistent sidecar process.

---

## Overview

GUPPI (*General-purpose Unifying Pluggable Intelligence*) operates as an in-process or background sidecar daemon for LLM-powered coding agents. By providing structured MCP tools, virtual context resources (`guppi://`), and local SQLite-backed memory, GUPPI addresses three main operational areas:

1. **Context Window Bloat**: Replaces multi-hundred-line file reads with token-compressed AST skeletons (~70–80% token savings) and scope-aware symbol lookups.
2. **Loss of Architectural Context & Rule Drift**: Automatically indexes project rules (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`), episodic memory (Fact Triples), and past bug fixes across agent sessions.
3. **Risk of Breaking Changes**: Simulates signature mutations across call graphs and creates pre-flight shadow backup snapshots before atomic edits are committed.

---

## 1. Connecting Primary Agents to GUPPI via MCP

GUPPI runs as a standard Model Context Protocol (MCP) server over `stdio` or HTTP.

### Local MCP Configuration (`mcp.json` / `mcp_config.json`)

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

### System Prompt Instrumentation

To instruct an AI agent to prioritize GUPPI tools, include this directive in your workspace `AGENTS.md`, `CLAUDE.md`, or system prompt:

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
