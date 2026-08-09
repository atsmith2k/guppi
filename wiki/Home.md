# Welcome to the GUPPI Documentation Wiki

**GUPPI** (*General-purpose Unifying Pluggable Intelligence*) is a local agentic sidecar daemon, RAG memory engine, and telemetry deck. GUPPI operates in the background alongside AI coding environments and CLI tools (including Antigravity CLI, Claude Code, Cursor, Windsurf, Aider, and custom agent systems).

---

## Core Capabilities

- **Lossless Semantic Trees (LST)**: Programmatically indexes AST symbols and folds function implementation bodies to provide token-compressed code context (~70–80% context compression).
- **Decay-Ranked Episodic Memory**: Maintains long-term RAG memory scored using an adapted Ebbinghaus Forgetting Curve and extracts subject-relation-object Fact Graphs across agent sessions.
- **Multi-Agent Task Planning**: Orchestrates Directed Acyclic Graph (DAG) task execution plans with structured session handoff checkpoints.
- **Pre-Flight Safety Guardrails**: Enforces pre-flight safety audits, secret detection, and non-destructive shadow file backups prior to code modifications.
- **Quality Benchmarking**: Benchmarks agent precision, faithfulness, and latency while auto-generating AST unit test suites.
- **Web Control Deck**: Serves an interactive React dashboard UI at `http://localhost:3737`.

---

## Navigation & Guides

- **[MCP Tools Reference](MCP-Tools-Reference)**: Complete reference covering all 25 Model Context Protocol tools across 6 functional pillars.
- **[Agent Workflow Guide](Agent-Workflow-Guide)**: Instructions for connecting CLI agents, configuring `mcp.json`, and writing system prompts.
- **[LST Token Compression](LST-Token-Compression)**: Deep dive into AST scope-aware symbol folding and token benchmark metrics.
- **[Episodic Memory & Fact Graphs](Episodic-Memory-and-Fact-Graphs)**: Explanation of the Ebbinghaus memory decay formula and Fact Triple extraction.
- **[Cursor IDE Integration](Cursor-IDE-Integration)**: Step-by-step setup guide for Cursor IDE.
- **[Claude Code Integration](Claude-Code-Integration)**: Step-by-step setup guide for Anthropic's Claude Code CLI.
- **[Publishing Guide](Publishing-Guide)**: Automated and manual procedures for NPM package releases.
