# Decay-Ranked Episodic Memory & Fact Graph Extractions

When building autonomous AI coding agents, one of the primary operational challenges is session state retention. Once an agent session concludes, architectural decisions, bug solutions, and interface contracts may be lost unless stored in persistent memory.

In **GUPPI**, we combined Ebbinghaus decay-ranked episodic memory with subject-relation-object Fact Graph extraction to provide persistent, decay-weighted memory management across agent sessions.

---

## Ebbinghaus Memory Decay Ranking

Not all memories carry equal weight over time. GUPPI scores stored episodic memory using an adapted **Ebbinghaus Forgetting Curve**:

$$\text{DecayScore} = \text{ImportanceScore} \times e^{-\lambda \cdot \Delta t}$$

Where:
- $\text{ImportanceScore}$ is assigned on creation (e.g., $0.9$ for core architectural decisions, $0.3$ for transient debug logs).
- $\lambda$ is the decay half-life parameter.
- $\Delta t$ is elapsed time in hours since last access or reinforcement.

When an agent queries GUPPI RAG memory via `guppi query` or `guppi_episodic_remember`, high-importance decisions remain active while transient notes decay over time.

---

## Subject-Relation-Object Fact Graph Extractions

GUPPI automatically parses text memories into structured **Fact Triples**:

$$\text{Subject} \xrightarrow{\text{Relation}} \text{Object}$$

For example, when GUPPI records:
> *"GuppiDB uses better-sqlite3 with SQLite WAL mode for sub-millisecond concurrent persistence."*

It extracts the following Fact Graph nodes:
- `(GuppiDB) -[uses]-> (better-sqlite3)`
- `(GuppiDB) -[enables]-> (SQLite WAL mode)`
- `(SQLite WAL mode) -[provides]-> (sub-millisecond concurrency)`

Agents can browse the complete extracted Fact Graph via the MCP Resource `guppi://facts/graph` or CLI command `guppi facts`.
