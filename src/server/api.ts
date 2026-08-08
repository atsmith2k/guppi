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

  return router;
}
