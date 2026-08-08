import express, { Router } from 'express';
import { GuppiDB } from '../db/client.js';
import { OnboardingEngine } from '../engine/onboarder.js';
import { RAGEngine } from '../engine/rag.js';
import { GuardEngine } from '../engine/guard.js';
import { TelemetryEngine } from '../engine/telemetry.js';
import { BrainstormEngine } from '../engine/brainstorm.js';
import { SelfHealingEngine } from '../engine/self_heal.js';
import { MultiRepoMeshEngine } from '../engine/mesh.js';
import { TestGenEngine } from '../engine/test_gen.js';
import { DependencyAnalyzer } from '../engine/dependency_analyzer.js';
import { AgentHandoffEngine } from '../engine/agent_handoff.js';
import { ExecutionFeedbackEngine } from '../engine/execution_feedback.js';
import { GuardEnforcerEngine } from '../engine/guard_enforcer.js';
import { GuppiWebSocketServer } from './ws.js';

export function createAPIRouter(db: GuppiDB, wsServer?: GuppiWebSocketServer): Router {
  const router = express.Router();
  const ragEngine = new RAGEngine(db);
  const guardEngine = new GuardEngine(db);
  const telemetryEngine = new TelemetryEngine(db);
  const onboarder = new OnboardingEngine(db);
  const brainstormEngine = new BrainstormEngine(db);
  const selfHealingEngine = new SelfHealingEngine(db);
  const meshEngine = new MultiRepoMeshEngine(db);
  const testGenEngine = new TestGenEngine(db);
  const dependencyAnalyzer = new DependencyAnalyzer(db);
  const handoffEngine = new AgentHandoffEngine(db);
  const feedbackEngine = new ExecutionFeedbackEngine(db);
  const guardEnforcer = new GuardEnforcerEngine(db);

  // Status & Health
  router.get('/status', (req, res) => {
    const onboarded = db.getConfig('onboarded') === 'true';
    const lastOnboarded = db.getConfig('last_onboarded_at');
    const projectName = db.getConfig('project_name') || 'Workspace';
    const framework = db.getConfig('framework') || 'Unknown';
    const memories = db.getRecentMemories(100);
    const codeFiles = db.getCodeIndex();
    const traces = db.getTelemetryTraces(100);

    res.json({
      status: 'online',
      version: '1.0.0',
      workspace: process.cwd(),
      projectName,
      framework,
      onboarded,
      lastOnboarded,
      stats: {
        totalMemories: memories.length,
        totalFiles: codeFiles.length,
        totalTraces: traces.length,
        guardrailsCount: db.getGuardrails().length,
      },
    });
  });

  // Trigger Onboarding
  router.post('/onboard', async (req, res) => {
    try {
      const report = await onboarder.runOnboarding();
      if (wsServer) {
        wsServer.broadcast('onboard_completed', report);
      }
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Memory RAG Endpoints
  router.get('/memories', (req, res) => {
    const q = req.query.q as string;
    const limit = parseInt((req.query.limit as string) || '20');

    if (q) {
      const results = ragEngine.queryContext(q, limit);
      res.json(results);
    } else {
      const memories = db.getRecentMemories(limit);
      res.json({ memories });
    }
  });

  router.post('/memories', (req, res) => {
    const { title, content, category, tags, source } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }
    const memory = ragEngine.storeMemory(title, content, category || 'decision', tags || [], source || 'dashboard_user');
    if (wsServer) wsServer.broadcast('memory_added', memory);
    res.json({ success: true, memory });
  });

  // AST Symbols
  router.get('/symbols', (req, res) => {
    const q = (req.query.q as string) || '';
    const symbols = db.querySymbols(q, 50);
    res.json({ symbols });
  });

  // Codebase Index
  router.get('/codebase', (req, res) => {
    const files = db.getCodeIndex();
    res.json({ files });
  });

  // Telemetry Traces
  router.get('/telemetry', (req, res) => {
    const traces = telemetryEngine.getTraces(100);
    res.json({ traces });
  });

  router.post('/telemetry', (req, res) => {
    const { agentId, stepName, toolName, inputPayload, outputPayload, tokensUsed, latencyMs, status } = req.body;
    const trace = telemetryEngine.recordStep(
      agentId || 'agent',
      stepName || 'step',
      toolName || 'tool',
      inputPayload,
      outputPayload,
      tokensUsed || 0,
      latencyMs || 0,
      status || 'success'
    );
    if (wsServer) wsServer.broadcast('telemetry_logged', trace);
    res.json({ success: true, trace });
  });

  // Test Generator Endpoint
  router.post('/test-gen/generate', (req, res) => {
    const { filePath } = req.body;
    if (!filePath) {
      res.status(400).json({ error: 'filePath is required' });
      return;
    }
    try {
      const suite = testGenEngine.generateTestsForFile(filePath);
      if (wsServer) wsServer.broadcast('test_suite_generated', suite);
      res.json({ success: true, suite });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Multi-Repo Mesh Endpoints
  router.post('/mesh/link', async (req, res) => {
    const { targetRepoPath } = req.body;
    if (!targetRepoPath) {
      res.status(400).json({ error: 'targetRepoPath is required' });
      return;
    }
    try {
      const repo = await meshEngine.linkRepository(targetRepoPath);
      if (wsServer) wsServer.broadcast('mesh_repo_linked', repo);
      res.json({ success: true, repo });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/mesh/search', (req, res) => {
    const q = (req.query.q as string) || '';
    const results = meshEngine.searchMesh(q);
    res.json({ results });
  });

  // Self-Healing Engine Endpoint
  router.post('/self-heal/propose', (req, res) => {
    const { filePath, errorTrace, failedTestName } = req.body;
    if (!filePath || !errorTrace) {
      res.status(400).json({ error: 'filePath and errorTrace are required' });
      return;
    }
    const entry = selfHealingEngine.proposeSelfHeal(filePath, errorTrace, failedTestName || 'Test Suite');
    if (wsServer) wsServer.broadcast('self_heal_proposed', entry);
    res.json({ success: true, entry });
  });

  // Brainstorming Engine Endpoints
  router.post('/brainstorm/start', (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }
    const state = brainstormEngine.startSession(topic);
    const nextQuestion = brainstormEngine.getNextQuestion(state.sessionId);
    res.json({ success: true, state, nextQuestion });
  });

  router.post('/brainstorm/answer', (req, res) => {
    const { sessionId, answer } = req.body;
    if (!sessionId || !answer) {
      res.status(400).json({ error: 'sessionId and answer are required' });
      return;
    }
    try {
      const result = brainstormEngine.submitAnswer(sessionId, answer);
      if (wsServer) wsServer.broadcast('brainstorm_step', result);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/brainstorm/latest', (req, res) => {
    const blueprint = db.getWorkingMemory('latest_brainstorm_blueprint');
    res.json({ blueprint: blueprint || null });
  });

  // Guardrails
  router.get('/guardrails', (req, res) => {
    const rules = db.getGuardrails();
    res.json({ rules });
  });

  router.post('/guardrails/check', (req, res) => {
    const { content, filePath } = req.body;
    const checkResult = guardEngine.checkContent(content || '', filePath);
    res.json(checkResult);
  });

  // Working Memory Tier
  router.get('/working-memory', (req, res) => {
    const scratchpad = db.getAllWorkingMemory();
    res.json({ scratchpad });
  });

  router.post('/working-memory', (req, res) => {
    const { key, value, agentId } = req.body;
    if (!key || !value) {
      res.status(400).json({ error: 'Key and value are required' });
      return;
    }
    db.setWorkingMemory(key, value, agentId || 'user');
    res.json({ success: true });
  });

  // Virtual Context Filesystem (guppi://) REST proxy
  router.use('/vfs', (req, res) => {
    const subpath = req.path.replace(/^\//, '') || '';
    if (subpath === 'memories/all' || subpath === 'memories') {
      res.json(db.getRecentMemories(100));
    } else if (subpath === 'symbols') {
      res.json(db.querySymbols('', 200));
    } else if (subpath === 'telemetry') {
      res.json(telemetryEngine.getTraces(50));
    } else if (subpath === 'guardrails') {
      res.json(db.getGuardrails());
    } else if (subpath === 'working') {
      res.json(db.getAllWorkingMemory());
    } else {
      res.json({
        virtualFileSystem: 'guppi://',
        availableNodes: [
          'guppi://memories/all',
          'guppi://memories/decisions',
          'guppi://symbols/all',
          'guppi://telemetry/latest',
          'guppi://guardrails/rules',
          'guppi://working/scratchpad',
        ],
      });
    }
  });

  // Bridge Tasks
  router.get('/bridge/tasks', (req, res) => {
    const tasks = db.getBridgeTasks();
    res.json({ tasks });
  });

  router.post('/bridge/tasks', (req, res) => {
    const { title, description, assigned_agent, artifacts } = req.body;
    const task = db.addBridgeTask({
      id: `task_${Date.now()}`,
      title: title || 'Agent Task',
      description: description || '',
      assigned_agent: assigned_agent || 'all',
      status: 'pending',
      artifacts: artifacts || {},
    });
    if (wsServer) wsServer.broadcast('task_added', task);
    res.json({ success: true, task });
  });

  // Dependency Graph & Impact Analysis
  router.get('/dependencies', (req, res) => {
    const q = (req.query.q as string) || '';
    const edges = db.getDependencyEdges(q, 100);
    res.json({ edges });
  });

  router.post('/dependencies/impact', (req, res) => {
    const { symbolOrPath } = req.body;
    if (!symbolOrPath) {
      res.status(400).json({ error: 'symbolOrPath is required' });
      return;
    }
    const report = dependencyAnalyzer.evaluateImpact(symbolOrPath);
    res.json({ report });
  });

  // Subagent Checkpoints & Handoff
  router.get('/checkpoints', (req, res) => {
    const checkpoints = handoffEngine.listCheckpoints(20);
    res.json({ checkpoints });
  });

  router.post('/checkpoints', (req, res) => {
    const { parentAgentId, subagentRole, taskSummary, stateObj } = req.body;
    const checkpoint = handoffEngine.saveCheckpoint(parentAgentId || 'agent', subagentRole || 'subagent', taskSummary || '', stateObj || {});
    if (wsServer) wsServer.broadcast('checkpoint_created', checkpoint);
    res.json({ success: true, checkpoint });
  });

  router.get('/checkpoints/:id/package', (req, res) => {
    const { id } = req.params;
    try {
      const pkg = handoffEngine.generateHandoffPackage(id);
      res.json({ success: true, package: pkg });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });


  // Execution Feedback & Auto-Fix
  router.post('/feedback/suggest', (req, res) => {
    const { commandType, stdout, stderr, exitCode, filePath } = req.body;
    const result = feedbackEngine.analyzeAndProposeFix(commandType || 'build', stdout, stderr, exitCode, filePath);
    if (wsServer) wsServer.broadcast('auto_fix_proposed', result);
    res.json({ success: true, ...result });
  });

  // Guard Enforcer & Rollback
  router.post('/guard/enforce', (req, res) => {
    const { filePath, proposedContent } = req.body;
    const result = guardEnforcer.preparePreFlight(filePath, proposedContent);
    res.json({ success: true, result });
  });

  router.post('/guard/rollback', (req, res) => {
    const { filePath } = req.body;
    const result = guardEnforcer.rollbackFile(filePath);
    res.json(result);
  });

  // Task Execution Planner Endpoints
  router.get('/tasks', (req, res) => {
    const { TaskPlannerEngine } = require('../engine/task_planner.js');
    const planner = new TaskPlannerEngine(db);
    const plans = planner.listActivePlans(20);
    res.json({ plans });
  });

  router.post('/tasks', (req, res) => {
    const { goal, title } = req.body;
    if (!goal) {
      res.status(400).json({ error: 'goal is required' });
      return;
    }
    const { TaskPlannerEngine } = require('../engine/task_planner.js');
    const planner = new TaskPlannerEngine(db);
    const created = planner.createPlan(goal, title);
    if (wsServer) wsServer.broadcast('task_plan_created', created);
    res.json({ success: true, ...created });
  });

  router.post('/tasks/step/update', (req, res) => {
    const { stepId, status, result } = req.body;
    if (!stepId || !status) {
      res.status(400).json({ error: 'stepId and status are required' });
      return;
    }
    const { TaskPlannerEngine } = require('../engine/task_planner.js');
    const planner = new TaskPlannerEngine(db);
    planner.updateStepStatus(stepId, status, result);
    if (wsServer) wsServer.broadcast('task_step_updated', { stepId, status, result });
    res.json({ success: true });
  });

  // Episodic Memory & Fact Graph Endpoints
  router.get('/episodic', (req, res) => {
    const { EpisodicMemoryEngine } = require('../engine/episodic_memory.js');
    const memEngine = new EpisodicMemoryEngine(db);
    const memories = memEngine.getRankedMemories(30);
    res.json({ memories });
  });

  router.post('/episodic', (req, res) => {
    const { topic, content, memoryType, importanceScore } = req.body;
    if (!topic || !content) {
      res.status(400).json({ error: 'topic and content are required' });
      return;
    }
    const { EpisodicMemoryEngine } = require('../engine/episodic_memory.js');
    const memEngine = new EpisodicMemoryEngine(db);
    const memory = memEngine.remember(topic, content, memoryType, importanceScore);
    if (wsServer) wsServer.broadcast('episodic_memory_added', memory);
    res.json({ success: true, memory });
  });

  router.get('/episodic/facts', (req, res) => {
    const q = (req.query.q as string) || '';
    const { EpisodicMemoryEngine } = require('../engine/episodic_memory.js');
    const memEngine = new EpisodicMemoryEngine(db);
    const facts = memEngine.queryFacts(q, 50);
    res.json({ facts });
  });

  router.post('/episodic/facts/extract', (req, res) => {
    const { text, source } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const { EpisodicMemoryEngine } = require('../engine/episodic_memory.js');
    const memEngine = new EpisodicMemoryEngine(db);
    const extracted = memEngine.extractFactTriples(text, source || 'manual_entry');
    res.json({ success: true, count: extracted.length, facts: extracted });
  });

  // Agent Evaluation Endpoints
  router.get('/eval/report', (req, res) => {
    const { AgentEvalEngine } = require('../engine/agent_eval.js');
    const evalEngine = new AgentEvalEngine(db);
    const report = evalEngine.getBenchmarkReport(50);
    res.json(report);
  });

  router.post('/eval/record', (req, res) => {
    const { agentId, queryPrompt, responseText, latencyMs, tokenCost, contextItems } = req.body;
    if (!agentId || !queryPrompt || !responseText) {
      res.status(400).json({ error: 'agentId, queryPrompt, and responseText are required' });
      return;
    }
    const { AgentEvalEngine } = require('../engine/agent_eval.js');
    const evalEngine = new AgentEvalEngine(db);
    const record = evalEngine.evaluateRun(agentId, queryPrompt, responseText, latencyMs || 100, tokenCost || 0, contextItems || []);
    if (wsServer) wsServer.broadcast('eval_run_recorded', record);
    res.json({ success: true, record });
  });

  // Call Graph & Signature Mutation Simulator Endpoints
  router.post('/callgraph/build', (req, res) => {
    const { SymbolCallGraphEngine } = require('../engine/symbol_call_graph.js');
    const cgEngine = new SymbolCallGraphEngine(db);
    const graph = cgEngine.buildCallGraph();
    res.json({ success: true, nodeCount: graph.nodes.length, edgeCount: graph.edges.length, graph });
  });

  router.get('/callgraph/symbol', (req, res) => {
    const symbolName = (req.query.symbol as string) || '';
    const edges = db.getCallGraphEdgesForSymbol(symbolName);
    const allNodes = db.getAllCallGraphNodes();
    res.json({ symbolName, edges, allNodes });
  });

  router.post('/callgraph/simulate', (req, res) => {
    const { targetSymbol, proposedSignature } = req.body;
    if (!targetSymbol || !proposedSignature) {
      res.status(400).json({ error: 'targetSymbol and proposedSignature are required' });
      return;
    }
    const { SymbolCallGraphEngine } = require('../engine/symbol_call_graph.js');
    const cgEngine = new SymbolCallGraphEngine(db);
    const simulation = cgEngine.simulateSignatureMutation(targetSymbol, proposedSignature);
    res.json({ success: true, simulation });
  });

  return router;
}


