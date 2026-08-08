import { GuppiDB, ExecutionFeedbackRecord } from '../db/client.js';
import { RAGEngine } from './rag.js';
import fs from 'fs';
import path from 'path';

export interface ProposedFix {
  filePath?: string;
  matchedMemoryTitle?: string;
  matchedMemoryContent?: string;
  diagnosis: string;
  suggestedPatch: string;
  confidence: number;
}

export class ExecutionFeedbackEngine {
  private db: GuppiDB;
  private rag: RAGEngine;

  constructor(db: GuppiDB) {
    this.db = db;
    this.rag = new RAGEngine(db);
  }

  /**
   * Process terminal error output, TS build logs, or test failures to diagnose and suggest a fix.
   */
  public analyzeAndProposeFix(
    commandType: string,
    stdout: string = '',
    stderr: string = '',
    exitCode: number = 1,
    targetFilePath?: string
  ): { record: ExecutionFeedbackRecord; fix: ProposedFix } {
    const errorText = `${stdout}\n${stderr}`.trim();
    if (!errorText) {
      throw new Error('No error output provided for feedback analysis.');
    }

    // 1. Query RAG memory for matching bug solutions or architectural rules
    const ragResults = this.rag.queryContext(errorText, 3);

    // 2. Extract error location (e.g. src/db/client.ts:42:10 or Error in file.ts)
    let detectedFile = targetFilePath;
    const fileLineMatch = /([a-zA-Z0-9_\-./]+\.(?:ts|js|jsx|tsx|py)):(\d+):(\d+)/.exec(errorText);
    if (fileLineMatch) {
      detectedFile = fileLineMatch[1];
    }

    // 3. Synthesize diagnosis and surgical patch recommendation
    let diagnosis = `Execution failed with exit code ${exitCode}.`;
    let suggestedPatch = '';
    let confidence = 0.7;

    if (errorText.includes('Cannot find module') || errorText.includes('ERR_MODULE_NOT_FOUND')) {
      diagnosis = 'Module import resolution error. Missing file, relative path mismatch, or missing file extension.';
      suggestedPatch = `// Check import statement in ${detectedFile || 'source file'}\n// Ensure file exists and relative path ends with .js for ESM module imports.`;
      confidence = 0.9;
    } else if (errorText.includes('is not assignable to type') || errorText.includes('TS2322')) {
      diagnosis = 'TypeScript type mismatch error.';
      suggestedPatch = `// Update type signature or cast object appropriately in ${detectedFile || 'source file'}.`;
      confidence = 0.85;
    } else if (errorText.includes('ReferenceError') || errorText.includes('is not defined')) {
      diagnosis = 'Unbound identifier or missing variable initialization.';
      suggestedPatch = `// Ensure target identifier is properly imported or declared before invocation.`;
      confidence = 0.8;
    } else {
      diagnosis = `Runtime exception detected. RAG memories checked: ${ragResults.relevantMemories.length} item(s).`;
      if (ragResults.relevantMemories.length > 0) {
        suggestedPatch = `// Based on past solution "${ragResults.relevantMemories[0].title}":\n// ${ragResults.relevantMemories[0].content.split('\n')[0]}`;
        confidence = 0.75;
      } else {
        suggestedPatch = `// Review stack trace log details and verify object initialization and API parameters.`;
      }
    }

    const matchedMemory = ragResults.relevantMemories.length > 0 ? ragResults.relevantMemories[0] : null;


    const fix: ProposedFix = {
      filePath: detectedFile,
      matchedMemoryTitle: matchedMemory?.title,
      matchedMemoryContent: matchedMemory?.content,
      diagnosis,
      suggestedPatch,
      confidence,
    };

    const record = this.db.logExecutionFeedback({
      command_type: commandType,
      stdout,
      stderr,
      exit_code: exitCode,
      matched_memory_id: matchedMemory?.id,
      proposed_fix: JSON.stringify(fix),
    });

    return { record, fix };
  }

  /**
   * Returns recent execution feedback records.
   */
  public getHistory(limit: number = 20): ExecutionFeedbackRecord[] {
    return this.db.getRecentExecutionFeedback(limit);
  }
}
