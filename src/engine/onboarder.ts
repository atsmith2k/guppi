import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import ignoreFn from 'ignore';
import { GuppiDB, CodeFileIndex, ASTSymbol } from '../db/client.js';
import { ASTExtractor } from './ast.js';

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

  public async runOnboarding(): Promise<OnboardingReport> {
    const startTime = Date.now();
    const projectName = path.basename(this.workspacePath);

    // 1. Setup Ignore Rules (.gitignore + defaults)
    const ig = ignore();
    ig.add(['.git', 'node_modules', 'dist', 'build', '.guppi', '.next', 'coverage', '*.sqlite', '*.db']);

    const gitignorePath = path.join(this.workspacePath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      ig.add(gitignoreContent);
    }

    // 2. Discover files
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

    // 3. Detect Framework & Core Config
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

    // 4. Traverse & Index Files
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
          const symbols = ASTExtractor.extractSymbolsFromFile(fullPath, file);
          allSymbols.push(...symbols);

          // Extract imports/exports
          const ie = ASTExtractor.extractImportsExports(fullPath);

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

    // 5. Save to Database
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

    // 6. Generate Core RAG Memories
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

    // 7. Update workspace config
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
