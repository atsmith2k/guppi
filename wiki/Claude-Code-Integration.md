# Integrating GUPPI with Anthropic's Claude Code CLI

This guide demonstrates how to instrument **GUPPI** alongside **Claude Code CLI** as a background MCP sidecar server and memory engine.

---

## Step-by-Step Setup

### Step 1: Install GUPPI Globally
```bash
npm install -g @atsmith2k/guppi
```

### Step 2: Add GUPPI to Claude Code MCP Config
Add GUPPI to your global Claude Code MCP config (e.g. `~/.claude/mcp.json` or `.mcp.json` in your workspace):

```json
{
  "mcpServers": {
    "guppi": {
      "command": "npx",
      "args": ["-y", "@atsmith2k/guppi", "mcp"],
      "env": {
        "GUPPI_WORKSPACE": "${workspaceFolder}"
      }
    }
  }
}
```

### Step 3: Initialize Workspace Indexing
In your project directory, run:
```bash
guppi init
guppi onboard
```

### Step 4: Run Claude Code
Launch Claude Code normally:
```bash
claude
```

Claude Code will automatically detect GUPPI's 25 MCP tools and Virtual Context Filesystem URIs (`guppi://memories/all`, `guppi://symbols/all`, `guppi://facts/graph`).
