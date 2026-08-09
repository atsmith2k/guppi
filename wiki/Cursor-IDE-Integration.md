# Integrating GUPPI with Cursor IDE

This guide demonstrates how to connect **GUPPI** as an MCP server inside **Cursor IDE**.

---

## Step-by-Step Setup

### Step 1: Install GUPPI Globally
```bash
npm install -g @atsmith2k/guppi
```

### Step 2: Configure MCP Server in Cursor Settings
1. Open **Cursor Settings** (`Cmd + ,` or `Ctrl + ,`).
2. Go to **Features** $\rightarrow$ **MCP Servers**.
3. Click **Add New MCP Server**:
   - **Name**: `guppi`
   - **Type**: `command`
   - **Command**: `npx -y @atsmith2k/guppi mcp`

---

## Using GUPPI inside Cursor Composer and Chat

Once added, Cursor Agent and Composer will automatically access GUPPI tools:

1. **Symbol Search**: Ask Cursor *"Find references to GuppiDB using GUPPI LST"*.
2. **Persistent Decisions**: Tell Cursor *"Record architectural decision: use SQLite WAL mode"*.
3. **Web Control Deck**: Open `http://localhost:3737` in your browser alongside Cursor to inspect live tool execution traces.
