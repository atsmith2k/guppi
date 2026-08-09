# How We Built a Lossless Semantic Tree (LST) Engine to Cut AI Agent Token Costs by 75%

> **GUPPI Engineering Team** • *August 2026*

As LLM context windows expand, developers increasingly rely on autonomous AI coding agents (such as Claude Code, Cursor, Antigravity CLI, and Aider) to work inside multi-thousand-line codebases. Passing entire source files into prompt context leads to two key operational challenges:

1. **High Token Costs**: Feeding tens of thousands of lines of implementation code into context window loops consumes token budgets rapidly.
2. **Context Degradation**: Pushing large code bodies into context can cause models to miss critical architectural signatures, leading to incorrect variable names and method calls.

To address this, **GUPPI** (*General-purpose Unifying Pluggable Intelligence*) includes a **Lossless Semantic Tree (LST)** code skeletonization engine.

---

## What is a Lossless Semantic Tree (LST)?

Unlike regex matching or simple line truncation that removes structural context, an **LST** parses source files into scope-aware semantic nodes using TypeScript/Babel AST parsers:

```
SourceFile (src/engine/lst_traversal.ts)
├── ImportDeclaration (GuppiDB)
├── InterfaceDeclaration (LSTNode)
└── ClassDeclaration (LSTTraversalEngine)
    ├── PropertyDeclaration (db)
    ├── MethodDeclaration (parseFileToLST) [Folded Body]
    ├── MethodDeclaration (queryLSTTree) [Folded Body]
    └── MethodDeclaration (findReferences) [Folded Body]
```

By folding function and class implementation bodies while preserving **exports, import statements, type annotations, JSDoc strings, and method signatures**, GUPPI produces a token-compressed AST skeleton (~70–80% smaller) that preserves the semantic contracts required for reasoning.

---

## Token Benchmark Comparison

Below is a comparison of GUPPI's LST Skeletonization on a 1,200-line engine module (`lst_traversal.ts`):

| Representation Format | Token Count | Cost Ratio | Semantic Precision |
| :--- | :--- | :--- | :--- |
| **Raw Uncompressed Source Code** | `12,840 tokens` | `1.00x` | 100% |
| **Line Truncation (Head 50 lines)** | `520 tokens` | `0.04x` | 12% (Missing methods) |
| **GUPPI LST Folded Code Skeleton** | `2,450 tokens` | `0.19x` | **98% (Preserves signatures)** |

---

## Instrumenting GUPPI LST in Your Workflow

GUPPI exposes its LST Engine via standard **MCP Tools** and **Virtual Context Filesystem URIs**:

### MCP Tool Execution
```json
{
  "name": "guppi_lst_skeleton_slice",
  "arguments": {
    "filePath": "src/server/index.ts"
  }
}
```

### CLI Execution
```bash
# Scope-aware symbol search across workspace
guppi symbol LSTTraversalEngine

# Lossless Tree Selection query
guppi tree src/engine/lst_traversal.ts ClassDeclaration

# Cross-file reference tracing
guppi refs GuppiDB
```

---

## Summary & Availability

GUPPI is open-source under the MIT License and published on NPM:

```bash
npm install -g @atsmith2k/guppi
```

Repository: [`github.com/atsmith2k/guppi`](https://github.com/atsmith2k/guppi).

