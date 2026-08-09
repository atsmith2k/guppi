import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import ignoreFn from 'ignore';
import { GuppiDB, CodeFileIndex, ASTSymbol } from '../db/client.js';
import { ASTExtractor } from './ast.js';
import { DependencyAnalyzer } from './dependency_analyzer.js';

const ignore: any = (ignoreFn as any).default || ignoreFn;

export interface OnboardingReport {
  workspacePath: string;
  projectName: string;
  framework: string;
  totalFiles: number;
  totalLines: number;
  symbolCount: number;
  ruleFilesFound: string[];
  memoriesCreated: number;
  durationMs: number;
}

export class OnboardingEngine {
  private db: GuppiDB;
  private workspacePath: string;

  constructor(db: GuppiDB, workspacePath: string = process.cwd()) {
    this.db = db;
    this.workspacePath = workspacePath;
  }

  /**
   * Generates or updates workspace agent rule files (.guppi/AGENTS.md and .guppi/rules/guppi_agent_rules.md)
   * with explicit GUPPI tool selection protocols to guarantee 100% agentic awareness.
   */
  public generateAutoRules(): string {
    const rulesLines = [
      '# 🤖 MANDATORY GUPPI TOOL EXECUTION PROTOCOLS FOR AI AGENTS',
      '',
      'Primary AI agents (Antigravity CLI, Claude Code, Cursor, Windsurf) operating in this workspace MUST adhere to the following execution rules for maximum token efficiency, safety, and performance:',
      '',
      '1. ⚡ **Token Saver Protocol (`guppi_skeletonize` / `guppi_inspect_symbol`)**:',
      '   - For source files > 100 lines, ALWAYS call `guppi_skeletonize` first instead of reading the full file to save 70-80% tokens.',
      '   - Use `guppi_inspect_symbol` to query function/class/interface AST signatures and line numbers before viewing exact slices.',
      '',
      '2. 🛡️ **Pre-Flight Safety Audit Protocol (`guppi_guard_enforce`)**:',
      '   - NEVER make complex edits to core workspace files without calling `guppi_guard_enforce` first.',
      '   - This creates a non-destructive shadow backup snapshot in `.guppi/backups/`.',
      '',
      '3. ⏪ **Emergency Recovery Protocol (`guppi_rollback_file`)**:',
      '   - If a code edit introduces build failures, type errors, or broken tests, call `guppi_rollback_file` to instantly restore the latest working snapshot.',
      '',
      '4. 🛠️ **Automated Error Repair Protocol (`guppi_auto_fix_suggest` / `guppi_self_heal`)**:',
      '   - When terminal commands or tests fail, pass stderr output to `guppi_auto_fix_suggest` or `guppi_self_heal` to receive surgical repair diffs matched against past RAG bug solutions.',
      '',
      '5. 🧠 **Knowledge Persistence Protocol (`guppi_remember`)**:',
      '   - Whenever you resolve a complex bug, establish an architectural rule, or define a project convention, call `guppi_remember` to persist it into GUPPI long-term RAG memory for future sessions.',
      '',
      '6. 📋 **Multi-Agent DAG Plan Protocol (`guppi_task_plan_create`)**:',
      '   - For requests requiring 3+ steps or multi-file refactoring, call `guppi_task_plan_create` to decompose the goal into a tracked DAG task plan before editing.',
      '',
      '7. 🌐 **Tool Selection Recipes Resource**:',
      '   - Read `guppi://recipes/tool_selection` to view recommended tool execution chains for common developer workflows.',
      '',
    ];

    const rulesContent = rulesLines.join('\n');

    const guppiDir = path.join(this.workspacePath, '.guppi');
    if (!fs.existsSync(guppiDir)) fs.mkdirSync(guppiDir, { recursive: true });

    const rulesDir = path.join(guppiDir, 'rules');
    if (!fs.existsSync(rulesDir)) fs.mkdirSync(rulesDir, { recursive: true });

    fs.writeFileSync(path.join(guppiDir, 'AGENTS.md'), rulesContent, 'utf-8');
    fs.writeFileSync(path.join(rulesDir, 'guppi_agent_rules.md'), rulesContent, 'utf-8');

    return rulesContent;
  }

  public async runOnboarding(): Promise<OnboardingReport> {
    const startTime = Date.now();
    const projectName = path.basename(this.workspacePath);

    // 1. Generate Auto Agent Rules for Agentic Awareness
    this.generateAutoRules();

    // 2. Setup Ignore Rules (.gitignore + defaults)
    const ig = ignore();
    ig.add(['.git', 'node_modules', 'dist', 'build', '.guppi', '.next', 'coverage', '*.sqlite', '*.db']);

    const gitignorePath = path.join(this.workspacePath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      ig.add(gitignoreContent);
    }

    // 3. Discover files
    const allFiles = await glob('**/*', {
      cwd: this.workspacePath,
      nodir: true,
      dot: true,
    });

    const validFiles = allFiles.filter((file) => !ig.ignores(file));

    let totalLines = 0;
    const fileIndexes: CodeFileIndex[] = [];
    const allSymbols: ASTSymbol[] = [];
    const ruleFilesFound: string[] = [];

    // 4. Detect Framework & Core Config
    let framework = 'Generic Workspace';
    const packageJsonPath = path.join(this.workspacePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        if (deps.next) framework = 'Next.js';
        else if (deps.vite) framework = 'Vite / React';
        else if (deps.express) framework = 'Express Node.js';
        else if (deps.react) framework = 'React';
        else framework = 'Node.js Workspace';
      } catch {}
    } else if (fs.existsSync(path.join(this.workspacePath, 'requirements.txt')) || fs.existsSync(path.join(this.workspacePath, 'pyproject.toml'))) {
      framework = 'Python Workspace';
    } else if (fs.existsSync(path.join(this.workspacePath, 'go.mod'))) {
      framework = 'Go Workspace';
    }

