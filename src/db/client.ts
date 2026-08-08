import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
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

export class GuppiDB {
  private db: Database.Database;
  public dbPath: string;

  constructor(targetDir: string = process.cwd()) {
    const guppiDir = path.join(targetDir, '.guppi');
    if (!fs.existsSync(guppiDir)) {
      fs.mkdirSync(guppiDir, { recursive: true });
    }
    this.dbPath = path.join(guppiDir, 'guppi.db');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.init();
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
    const stmt = this.db.prepare('SELECT * FROM codebase_index ORDER BY path ASC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      ...r,
      exports: JSON.parse(r.exports || '[]'),
      imports: JSON.parse(r.imports || '[]'),
    }));
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

  public close() {
    this.db.close();
  }
}
