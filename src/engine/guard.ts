import { GuppiDB, GuardrailRule } from '../db/client.js';

export interface GuardCheckResult {
  passed: boolean;
  violations: {
    ruleId: string;
    ruleName: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    matchedSnippet?: string;
  }[];
}

export class GuardEngine {
  private db: GuppiDB;

  constructor(db: GuppiDB) {
    this.db = db;
  }

  public checkContent(content: string, filePath?: string): GuardCheckResult {
    const rules = this.db.getGuardrails().filter((r) => r.enabled);
    const violations: GuardCheckResult['violations'] = [];
    let hasError = false;

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'gi');
        const match = regex.exec(content);
        if (match) {
          if (rule.severity === 'error') hasError = true;
          violations.push({
            ruleId: rule.id,
            ruleName: rule.rule_name,
            severity: rule.severity,
            message: `${rule.description} (File: ${filePath || 'code snippet'})`,
            matchedSnippet: match[0].substring(0, 100),
          });
        }
      } catch {
        // Ignore invalid regex patterns
      }
    }

    return {
      passed: !hasError,
      violations,
    };
  }
}