    const depAnalyzer = new DependencyAnalyzer(this.db);

    // 5. Traverse & Index Files
    for (const file of validFiles) {
      const fullPath = path.join(this.workspacePath, file);
      const ext = path.extname(file).toLowerCase();
      const stats = fs.statSync(fullPath);

      let lineCount = 0;
      let summary = `${file} (${stats.size} bytes)`;

      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.py', '.md', '.html', '.css', '.go', '.rs'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          lineCount = lines.length;
          totalLines += lineCount;

          // Extract symbols
          const symbols = ASTExtractor.extractSymbolsFromFile(fullPath, file, content);
          allSymbols.push(...symbols);

          // Build dependency graph edges
          depAnalyzer.analyzeAndIndexFile(fullPath, content);

          // Extract imports/exports
          const ie = ASTExtractor.extractImportsExports(fullPath, content);

          // First 3 lines summary
          const snippet = lines.slice(0, 5).join(' ').replace(/\s+/g, ' ').substring(0, 150);
          summary = snippet || summary;

          fileIndexes.push({
            path: file,
            file_type: ext || 'text',
            size: stats.size,
            line_count: lineCount,
            summary,
            exports: ie.exports,
            imports: ie.imports,
            hash: `${stats.mtimeMs}`,
            indexed_at: new Date().toISOString(),
          });
        } catch {
          // Binary or read error fallback
        }
      }

      // Check for rule / doc files
      const baseName = path.basename(file).toUpperCase();
      if (['README.MD', 'CLAUDE.MD', 'AGENTS.MD', '.CURSORRULES', 'CONTRIBUTING.MD'].includes(baseName)) {
        ruleFilesFound.push(file);
      }
    }

    // 6. Save to Database
    this.db.saveCodeIndex(fileIndexes);
    this.db.saveASTSymbols(allSymbols);

    // Index Git Commit History if repo has git
    try {
      const { execSync } = await import('child_process');
      const gitLogRaw = execSync('git log -n 30 --pretty=format:"COMMIT_SPLIT%h|%an|%ad|%s" --stat', {
        cwd: this.workspacePath,
        encoding: 'utf-8',
      });

      const commitChunks = gitLogRaw.split('COMMIT_SPLIT').filter(Boolean);
      const parsedCommits = commitChunks.map((chunk) => {
        const lines = chunk.trim().split('\n');
        const header = lines[0] || '';
        const [hash, author, date, message] = header.split('|');
        const filesChanged = lines.slice(1).join('\n').substring(0, 500);
        return {
          hash: hash || 'head',
          author: author || 'git',
          date: date || new Date().toISOString(),
          message: message || 'Commit',
          files_changed: filesChanged,
        };
      });

      this.db.saveGitCommits(parsedCommits);
    } catch {
      // Non-git directory fallback
    }

    // 7. Generate Core RAG Memories
    let memoriesCreated = 0;

    // Overview Memory
    this.db.addMemory({
      id: `mem_onboard_overview_${Date.now()}`,
      workspace: projectName,
      category: 'architecture',
      title: `Workspace Architecture Summary: ${projectName}`,
      content: `Project Name: ${projectName}\nFramework: ${framework}\nTotal Files Indexed: ${validFiles.length}\nTotal Lines of Code: ${totalLines}\nTotal Symbols Identified: ${allSymbols.length}\nKey Tooling: TypeScript/Node.js SQLite GUPPI Backend.`,
      tags: ['onboarding', 'architecture', 'overview', framework.toLowerCase().replace(/\s+/g, '_')],
      source: 'onboarding_engine',
    });
    memoriesCreated++;

    // Rule Files Memories
    for (const ruleFile of ruleFilesFound) {
      try {
        const ruleContent = fs.readFileSync(path.join(this.workspacePath, ruleFile), 'utf-8');
        this.db.addMemory({
          id: `mem_rule_${path.basename(ruleFile)}_${Date.now()}`,
          workspace: projectName,
          category: 'rule',
          title: `Workspace Rule Guide: ${ruleFile}`,
          content: ruleContent.substring(0, 4000),
          tags: ['rules', 'guidelines', ruleFile.toLowerCase()],
          source: 'onboarding_rules',
        });
        memoriesCreated++;
      } catch {}
    }

    // Dependency & Package Memory
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkgContent = fs.readFileSync(packageJsonPath, 'utf-8');
        this.db.addMemory({
          id: `mem_package_json_${Date.now()}`,
          workspace: projectName,
          category: 'convention',
          title: 'Package.json Configuration & Dependencies',
          content: pkgContent.substring(0, 3000),
          tags: ['dependencies', 'package.json', 'scripts'],
          source: 'package_json',
        });
        memoriesCreated++;
      } catch {}
    }

    const durationMs = Date.now() - startTime;

    // 8. Update workspace config
    this.db.setConfig('project_name', projectName);
    this.db.setConfig('framework', framework);
    this.db.setConfig('onboarded', 'true');
    this.db.setConfig('last_onboarded_at', new Date().toISOString());
    this.db.setConfig('total_files', validFiles.length.toString());
    this.db.setConfig('total_lines', totalLines.toString());
    this.db.setConfig('total_symbols', allSymbols.length.toString());

    return {
      workspacePath: this.workspacePath,
      projectName,
      framework,
      totalFiles: validFiles.length,
      totalLines,
      symbolCount: allSymbols.length,
      ruleFilesFound,
      memoriesCreated,
      durationMs,
    };
  }
}
