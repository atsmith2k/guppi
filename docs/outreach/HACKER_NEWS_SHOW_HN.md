# 📰 Hacker News Post Template (Show HN)

**Title**:  
`Show HN: GUPPI – Pluggable agentic sidecar, LST memory engine & telemetry deck`

**URL**:  
`https://github.com/atsmith2k/guppi`

**Post Text**:

Hi HN!

We built GUPPI (*General-purpose Unifying Pluggable Intelligence*), a 100% local, open-source sidecar daemon and memory engine designed to hook alongside AI coding tools (Claude Code, Cursor, Antigravity CLI, Aider).

### Why we built it:
As LLM context windows grow, feeding raw 1,000+ line source files into agent loop prompts burns tokens rapidly and degrades reasoning precision. GUPPI operates as a background "second brain":

1. **Lossless Semantic Trees (LST)**: Parses codebase AST signatures, exports, types, and docstrings while folding implementation bodies (~70-80% token savings).
2. **Decay-Ranked Memory & Fact Graphs**: Uses an Ebbinghaus decay curve + subject-relation-object Fact Graph extraction (poached from Mem0 & MemGPT) to prevent session amnesia across agent restarts.
3. **Multi-Agent DAG Task Planning**: Decomposes complex goals into task DAGs with session handoff checkpoints.
4. **Pre-flight Safety & Shadow Backups**: Creates non-destructive shadow file backups before code mutations.
5. **Glassmorphic Web Control Deck**: Serves a visual dashboard at `http://localhost:3737` to inspect telemetry, RAG memories, and call graphs.

### Try it out:
```bash
npm install -g @atsmith2k/guppi
guppi status
```

We'd love feedback on our LST symbol traversal algorithms and agent memory decay formulas!

GitHub: https://github.com/atsmith2k/guppi
