# 🔌 Model Context Protocol (MCP) Server Directory Submission Template

This document contains pre-formatted submission snippets for adding **GUPPI** to official MCP registries and community lists.

---

## 1. Official Anthropic MCP Registry (`modelcontextprotocol/servers`)

**Repository**: `https://github.com/modelcontextprotocol/servers`  
**JSON Entry**:

```json
{
  "name": "@atsmith2k/guppi",
  "description": "General-purpose Unifying Pluggable Intelligence — Standalone agentic sidecar, LST memory engine, & telemetry deck.",
  "vendor": "GUPPI Team",
  "homepage": "https://github.com/atsmith2k/guppi",
  "license": "MIT",
  "command": "npx",
  "args": ["-y", "@atsmith2k/guppi", "mcp"],
  "toolsCount": 25,
  "resourcesCount": 14,
  "tags": [
    "memory",
    "rag",
    "codebase-indexing",
    "telemetry",
    "agentic-sidecar",
    "lst-traversal"
  ]
}
```

---

## 2. Reddit Post Template (`r/LocalLLaMA`, `r/ClaudeAI`, `r/Cursor`)

**Title**:  
`GUPPI: A pluggable MCP sidecar daemon for AI coding agents (LST compression, RAG memory & web control deck)`

**Post Body**:

Hey everyone!

We just released GUPPI (`@atsmith2k/guppi`), an open-source MCP sidecar daemon that runs alongside Claude Code, Cursor, or CLI agents.

**Key Features**:
- ⚡ **LST Code Skeletonization**: Preserves signatures and types while folding function bodies (75% token reduction).
- 🧠 **Decay-Ranked Memory & Fact Graph**: Keeps long-term architectural decisions active while naturally decaying transient notes.
- 🛡️ **Shadow Backups & Pre-flight Safety**: Automatically creates shadow backup snapshots before code edits.
- 🎛️ **Web Control Deck**: Visual dashboard on `http://localhost:3737` for telemetry & memory inspection.

Check out the project: https://github.com/atsmith2k/guppi  
Install via npm: `npm install -g @atsmith2k/guppi`
