import fs from 'fs';
import path from 'path';
import { GuppiDB } from '../db/client.js';
import { OnboardingEngine } from './onboarder.js';

export interface LinkedRepo {
  id: string;
  repo_name: string;
  repo_path: string;
  framework: string;
  symbol_count: number;
  file_count: number;
  linked_at: string;
}

export class MultiRepoMeshEngine {
  private db: GuppiDB;

  constructor(db: GuppiDB) {
    this.db = db;
  }

  /**
   * Link an external repository directory to GUPPI's Multi-Repo Knowledge Mesh.
   */
  public async linkRepository(targetRepoPath: string): Promise<LinkedRepo> {
    if (!fs.existsSync(targetRepoPath)) {
      throw new Error(`Repository path does not exist: ${targetRepoPath}`);
    }

    const repoName = path.basename(targetRepoPath);
    const repoDb = new GuppiDB(targetRepoPath);
    const onboarder = new OnboardingEngine(repoDb, targetRepoPath);
    const report = await onboarder.runOnboarding();

    const repo: LinkedRepo = {
      id: `repo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      repo_name: report.projectName,
      repo_path: targetRepoPath,
      framework: report.framework,
      symbol_count: report.symbolCount,
      file_count: report.totalFiles,
      linked_at: new Date().toISOString(),
    };

    // Store link in working memory and memory graph
    this.db.setWorkingMemory(`linked_repo_${repo.id}`, JSON.stringify(repo), 'mesh_engine');
    this.db.addMemory({
      id: `mem_repo_mesh_${repo.id}`,
      workspace: this.db.getConfig('project_name') || 'workspace',
      category: 'architecture',
      title: `Linked Multi-Repo Node: ${repo.repo_name}`,
      content: `Linked Repository Path: ${repo.repo_path}\nFramework: ${repo.framework}\nIndexed Files: ${repo.file_count}\nAST Symbols: ${repo.symbol_count}`,
      tags: ['multi_repo_mesh', repo.repo_name.toLowerCase()],
      source: 'guppi_mesh_engine',
    });

    return repo;
  }

  /**
   * Search across all linked repository meshes.
   */
  public searchMesh(query: string): { repoName: string; repoPath: string; matches: any[] }[] {
    const results: { repoName: string; repoPath: string; matches: any[] }[] = [];
    const workingItems = this.db.getAllWorkingMemory().filter((item) => item.key.startsWith('linked_repo_'));

    for (const item of workingItems) {
      try {
        const repo: LinkedRepo = JSON.parse(item.value);
        if (fs.existsSync(repo.repo_path)) {
          const repoDb = new GuppiDB(repo.repo_path);
          const symbols = repoDb.querySymbols(query, 10);
          results.push({
            repoName: repo.repo_name,
            repoPath: repo.repo_path,
            matches: symbols,
          });
        }
      } catch {}
    }

    return results;
  }
}
