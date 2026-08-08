import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GuppiDB } from '../db/client.js';
import { createAPIRouter } from './api.js';
import { GuppiWebSocketServer } from './ws.js';
import { OnboardingEngine } from '../engine/onboarder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  port?: number;
  workspaceDir?: string;
  autoOnboard?: boolean;
}

export function startGuppiServer(options: ServerOptions = {}) {
  const port = options.port || 3737;
  const workspaceDir = options.workspaceDir || process.cwd();

  const db = new GuppiDB(workspaceDir);
  const app = express();
  const server = http.createServer(app);
  const wsServer = new GuppiWebSocketServer(server);

  app.use(express.json());

  // Mount API Router
  app.use('/api', createAPIRouter(db, wsServer));

  // Serve Dashboard Static UI files if present
  const dashboardDist = path.join(__dirname, '../dashboard');
  if (fs.existsSync(dashboardDist)) {
    app.use(express.static(dashboardDist));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
      res.sendFile(path.join(dashboardDist, 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`\n🚀 GUPPI Agentic Sidecar Server running at http://localhost:${port}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}/ws`);
    console.log(`🗄️  Database: ${db.dbPath}`);

    if (options.autoOnboard) {
      console.log(`🔍 Running initial auto-onboarding scan...`);
      const onboarder = new OnboardingEngine(db, workspaceDir);
      onboarder.runOnboarding().then((report) => {
        console.log(`✅ Auto-onboard complete: ${report.totalFiles} files, ${report.symbolCount} symbols indexed in ${report.durationMs}ms.`);
        wsServer.broadcast('onboard_completed', report);
      });
    }
  });

  return { app, server, db, wsServer };
}
