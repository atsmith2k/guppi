import fs from 'fs';
import path from 'path';
import { GuppiDB } from '../db/client.js';

export interface SelfHealingEntry {
  id: string;
  file_path: string;
  failed_test_name: string;
  error_trace: string;
  proposed_diff: string;
  backup_snapshot: string;
  status: 'pending' | 'approved' | 'reverted' | 'failed';
  timestamp: string;
}

export class SelfHealingEngine {
  private db: GuppiDB;
  private workspacePath: string;

  constructor(db: GuppiDB, workspacePath: string = process.cwd()) {
    this.db = db;
    this.workspacePath = workspacePath;
  }

  /**
   * Creates emergency backup snapshot before self-healing, analyzes error trace,
   * and logs self-healing proposal.
   */
  public proposeSelfHeal(filePath: string, errorTrace: string, failedTestName: string = 'Test Suite'): SelfHealingEntry {
    const fullPath = path.join(this.workspacePath, filePath);
    let backupContent = '';

    if (fs.existsSync(fullPath)) {
      backupContent = fs.readFileSync(fullPath, 'utf-8');
    }

    const backupDir = path.join(this.workspacePath, '.guppi', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFileName = `${path.basename(filePath)}_${Date.now()}.bak`;
    const backupPath = path.join(backupDir, backupFileName);
    fs.writeFileSync(backupPath, backupContent);

    // Generate proposed self-healing diff hint based on error traceback
    let proposedDiff = `// --- Proposed Self-Healing Edit for: ${filePath} ---\n`;
    if (errorTrace.includes('ReferenceError') || errorTrace.includes('is not defined')) {
      proposedDiff += `// Auto-Heal: Add missing import or non-null guard check\nif (typeof target !== 'undefined' && target !== null) { ... }`;
    } else if (errorTrace.includes('TypeError') || errorTrace.includes('cannot read property')) {
      proposedDiff += `// Auto-Heal: Add optional chaining and fallback initialization\nconst value = target?.property ?? fallbackValue;`;
    } else {
      proposedDiff += `// Auto-Heal: Wrap call in try-catch block and log traceback to GUPPI telemetry\ntry { ... } catch (err) { guppi.logTelemetry(err); }`;
    }

    const entry: SelfHealingEntry = {
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file_path: filePath,
      failed_test_name: failedTestName,
      error_trace: errorTrace.substring(0, 1000),
      proposed_diff: proposedDiff,
      backup_snapshot: backupPath,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    // Store in Working Memory and Memory Graph
    this.db.setWorkingMemory(`self_heal_${entry.id}`, JSON.stringify(entry), 'self_healing_engine');

    this.db.addMemory({
      id: `mem_self_heal_${entry.id}`,
      workspace: this.db.getConfig('project_name') || 'workspace',
      category: 'bug_solution',
      title: `Self-Healing Log: ${filePath}`,
      content: `Failed Test: ${failedTestName}\nError: ${errorTrace}\nBackup Created: ${backupPath}\nProposed Fix:\n${proposedDiff}`,
      tags: ['self_heal', filePath.replace(/[/.]/g, '_')],
      source: 'guppi_self_healing_engine',
    });

    return entry;
  }
}
