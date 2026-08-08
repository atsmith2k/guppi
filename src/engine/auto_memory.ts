import { GuppiDB } from '../db/client.js';

export class AutoMemoryEngine {
  private db: GuppiDB;

  constructor(db: GuppiDB) {
    this.db = db;
  }

  /**
   * Scans a file edit or snippet for self-evolving memory patterns (FIX:, BUG:, NOTE:, SAFETY:)
   * and automatically records memories + knowledge graph links.
   */
  public analyzeAndExtractMemory(content: string, filePath: string, agentId: string = 'auto_engine') {
    const lines = content.split('\n');
    let autoMemoriesCreated = 0;

    lines.forEach((line) => {
      const fixMatch = line.match(/(?:FIX|BUG|SAFETY|CONVENTION):\s*(.+)/i);
      if (fixMatch) {
        const title = `Auto-Extracted: ${fixMatch[1].trim()}`;
        const memoryContent = `Extracted from file: ${filePath}\nRule/Fix: ${line.trim()}`;

        const mem = this.db.addMemory({
          id: `mem_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          workspace: this.db.getConfig('project_name') || 'workspace',
          category: line.toUpperCase().includes('BUG') || line.toUpperCase().includes('FIX') ? 'bug_solution' : 'convention',
          title,
          content: memoryContent,
          tags: ['auto_extracted', filePath.replace(/[/.]/g, '_')],
          source: `auto_memory_${agentId}`,
        });

        // Link memory to file in Knowledge Graph
        this.db.linkMemory(mem.id, filePath, 'affects');
        autoMemoriesCreated++;
      }
    });

    return autoMemoriesCreated;
  }
}
