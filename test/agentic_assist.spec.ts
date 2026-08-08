import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { GuppiDB } from '../src/db/client.js';
import { DependencyAnalyzer } from '../src/engine/dependency_analyzer.js';
import { AgentHandoffEngine } from '../src/engine/agent_handoff.js';
import { ExecutionFeedbackEngine } from '../src/engine/execution_feedback.js';
import { GuardEnforcerEngine } from '../src/engine/guard_enforcer.js';
import { createMCPServer } from '../src/server/mcp.ts';

const testWorkspace = path.join(process.cwd(), 'scratch', 'test_env');
if (!fs.existsSync(testWorkspace)) {
  fs.mkdirSync(testWorkspace, { recursive: true });
}

let db: GuppiDB;

describe('GUPPI Stronger Agentic Assistance Engine Suite', () => {
  before(() => {
    db = new GuppiDB(testWorkspace);
  });

  after(() => {
    db.close();
  });

  it('1. DependencyAnalyzer - Indexes file AST and evaluates downstream impact', () => {
    const analyzer = new DependencyAnalyzer(db);
    const mockFile = path.join(testWorkspace, 'service.ts');
    const mockCode = `
      import { GuppiDB } from './client.js';
      export class ServiceEngine extends BaseEngine {
        public run() {
          console.log("running");
        }
      }
    `;
    fs.writeFileSync(mockFile, mockCode, 'utf-8');

    const edges = analyzer.analyzeAndIndexFile(mockFile, mockCode);
    assert.strictEqual(edges.length > 0, true, 'Should extract dependency edges');

    const report = analyzer.evaluateImpact('GuppiDB');
    assert.strictEqual(report.target, 'GuppiDB');
    assert.strictEqual(typeof report.riskLevel, 'string');
  });

  it('2. AgentHandoffEngine - Saves checkpoint and generates handoff package', () => {
    const handoff = new AgentHandoffEngine(db);
    const ckpt = handoff.saveCheckpoint('parent_123', 'Refactorer', 'Refactored DB schema', { status: 'in_progress' });
    assert.strictEqual(ckpt.subagent_role, 'Refactorer');

    const pkg = handoff.generateHandoffPackage(ckpt.id);
    assert.strictEqual(pkg.parentAgentId, 'parent_123');
    assert.strictEqual(pkg.instructionPrompt.includes('Role: Refactorer'), true);
  });

  it('3. ExecutionFeedbackEngine - Diagnoses runtime error and suggests surgical fix', () => {
    const feedback = new ExecutionFeedbackEngine(db);
    const res = feedback.analyzeAndProposeFix('typescript', 'TS2322: Type string is not assignable to type number', '', 1, 'src/db/client.ts');

    assert.strictEqual(res.fix.confidence >= 0.7, true);
    assert.strictEqual(res.fix.diagnosis.includes('TypeScript type mismatch'), true);
    assert.strictEqual(res.record.command_type, 'typescript');
  });

  it('4. GuardEnforcerEngine - Pre-flight shadow backup & rollback verification', () => {
    const enforcer = new GuardEnforcerEngine(db, testWorkspace);
    const targetFile = path.join(testWorkspace, 'config.ts');
    fs.writeFileSync(targetFile, 'export const secret = "initial";', 'utf-8');

    // Run preflight
    const preflight = enforcer.preparePreFlight(targetFile, 'export const secret = "modified";');
    assert.strictEqual(preflight.allowed, true);
    assert.strictEqual(preflight.backup !== undefined, true);

    // Modify file
    fs.writeFileSync(targetFile, 'export const secret = "corrupted";', 'utf-8');

    // Rollback
    const rollback = enforcer.rollbackFile(targetFile);
    assert.strictEqual(rollback.success, true);

    const restoredContent = fs.readFileSync(targetFile, 'utf-8');
    assert.strictEqual(restoredContent, 'export const secret = "initial";');
  });
});
