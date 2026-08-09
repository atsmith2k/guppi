import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { CREATE_TABLES_SQL } from './schema.js';

export interface MemoryItem {
  id: string;
  workspace: string;
  category: 'decision' | 'rule' | 'architecture' | 'bug_solution' | 'convention' | 'context';
  title: string;
  content: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CodeFileIndex {
  path: string;
  file_type: string;
  size: number;
  line_count: number;
  summary: string;
  exports: string[];
  imports: string[];
  hash: string;
  indexed_at: string;
}

export interface ASTSymbol {
  id: string;
  file_path: string;
  symbol_name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'type' | 'export';
  line_start: number;
  line_end: number;
  docstring?: string;
  signature: string;
}

export interface TelemetryTrace {
  id: string;
  agent_id: string;
  step_name: string;
  tool_name: string;
  input_payload?: string;
  output_payload?: string;
  tokens_used: number;
  latency_ms: number;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
}

export interface GuardrailRule {
  id: string;
  rule_name: string;
  description: string;
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export interface BridgeTask {
  id: string;
  title: string;
  description: string;
  assigned_agent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  artifacts: Record<string, any>;
  created_at: string;
}

export interface DependencyEdge {
  id: string;
  source_symbol: string;
  target_symbol: string;
  edge_type: 'calls' | 'imports' | 'extends' | 'implements';
  file_path: string;
  line_number: number;
  created_at: string;
}

export interface SubagentCheckpoint {
  id: string;
  parent_agent_id: string;
  subagent_role: string;
  task_summary: string;
  state_json: string;
  created_at: string;
}

export interface ExecutionFeedbackRecord {
  id: string;
  command_type: string;
  stdout?: string;
  stderr?: string;
  exit_code: number;
  matched_memory_id?: string;
  proposed_fix?: string;
  created_at: string;
}

export interface ShadowBackupRecord {
  id: string;
  file_path: string;
  backup_path: string;
  hash: string;
  created_at: string;
}

export interface TaskPlan {
  id: string;
  title: string;
  goal: string;
  status: 'planning' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface TaskStep {
  id: string;
  plan_id: string;
  step_number: number;
  title: string;
  description: string;
  assigned_role: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  created_at: string;
  updated_at: string;
}

export interface EpisodicMemoryRecord {
  id: string;
  topic: string;
  content: string;
  memory_type: 'episodic' | 'semantic' | 'preference';
  importance_score: number;
  access_count: number;
  last_accessed_at: string;
  decay_score: number;
  created_at: string;
}

export interface FactTriple {
  id: string;
  subject: string;
  relation: string;
  object: string;
  confidence: number;
  source: string;
  created_at: string;
}

export interface EvalRunRecord {
  id: string;
  agent_id: string;
  query_prompt: string;
  response_text: string;
  precision_score: number;
  faithfulness_score: number;
  latency_ms: number;
  token_cost: number;
  created_at: string;
}

export interface CallGraphNode {
  id: string;
  symbol_name: string;
  kind: string;
  file_path: string;
  line_number: number;
  signature: string;
}

export interface CallGraphEdge {
  id: string;
  caller_symbol: string;
  callee_symbol: string;
  file_path: string;
  line_number: number;
  call_type: 'direct_call' | 'method_invocation' | 'instantiation';
}


export class GuppiDB {
  private db: Database.Database;
  private stmtCache: Map<string, Database.Statement> = new Map();
  public dbPath: string;

  constructor(targetDir: string = process.cwd()) {
    const guppiDir = path.join(targetDir, '.guppi');
    if (!fs.existsSync(guppiDir)) {
      fs.mkdirSync(guppiDir, { recursive: true });
    }
    this.dbPath = path.join(guppiDir, 'guppi.db');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('mmap_size = 268435456');
    this.db.pragma('cache_size = -16000');
    this.init();
  }

  private getStmt(sql: string): Database.Statement {
    let stmt = this.stmtCache.get(sql);
    if (!stmt) {
      stmt = this.db.prepare(sql);
      this.stmtCache.set(sql, stmt);
    }
    return stmt;
  }

