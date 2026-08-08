import { GuppiDB, MemoryItem, CodeFileIndex, ASTSymbol } from '../db/client.js';

export interface RAGQueryResult {
  query: string;
  relevantMemories: MemoryItem[];
  codeFiles: CodeFileIndex[];
  symbols: ASTSymbol[];
  synthesizedContext: string;
}

export class RAGEngine {
  private db: GuppiDB;

  constructor(db: GuppiDB) {
    this.db = db;
  }

  /**
   * Synthesizes relevant workspace memory, codebase topology, and symbol maps into a structured context blob
   * ready for primary agents (Antigravity, Claude Code, etc.) to inject into their context window.
   */
  public queryContext(query: string, maxItems: number = 5): RAGQueryResult {
    const relevantMemories = this.db.searchMemories(query, maxItems);
    const symbols = this.db.querySymbols(query, maxItems);

    // Also match codebase index files
    const allCodeIndex = this.db.getCodeIndex();
    const qLower = query.toLowerCase();
    const codeFiles = allCodeIndex.filter(
      (f) =>
        f.path.toLowerCase().includes(qLower) ||
        f.summary.toLowerCase().includes(qLower) ||
        f.exports.some((e) => e.toLowerCase().includes(qLower)) ||
        f.imports.some((i) => i.toLowerCase().includes(qLower))
    ).slice(0, maxItems);

    // Format synthesized context blob for LLM consuming agent
    let synthesizedContext = `### GUPPI Workspace Intelligence for: "${query}"\n\n`;

    if (relevantMemories.length > 0) {
      synthesizedContext += `#### 🧠 Relevant Workspace Memories & Rules:\n`;
      relevantMemories.forEach((mem, idx) => {
        synthesizedContext += `**${idx + 1}. ${mem.title}** [Category: ${mem.category}]\n${mem.content.trim()}\n\n`;
      });
    }

    if (symbols.length > 0) {
      synthesizedContext += `#### 🔍 Matching Code Symbols & AST Nodes:\n`;
      symbols.forEach((sym) => {
        synthesizedContext += `- \`${sym.signature}\` in [${sym.file_path}](file://${sym.file_path}#L${sym.line_start}-L${sym.line_end}) (${sym.kind})\n`;
      });
      synthesizedContext += `\n`;
    }

    if (codeFiles.length > 0) {
      synthesizedContext += `#### 📁 Relevant Codebase Files:\n`;
      codeFiles.forEach((file) => {
        synthesizedContext += `- \`${file.path}\` (${file.line_count} lines) - Exports: [${file.exports.join(', ')}]\n  Summary: ${file.summary}\n`;
      });
    }

    if (relevantMemories.length === 0 && symbols.length === 0 && codeFiles.length === 0) {
      synthesizedContext += `*No direct matching memories found for query. Recommended action: run 'guppi onboard' to index workspace.*`;
    }

    return {
      query,
      relevantMemories,
      codeFiles,
      symbols,
      synthesizedContext,
    };
  }

  public storeMemory(
    title: string,
    content: string,
    category: MemoryItem['category'] = 'decision',
    tags: string[] = ['agent_recorded'],
    source: string = 'primary_agent'
  ): MemoryItem {
    return this.db.addMemory({
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspace: this.db.getConfig('project_name') || 'workspace',
      category,
      title,
      content,
      tags,
      source,
    });
  }
}
