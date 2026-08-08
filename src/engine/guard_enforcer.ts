import { GuppiDB, ShadowBackupRecord } from '../db/client.js';
import { GuardEngine } from './guard.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface GuardAuditResult {
  allowed: boolean;
  violations: string[];
  backup?: ShadowBackupRecord;
}

export class GuardEnforcerEngine {
  private db: GuppiDB;
  private guard: GuardEngine;
  private backupDir: string;

  constructor(db: GuppiDB, workspaceDir: string = process.cwd()) {
    this.db = db;
    this.guard = new GuardEngine(db);
    this.backupDir = path.join(workspaceDir, '.guppi', 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Pre-flight check before modifying a file:
   * 1. Runs safety & secret rules.
   * 2. Creates a non-destructive shadow backup in .guppi/backups.
   */
  public preparePreFlight(filePath: string, proposedContent?: string): GuardAuditResult {
    const violations: string[] = [];

    // Run guardrail checks if proposed content supplied
    if (proposedContent) {
      const check = this.guard.checkContent(proposedContent, filePath);
      if (!check.passed) {
        for (const v of check.violations) {
          violations.push(`Rule [${v.ruleName}]: ${v.message}`);
        }
      }
    }


    let backupRecord: ShadowBackupRecord | undefined;

    // Create shadow backup if file exists on disk
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
      const backupFilename = `${path.basename(filePath)}_${Date.now()}_${hash}.bak`;
      const backupPath = path.join(this.backupDir, backupFilename);

      fs.writeFileSync(backupPath, content, 'utf-8');

      backupRecord = this.db.createShadowBackupRecord({
        file_path: filePath,
        backup_path: backupPath,
        hash,
      });
    }

    return {
      allowed: violations.length === 0,
      violations,
      backup: backupRecord,
    };
  }

  /**
   * Restores a file from its latest shadow backup snapshot.
   */
  public rollbackFile(filePath: string): { success: boolean; restoredFrom?: string; message: string } {
    const latest = this.db.getLatestShadowBackup(filePath);
    if (!latest || !fs.existsSync(latest.backup_path)) {
      return {
        success: false,
        message: `No active shadow backup found for "${filePath}".`,
      };
    }

    const backupContent = fs.readFileSync(latest.backup_path, 'utf-8');
    fs.writeFileSync(filePath, backupContent, 'utf-8');

    return {
      success: true,
      restoredFrom: latest.backup_path,
      message: `Successfully rolled back "${filePath}" to backup [${latest.id}] created at ${latest.created_at}.`,
    };
  }

  /**
   * Returns list of all shadow backup snapshots.
   */
  public getBackups(limit: number = 20): ShadowBackupRecord[] {
    return this.db.getShadowBackups(limit);
  }
}