  private init() {
    this.db.exec(CREATE_TABLES_SQL);
    this.seedDefaultGuardrails();
  }


  private seedDefaultGuardrails() {
    const checkStmt = this.db.prepare('SELECT COUNT(*) as count FROM guardrails');
    const row = checkStmt.get() as { count: number };
    if (row.count === 0) {
      const insert = this.db.prepare(
        'INSERT INTO guardrails (id, rule_name, description, pattern, severity, enabled) VALUES (?, ?, ?, ?, ?, ?)'
      );
      insert.run('g1', 'No Hardcoded API Keys', 'Detect hardcoded secret keys or tokens in code edits', '(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})', 'error', 1);
      insert.run('g2', 'No Silent Catch Blocks', 'Flag empty catch blocks swallowing exceptions', 'catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}', 'warning', 1);
      insert.run('g3', 'Enforce Async Await Pattern', 'Encourage clean async handling over unhandled promises', '\\.then\\s*\\(', 'info', 1);
    }
  }

  // Workspace Config
  public setConfig(key: string, value: string) {
    const stmt = this.db.prepare(`
      INSERT INTO workspace_config (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(key, value, new Date().toISOString());
  }

  public getConfig(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM workspace_config WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  // RAG / Memory Management
  public addMemory(item: Omit<MemoryItem, 'created_at' | 'updated_at'>): MemoryItem {
    const now = new Date().toISOString();
    const memory: MemoryItem = { ...item, created_at: now, updated_at: now };

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, workspace, category, title, content, tags, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      memory.id,
      memory.workspace,
      memory.category,
      memory.title,
      memory.content,
      JSON.stringify(memory.tags),
      memory.source,
      memory.created_at,
      memory.updated_at
    );

    // Sync to FTS5
    const ftsStmt = this.db.prepare(`
      INSERT INTO memories_fts (id, title, content, category, tags)
      VALUES (?, ?, ?, ?, ?)
    `);
    ftsStmt.run(memory.id, memory.title, memory.content, memory.category, memory.tags.join(' '));

    return memory;
  }

  public searchMemories(query: string, limit: number = 10): MemoryItem[] {
    if (!query || query.trim() === '') {
      return this.getRecentMemories(limit);
    }

    try {
      const sanitizedQuery = query.replace(/['"^*]/g, ' ').trim();
      const ftsStmt = this.db.prepare(`
        SELECT m.* FROM memories m
        JOIN memories_fts f ON m.id = f.id
        WHERE memories_fts MATCH ?
        ORDER BY rank LIMIT ?
      `);
      const rows = ftsStmt.all(`${sanitizedQuery}*`, limit) as any[];

      return rows.map((r) => ({
        ...r,
        tags: JSON.parse(r.tags || '[]'),
      }));
    } catch {
      // Fallback to LIKE query if FTS syntax issue
      const fallbackStmt = this.db.prepare(`
        SELECT * FROM memories
        WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
        ORDER BY updated_at DESC LIMIT ?
      `);
      const term = `%${query}%`;
      const rows = fallbackStmt.all(term, term, term, limit) as any[];
      return rows.map((r) => ({
        ...r,
        tags: JSON.parse(r.tags || '[]'),
      }));
    }
  }

  public getRecentMemories(limit: number = 20): MemoryItem[] {
    const stmt = this.db.prepare('SELECT * FROM memories ORDER BY updated_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
    }));
  }

  // Codebase Indexing
  public saveCodeIndex(files: CodeFileIndex[]) {
    const deleteIndex = this.db.prepare('DELETE FROM codebase_index');
    const deleteFts = this.db.prepare('DELETE FROM codebase_fts');
    const insertIndex = this.db.prepare(`
      INSERT INTO codebase_index (path, file_type, size, line_count, summary, exports, imports, hash, indexed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertFts = this.db.prepare(`
      INSERT INTO codebase_fts (path, summary, exports, imports)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      deleteIndex.run();
      deleteFts.run();
      for (const f of files) {
        const exportsStr = JSON.stringify(f.exports);
        const importsStr = JSON.stringify(f.imports);
        insertIndex.run(f.path, f.file_type, f.size, f.line_count, f.summary, exportsStr, importsStr, f.hash, f.indexed_at);
        insertFts.run(f.path, f.summary, f.exports.join(' '), f.imports.join(' '));
      }
    });

    transaction();
  }

  public getCodeIndex(): CodeFileIndex[] {
    const stmt = this.getStmt('SELECT * FROM codebase_index ORDER BY path ASC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      ...r,
      exports: JSON.parse(r.exports || '[]'),
      imports: JSON.parse(r.imports || '[]'),
    }));
  }

  public searchCodebaseFTS(query: string, limit: number = 5): CodeFileIndex[] {
    if (!query || query.trim() === '') {
      return this.getCodeIndex().slice(0, limit);
    }
    try {
      const sanitized = query.replace(/['"^*]/g, ' ').trim();
      const ftsStmt = this.getStmt(`
        SELECT c.* FROM codebase_index c
        JOIN codebase_fts f ON c.path = f.path
        WHERE codebase_fts MATCH ?
        LIMIT ?
      `);
      const rows = ftsStmt.all(`${sanitized}*`, limit) as any[];
      return rows.map((r) => ({
        ...r,
        exports: JSON.parse(r.exports || '[]'),
        imports: JSON.parse(r.imports || '[]'),
      }));
    } catch {
      const term = `%${query}%`;
      const fallbackStmt = this.getStmt(`
        SELECT * FROM codebase_index
        WHERE path LIKE ? OR summary LIKE ? OR exports LIKE ? OR imports LIKE ?
        ORDER BY path ASC LIMIT ?
      `);
      const rows = fallbackStmt.all(term, term, term, term, limit) as any[];
      return rows.map((r) => ({
        ...r,
        exports: JSON.parse(r.exports || '[]'),
        imports: JSON.parse(r.imports || '[]'),
      }));
    }
  }


  // AST Symbols
  public saveASTSymbols(symbols: ASTSymbol[]) {
    const deleteStmt = this.db.prepare('DELETE FROM ast_symbols');
    const insertStmt = this.db.prepare(`
      INSERT INTO ast_symbols (id, file_path, symbol_name, kind, line_start, line_end, docstring, signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      deleteStmt.run();
      for (const s of symbols) {
        insertStmt.run(s.id, s.file_path, s.symbol_name, s.kind, s.line_start, s.line_end, s.docstring || '', s.signature);
      }
    });

    transaction();
  }

  public querySymbols(query: string, limit: number = 20): ASTSymbol[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ast_symbols
      WHERE symbol_name LIKE ? OR signature LIKE ? OR file_path LIKE ?
      ORDER BY symbol_name ASC LIMIT ?
    `);
    const term = `%${query}%`;
    return stmt.all(term, term, term, limit) as ASTSymbol[];
  }

  // Telemetry
  public logTelemetry(trace: Omit<TelemetryTrace, 'timestamp'>): TelemetryTrace {
    const fullTrace: TelemetryTrace = {
      ...trace,
      timestamp: new Date().toISOString(),
    };
    const stmt = this.db.prepare(`
      INSERT INTO telemetry_traces (id, agent_id, step_name, tool_name, input_payload, output_payload, tokens_used, latency_ms, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      fullTrace.id,
      fullTrace.agent_id,
      fullTrace.step_name,
      fullTrace.tool_name,
      fullTrace.input_payload || '',
      fullTrace.output_payload || '',
      fullTrace.tokens_used,
      fullTrace.latency_ms,
      fullTrace.status,
      fullTrace.timestamp
    );
    return fullTrace;
  }

  public getTelemetryTraces(limit: number = 50): TelemetryTrace[] {
    const stmt = this.db.prepare('SELECT * FROM telemetry_traces ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit) as TelemetryTrace[];
  }

  // Guardrails
  public getGuardrails(): GuardrailRule[] {
    const stmt = this.db.prepare('SELECT * FROM guardrails');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({ ...r, enabled: Boolean(r.enabled) }));
  }

  // Bridge Tasks
  public addBridgeTask(task: Omit<BridgeTask, 'created_at'>): BridgeTask {
    const fullTask: BridgeTask = {
      ...task,
      created_at: new Date().toISOString(),
    };
    const stmt = this.db.prepare(`
      INSERT INTO agent_bridge_tasks (id, title, description, assigned_agent, status, artifacts, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      fullTask.id,
      fullTask.title,
      fullTask.description,
      fullTask.assigned_agent,
      fullTask.status,
      JSON.stringify(fullTask.artifacts),
      fullTask.created_at
    );
    return fullTask;
  }

  public getBridgeTasks(): BridgeTask[] {
    const stmt = this.db.prepare('SELECT * FROM agent_bridge_tasks ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({ ...r, artifacts: JSON.parse(r.artifacts || '{}') }));
  }

  // Working Memory Tier
  public setWorkingMemory(key: string, value: string, agentId: string = 'agent') {
    const stmt = this.db.prepare(`
      INSERT INTO working_scratchpad (key, value, agent_id, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, agent_id = excluded.agent_id, updated_at = excluded.updated_at
    `);
    stmt.run(key, value, agentId, new Date().toISOString());
  }

  public getWorkingMemory(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM working_scratchpad WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  public getAllWorkingMemory(): { key: string; value: string; agent_id: string; updated_at: string }[] {
    const stmt = this.db.prepare('SELECT * FROM working_scratchpad ORDER BY updated_at DESC');
    return stmt.all() as any[];
  }

  // Knowledge Graph Relations
  public linkMemory(memoryId: string, targetId: string, relationType: string = 'affects') {
    const id = `rel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stmt = this.db.prepare(`
      INSERT INTO memory_relations (id, memory_id, target_id, relation_type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, memoryId, targetId, relationType, new Date().toISOString());
  }

  public getMemoryRelations(memoryId: string): { id: string; target_id: string; relation_type: string }[] {
    const stmt = this.db.prepare('SELECT * FROM memory_relations WHERE memory_id = ?');
    return stmt.all(memoryId) as any[];
  }

  // Git Commit History & Semantic Diff RAG
  public saveGitCommits(commits: { hash: string; author: string; date: string; message: string; files_changed: string }[]) {
    const deleteCommits = this.db.prepare('DELETE FROM git_commits');
    const deleteFts = this.db.prepare('DELETE FROM git_commits_fts');
    const insertCommit = this.db.prepare(`
      INSERT INTO git_commits (hash, author, date, message, files_changed)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertFts = this.db.prepare(`
      INSERT INTO git_commits_fts (hash, author, message, files_changed)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      deleteCommits.run();
      deleteFts.run();
      for (const c of commits) {
        insertCommit.run(c.hash, c.author, c.date, c.message, c.files_changed);
        insertFts.run(c.hash, c.author, c.message, c.files_changed);
      }
    });

    transaction();
  }

  public queryGitCommits(query: string, limit: number = 20): { hash: string; author: string; date: string; message: string; files_changed: string }[] {
    if (!query) {
      const stmt = this.db.prepare('SELECT * FROM git_commits ORDER BY date DESC LIMIT ?');
      return stmt.all(limit) as any[];
    }
    const stmt = this.db.prepare(`
      SELECT * FROM git_commits
      WHERE message LIKE ? OR author LIKE ? OR files_changed LIKE ? OR hash LIKE ?
      ORDER BY date DESC LIMIT ?
    `);
    const term = `%${query}%`;
    return stmt.all(term, term, term, term, limit) as any[];
  }

  // Dependency Graph
  public addDependencyEdge(edge: Omit<DependencyEdge, 'id' | 'created_at'>): DependencyEdge {
    const id = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const fullEdge: DependencyEdge = { ...edge, id, created_at: now };
    const stmt = this.getStmt(`
      INSERT INTO dependency_graph (id, source_symbol, target_symbol, edge_type, file_path, line_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, edge.source_symbol, edge.target_symbol, edge.edge_type, edge.file_path, edge.line_number, now);
    return fullEdge;
  }

  public addDependencyEdgesBatch(edges: Omit<DependencyEdge, 'id' | 'created_at'>[]): DependencyEdge[] {
    if (edges.length === 0) return [];
    const now = new Date().toISOString();
    const saved: DependencyEdge[] = [];
    const insertStmt = this.getStmt(`
      INSERT INTO dependency_graph (id, source_symbol, target_symbol, edge_type, file_path, line_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      let idx = 0;
      for (const edge of edges) {
        const id = `dep_${Date.now()}_${idx++}_${Math.random().toString(36).substring(2, 6)}`;
        const fullEdge: DependencyEdge = { ...edge, id, created_at: now };
        insertStmt.run(id, edge.source_symbol, edge.target_symbol, edge.edge_type, edge.file_path, edge.line_number, now);
        saved.push(fullEdge);
      }
    });

    transaction();
    return saved;
  }


  public getDependencyEdges(symbolOrPath?: string, limit: number = 100): DependencyEdge[] {
    if (!symbolOrPath) {
      const stmt = this.db.prepare('SELECT * FROM dependency_graph ORDER BY created_at DESC LIMIT ?');
      return stmt.all(limit) as DependencyEdge[];
    }
    const stmt = this.db.prepare(`
      SELECT * FROM dependency_graph
      WHERE source_symbol LIKE ? OR target_symbol LIKE ? OR file_path LIKE ?
      ORDER BY created_at DESC LIMIT ?
    `);
    const term = `%${symbolOrPath}%`;
    return stmt.all(term, term, term, limit) as DependencyEdge[];
  }

  public clearDependencyEdgesForFile(filePath: string) {
    const stmt = this.db.prepare('DELETE FROM dependency_graph WHERE file_path = ?');
    stmt.run(filePath);
  }

  // Subagent Checkpoints & Context Handoff
  public createSubagentCheckpoint(checkpoint: Omit<SubagentCheckpoint, 'id' | 'created_at'>): SubagentCheckpoint {
    const id = `ckpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: SubagentCheckpoint = { ...checkpoint, id, created_at: now };
    const stmt = this.db.prepare(`
      INSERT INTO subagent_checkpoints (id, parent_agent_id, subagent_role, task_summary, state_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, checkpoint.parent_agent_id, checkpoint.subagent_role, checkpoint.task_summary, checkpoint.state_json, now);
    return item;
  }

  public getSubagentCheckpoints(limit: number = 20): SubagentCheckpoint[] {
    const stmt = this.db.prepare('SELECT * FROM subagent_checkpoints ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as SubagentCheckpoint[];
  }

  public getSubagentCheckpoint(id: string): SubagentCheckpoint | undefined {
    const stmt = this.db.prepare('SELECT * FROM subagent_checkpoints WHERE id = ?');
    return stmt.get(id) as SubagentCheckpoint | undefined;
  }

  // Execution Feedback & Auto-Fix
  public logExecutionFeedback(record: Omit<ExecutionFeedbackRecord, 'id' | 'created_at'>): ExecutionFeedbackRecord {
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: ExecutionFeedbackRecord = { ...record, id, created_at: now };
    const stmt = this.db.prepare(`
      INSERT INTO execution_feedback (id, command_type, stdout, stderr, exit_code, matched_memory_id, proposed_fix, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, record.command_type, record.stdout || null, record.stderr || null, record.exit_code, record.matched_memory_id || null, record.proposed_fix || null, now);
    return item;
  }

  public getRecentExecutionFeedback(limit: number = 20): ExecutionFeedbackRecord[] {
    const stmt = this.db.prepare('SELECT * FROM execution_feedback ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as ExecutionFeedbackRecord[];
  }

  // Shadow Backups & Guard Enforcer
  public createShadowBackup(filePath: string): ShadowBackupRecord {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) throw new Error(`File not found for shadow backup: ${filePath}`);
    const backupDir = path.join(path.dirname(this.dbPath), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const content = fs.readFileSync(absPath, 'utf-8');
    const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
    const backupFilename = `${path.basename(absPath)}_${Date.now()}_${hash}.bak`;
    const backupPath = path.join(backupDir, backupFilename);

    fs.writeFileSync(backupPath, content, 'utf-8');
    return this.createShadowBackupRecord({ file_path: absPath, backup_path: backupPath, hash });
  }

  public createShadowBackupRecord(record: Omit<ShadowBackupRecord, 'id' | 'created_at'>): ShadowBackupRecord {
    const id = `bak_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: ShadowBackupRecord = { ...record, id, created_at: now };
    const stmt = this.db.prepare(`
      INSERT INTO shadow_backups (id, file_path, backup_path, hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, record.file_path, record.backup_path, record.hash, now);
    return item;
  }

  public getLatestShadowBackup(filePath: string): ShadowBackupRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM shadow_backups WHERE file_path = ? ORDER BY created_at DESC LIMIT 1');
    return stmt.get(filePath) as ShadowBackupRecord | undefined;
  }

  public getShadowBackups(limit: number = 20): ShadowBackupRecord[] {
    const stmt = this.db.prepare('SELECT * FROM shadow_backups ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as ShadowBackupRecord[];
  }

  // Task Execution Planner & Multi-Agent DAG Orchestrator
  public createTaskPlan(title: string, goal: string): TaskPlan {
    const id = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const plan: TaskPlan = { id, title, goal, status: 'planning', created_at: now, updated_at: now };
    const stmt = this.db.prepare(`
      INSERT INTO task_plans (id, title, goal, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, goal, plan.status, now, now);
    return plan;
  }

  public getTaskPlans(limit: number = 20): TaskPlan[] {
    const stmt = this.db.prepare('SELECT * FROM task_plans ORDER BY updated_at DESC LIMIT ?');
    return stmt.all(limit) as TaskPlan[];
  }

  public getTaskPlan(planId: string): TaskPlan | undefined {
    const stmt = this.db.prepare('SELECT * FROM task_plans WHERE id = ?');
    return stmt.get(planId) as TaskPlan | undefined;
  }

  public addTaskStep(step: Omit<TaskStep, 'id' | 'created_at' | 'updated_at'>): TaskStep {
    const id = `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const fullStep: TaskStep = { ...step, id, created_at: now, updated_at: now };
    const stmt = this.db.prepare(`
      INSERT INTO task_steps (id, plan_id, step_number, title, description, assigned_role, dependencies, status, result, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, step.plan_id, step.step_number, step.title, step.description, step.assigned_role, JSON.stringify(step.dependencies), step.status, step.result || null, now, now);
    return fullStep;
  }

  public getTaskSteps(planId: string): TaskStep[] {
    const stmt = this.db.prepare('SELECT * FROM task_steps WHERE plan_id = ? ORDER BY step_number ASC');
    const rows = stmt.all(planId) as any[];
    return rows.map((r) => ({ ...r, dependencies: JSON.parse(r.dependencies || '[]') }));
  }

  public updateTaskStepStatus(stepId: string, status: TaskStep['status'], result?: string) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE task_steps SET status = ?, result = ?, updated_at = ? WHERE id = ?');
    stmt.run(status, result || null, now, stepId);
  }

  // Decay-Ranked Episodic Agent Memory & Fact Graph
  public addEpisodicMemory(memory: Omit<EpisodicMemoryRecord, 'id' | 'access_count' | 'decay_score' | 'created_at'>): EpisodicMemoryRecord {
    const id = `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const rec: EpisodicMemoryRecord = {
      ...memory,
      id,
      access_count: 1,
      decay_score: memory.importance_score,
      created_at: now,
    };
    const stmt = this.db.prepare(`
      INSERT INTO episodic_memories (id, topic, content, memory_type, importance_score, access_count, last_accessed_at, decay_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, memory.topic, memory.content, memory.memory_type, memory.importance_score, 1, memory.last_accessed_at, memory.importance_score, now);
    return rec;
  }

  public getEpisodicMemories(limit: number = 20): EpisodicMemoryRecord[] {
    const stmt = this.db.prepare('SELECT * FROM episodic_memories ORDER BY decay_score DESC, last_accessed_at DESC LIMIT ?');
    return stmt.all(limit) as EpisodicMemoryRecord[];
  }

  public addFactTriple(triple: Omit<FactTriple, 'id' | 'created_at'>): FactTriple {
    const id = `fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: FactTriple = { ...triple, id, created_at: now };
    const stmt = this.db.prepare(`
      INSERT INTO fact_triples (id, subject, relation, object, confidence, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, triple.subject, triple.relation, triple.object, triple.confidence, triple.source, now);

    const ftsStmt = this.db.prepare(`
      INSERT INTO fact_triples_fts (subject, relation, object, source)
      VALUES (?, ?, ?, ?)
    `);
    ftsStmt.run(triple.subject, triple.relation, triple.object, triple.source);

    return item;
  }

  public queryFactTriples(query: string, limit: number = 20): FactTriple[] {
    if (!query) {
      const stmt = this.db.prepare('SELECT * FROM fact_triples ORDER BY created_at DESC LIMIT ?');
      return stmt.all(limit) as FactTriple[];
    }
    const stmt = this.db.prepare(`
      SELECT * FROM fact_triples
      WHERE subject LIKE ? OR relation LIKE ? OR object LIKE ? OR source LIKE ?
      ORDER BY created_at DESC LIMIT ?
    `);
    const term = `%${query}%`;
    return stmt.all(term, term, term, term, limit) as FactTriple[];
  }

  // Agent Evaluation & RAG Precision Benchmark Studio
  public recordEvalRun(evalRecord: Omit<EvalRunRecord, 'id' | 'created_at'>): EvalRunRecord {
    const id = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: EvalRunRecord = { ...evalRecord, id, created_at: now };
    const stmt = this.db.prepare(`
      INSERT INTO eval_runs (id, agent_id, query_prompt, response_text, precision_score, faithfulness_score, latency_ms, token_cost, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, evalRecord.agent_id, evalRecord.query_prompt, evalRecord.response_text, evalRecord.precision_score, evalRecord.faithfulness_score, evalRecord.latency_ms, evalRecord.token_cost, now);
    return item;
  }

  public getEvalRuns(limit: number = 20): EvalRunRecord[] {
    const stmt = this.db.prepare('SELECT * FROM eval_runs ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as EvalRunRecord[];
  }

  // AST Symbol Call Graph & Signature Mutation Simulator
  public saveCallGraphNodesAndEdges(nodes: Omit<CallGraphNode, 'id'>[], edges: Omit<CallGraphEdge, 'id'>[]) {
    const deleteNodes = this.db.prepare('DELETE FROM call_graph_nodes');
    const deleteEdges = this.db.prepare('DELETE FROM call_graph_edges');

    const insertNode = this.db.prepare(`
      INSERT INTO call_graph_nodes (id, symbol_name, kind, file_path, line_number, signature)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertEdge = this.db.prepare(`
      INSERT INTO call_graph_edges (id, caller_symbol, callee_symbol, file_path, line_number, call_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      deleteNodes.run();
      deleteEdges.run();
      nodes.forEach((n, idx) => insertNode.run(`cgn_${idx}_${n.symbol_name}`, n.symbol_name, n.kind, n.file_path, n.line_number, n.signature));
      edges.forEach((e, idx) => insertEdge.run(`cge_${idx}`, e.caller_symbol, e.callee_symbol, e.file_path, e.line_number, e.call_type));
    });

    transaction();
  }

  public getCallGraphEdgesForSymbol(symbolName: string): CallGraphEdge[] {
    const stmt = this.db.prepare(`
      SELECT * FROM call_graph_edges
      WHERE caller_symbol LIKE ? OR callee_symbol LIKE ?
    `);
    const term = `%${symbolName}%`;
    return stmt.all(term, term) as CallGraphEdge[];
  }

  public getAllCallGraphNodes(): CallGraphNode[] {
    const stmt = this.db.prepare('SELECT * FROM call_graph_nodes LIMIT 100');
    return stmt.all() as CallGraphNode[];
  }

  public close() {
    this.db.close();
  }
}

