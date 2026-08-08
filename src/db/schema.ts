export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS workspace_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS working_scratchpad (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_relations (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS codebase_index (
  path TEXT PRIMARY KEY,
  file_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  line_count INTEGER NOT NULL,
  summary TEXT NOT NULL,
  exports TEXT NOT NULL,
  imports TEXT NOT NULL,
  hash TEXT NOT NULL,
  indexed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ast_symbols (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  symbol_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  line_start INTEGER NOT NULL,
  line_end INTEGER NOT NULL,
  docstring TEXT,
  signature TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS git_commits (
  hash TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  message TEXT NOT NULL,
  files_changed TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry_traces (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input_payload TEXT,
  output_payload TEXT,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guardrails (
  id TEXT PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT NOT NULL,
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL,
  enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS agent_bridge_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_agent TEXT NOT NULL,
  status TEXT NOT NULL,
  artifacts TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Full-Text Search Virtual Tables
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  id UNINDEXED,
  title,
  content,
  category,
  tags
);

CREATE VIRTUAL TABLE IF NOT EXISTS codebase_fts USING fts5(
  path,
  summary,
  exports,
  imports
);

CREATE VIRTUAL TABLE IF NOT EXISTS git_commits_fts USING fts5(
  hash,
  author,
  message,
  files_changed
);
`;
