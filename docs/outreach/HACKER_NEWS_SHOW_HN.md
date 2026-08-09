# Hacker News Post Template (Show HN)

**Title**:  
`Show HN: GUPPI – Pluggable agentic sidecar, LST memory engine & telemetry deck`

**URL**:  
`https://github.com/atsmith2k/guppi`

**Post Text**:

GUPPI (*General-purpose Unifying Pluggable Intelligence*) is a local, open-source sidecar daemon and memory engine designed to operate alongside AI coding tools (Claude Code, Cursor, Antigravity CLI, Aider).

### Architecture Overview
As LLM context windows expand, passing raw 1,000+ line source files into agent loop prompts consumes token budgets and reduces reasoning precision. GUPPI operates as a background sidecar process:

1. **Lossless Semantic Trees (LST)**: Parses codebase AST signatures, exports, types, and docstrings while folding implementation bodies (~70–80% context compression).
2. **Decay-Ranked Memory & Fact Graphs**: Uses an Ebbinghaus decay curve and subject-relation-object Fact Graph extraction to maintain persistent context across agent sessions.
3. **Multi-Agent DAG Task Planning**: Decomposes goals into task DAGs with session handoff checkpoints.
4. **Pre-flight Safety & Shadow Backups**: Creates shadow file backups prior to code modifications.
5. **Web Control Deck**: Serves a visual dashboard at `http://localhost:3737` to inspect telemetry, RAG memories, and call graphs.

### Usage:
```bash
npm install -g @atsmith2k/guppi
guppi status
```

GitHub: https://github.com/atsmith2k/guppi

