import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { GuppiDB } from '../src/db/client.js';
import { TaskPlannerEngine } from '../src/engine/task_planner.js';
import { EpisodicMemoryEngine } from '../src/engine/episodic_memory.js';
import { AgentEvalEngine } from '../src/engine/agent_eval.js';
import { SymbolCallGraphEngine } from '../src/engine/symbol_call_graph.js';

const testWorkspace = path.join(process.cwd(), 'scratch', 'test_poached');
if (!fs.existsSync(testWorkspace)) {
  fs.mkdirSync(testWorkspace, { recursive: true });
}

let db: GuppiDB;

describe('GUPPI Poached Feature Pillars Suite', () => {
  before(() => {
    db = new GuppiDB(testWorkspace);
  });

  after(() => {
    db.close();
  });

  it('1. Task Execution Planner (Poached from Aider & Superpowers) - Decomposes goal into DAG steps', () => {
    const planner = new TaskPlannerEngine(db);
    const goal = 'Implement OAuth2 authentication flow';
    const { plan, steps } = planner.createPlan(goal);

    assert.strictEqual(plan.goal, goal);
    assert.strictEqual(steps.length, 4);
    assert.strictEqual(steps[0].assigned_role, 'Architect');

    // Update step status
    planner.updateStepStatus(steps[0].id, 'completed', 'Architecture verified');
    const progress = planner.getPlanProgress(plan.id);

    assert.strictEqual(progress.completedCount, 1);
    assert.strictEqual(progress.progressPercent, 25);
  });

  it('2. Decay-Ranked Episodic Memory & Fact Graph (Poached from Mem0 & MemGPT) - Evaluates decay score and extracts triples', () => {
    const memEngine = new EpisodicMemoryEngine(db);
    const memory = memEngine.remember('SQLite WAL', 'GuppiDB uses better-sqlite3 with WAL mode for concurrency', 'episodic', 0.9);

    assert.strictEqual(memory.topic, 'SQLite WAL');
    assert.strictEqual(memory.importance_score, 0.9);

    const ranked = memEngine.getRankedMemories(10);
    assert.strictEqual(ranked.length > 0, true);
    assert.strictEqual(typeof ranked[0].decay_score, 'number');

    // Extract Fact Triples
    const triples = memEngine.extractFactTriples('GuppiDB uses better-sqlite3 for persistence');
    assert.strictEqual(triples.length > 0, true);
    assert.strictEqual(triples[0].subject, 'GuppiDB');
    assert.strictEqual(triples[0].relation, 'uses');

    const queried = memEngine.queryFacts('GuppiDB');
    assert.strictEqual(queried.length > 0, true);
  });

  it('3. Agent Evaluation & RAG Precision Studio (Poached from DeepEval & AgentOps) - Benchmarks agent run', () => {
    const evalEngine = new AgentEvalEngine(db);
    const run = evalEngine.evaluateRun(
      'antigravity_agent',
      'What is GUPPI memory?',
      'GUPPI memory stores architectural decisions and RAG rules',
      120,
      350,
      ['GUPPI memory stores architectural decisions']
    );

    assert.strictEqual(run.agent_id, 'antigravity_agent');
    assert.strictEqual(run.precision_score > 0, true);
    assert.strictEqual(run.faithfulness_score > 0, true);

    const report = evalEngine.getBenchmarkReport(10);
    assert.strictEqual(report.totalRuns > 0, true);
    assert.strictEqual(typeof report.avgPrecision, 'number');
  });

  it('4. Symbol Call Graph & Signature Mutation Simulator (Poached from Tree-Sitter & GraphRAG) - Evaluates mutation risk score', () => {
    const cgEngine = new SymbolCallGraphEngine(db, process.cwd());
    const graph = cgEngine.buildCallGraph();

    assert.strictEqual(Array.isArray(graph.nodes), true);
    assert.strictEqual(Array.isArray(graph.edges), true);

    const sim = cgEngine.simulateSignatureMutation('GuppiDB', 'GuppiDB(customPath: string)');
    assert.strictEqual(sim.targetSymbol, 'GuppiDB');
    assert.strictEqual(typeof sim.riskScore, 'number');
    assert.strictEqual(typeof sim.recommendation, 'string');
  });
});
