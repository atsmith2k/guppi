# 🧠 Decay-Ranked Episodic Memory & Fact Graph Extractions for Autonomous AI Agents

> **By the GUPPI Development Team** • *August 2026*

When building autonomous AI coding agents, one of the biggest bottlenecks is **session amnesia**. Once an agent session ends, architectural decisions, bug solutions, and variable contracts are lost unless recorded into persistent memory.

In **GUPPI** (*General-purpose Unifying Pluggable Intelligence*), we combined Ebbinghaus decay-ranked episodic memory with subject-relation-object Fact Graph extraction (poached from Mem0 & MemGPT) to give AI agents an intelligent, self-cleaning "second brain".

---

## 📉 Ebbinghaus Memory Decay Ranking

Not all memories are equally relevant over time. GUPPI scores each stored episodic memory using an adapted **Ebbinghaus Forgetting Curve**:

$$\text{DecayScore} = \text{ImportanceScore} \times e^{-\lambda \cdot \Delta t}$$

Where:
- $\text{ImportanceScore}$ is assigned on creation (e.g., $0.9$ for core architectural decisions, $0.3$ for transient debug logs).
- $\lambda$ is the decay half-life parameter.
- $\Delta t$ is elapsed time in hours since last access or reinforcement.

When an agent queries GUPPI RAG memory via `guppi query` or `guppi_episodic_remember`, high-importance decisions remain active while transient scratchpad notes decay naturally.

---

## 🕸️ Subject-Relation-Object Fact Graph Extractions

GUPPI automatically parses text memories into structured **Fact Triples**:

$$\text{Subject} \xrightarrow{\text{Relation}} \text{Object}$$

For example, when GUPPI records:
> *"GuppiDB uses better-sqlite3 with SQLite WAL mode for sub-millisecond concurrent persistence."*

It extracts the following Fact Graph nodes:
- `(GuppiDB) -[uses]-> (better-sqlite3)`
- `(GuppiDB) -[enables]-> (SQLite WAL mode)`
- `(SQLite WAL mode) -[provides]-> (sub-millisecond concurrency)`

Agents can browse the complete extracted Fact Graph via the MCP Resource `guppi://facts/graph` or CLI command `guppi facts`.

---

## ⚡ Try GUPPI Today

GUPPI is 100% local, offline, and open-source under the MIT license:

```bash
# Install globally
npm install -g @atsmith2k/guppi

# Query RAG memory & fact graph
guppi query "SQLite WAL"
guppi facts "GuppiDB"
```

Check out the full repository on GitHub: [`github.com/atsmith2k/guppi`](https://github.com/atsmith2k/guppi).
