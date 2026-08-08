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

CREATE TABLE IF NOT EXISTS dependency_graph (
  id TEXT PRIMARY KEY,
  source_symbol TEXT NOT NULL,
  target_symbol TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subagent_checkpoints (
  id TEXT PRIMARY KEY,
  parent_agent_id TEXT NOT NULL,
  subagent_role TEXT NOT NULL,
  task_summary TEXT NOT NULL,
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS execution_feedback (
  id TEXT PRIMARY KEY,
  command_type TEXT NOT NULL,
  stdout TEXT,
  stderr TEXT,
  exit_code INTEGER NOT NULL,
  matched_memory_id TEXT,
  proposed_fix TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shadow_backups (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  backup_path TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Task Execution Planner & Multi-Agent DAG Orchestrator
CREATE TABLE IF NOT EXISTS task_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_steps (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_role TEXT NOT NULL,
  dependencies TEXT NOT NULL,
  status TEXT NOT NULL,
  result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Decay-Ranked Episodic Agent Memory & Fact Graph
CREATE TABLE IF NOT EXISTS episodic_memories (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  importance_score REAL NOT NULL,
  access_count INTEGER DEFAULT 1,
  last_accessed_at TEXT NOT NULL,
  decay_score REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fact_triples (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  relation TEXT NOT NULL,
  object TEXT NOT NULL,
  confidence REAL NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Agent Evaluation & RAG Precision Benchmark Studio
CREATE TABLE IF NOT EXISTS eval_runs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  query_prompt TEXT NOT NULL,
  response_text TEXT NOT NULL,
  precision_score REAL NOT NULL,
  faithfulness_score REAL NOT NULL,
  latency_ms INTEGER NOT NULL,
  token_cost INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- AST Symbol Call Graph & Signature Mutation Simulator
CREATE TABLE IF NOT EXISTS call_graph_nodes (
  id TEXT PRIMARY KEY,
  symbol_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  signature TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS call_graph_edges (
  id TEXT PRIMARY KEY,
  caller_symbol TEXT NOT NULL,
  callee_symbol TEXT NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  call_type TEXT NOT NULL
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

CREATE VIRTUAL TABLE IF NOT EXISTS fact_triples_fts USING fts5(
  subject,
  relation,
  object,
  source
);

-- Performance B-Tree Secondary Indexes
CREATE INDEX IF NOT EXISTS idx_ast_symbols_filepath ON ast_symbols(file_path);
CREATE INDEX IF NOT EXISTS idx_ast_symbols_name ON ast_symbols(symbol_name);
CREATE INDEX IF NOT EXISTS idx_dependency_graph_src ON dependency_graph(source_symbol);
CREATE INDEX IF NOT EXISTS idx_dependency_graph_target ON dependency_graph(target_symbol);
CREATE INDEX IF NOT EXISTS idx_dependency_graph_file ON dependency_graph(file_path);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_updated ON memories(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_relations_mem ON memory_relations(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_target ON memory_relations(target_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_traces_timestamp ON telemetry_traces(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_traces_agent ON telemetry_traces(agent_id);
CREATE INDEX IF NOT EXISTS idx_subagent_checkpoints_parent ON subagent_checkpoints(parent_agent_id);
CREATE INDEX IF NOT EXISTS idx_shadow_backups_file ON shadow_backups(file_path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_feedback_cmd ON execution_feedback(command_type);
CREATE INDEX IF NOT EXISTS idx_task_steps_plan ON task_steps(plan_id);
CREATE INDEX IF NOT EXISTS idx_call_graph_edges_caller ON call_graph_edges(caller_symbol);
CREATE INDEX IF NOT EXISTS idx_call_graph_edges_callee ON call_graph_edges(callee_symbol);
`;


