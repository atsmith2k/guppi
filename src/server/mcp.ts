import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GuppiDB } from '../db/client.js';
import { PillarModule } from './pillars/types.js';
import { createContextPillar } from './pillars/context_pillar.js';
import { createMemoryPillar } from './pillars/memory_pillar.js';
import { createPlanningPillar } from './pillars/planning_pillar.js';
import { createSafetyPillar } from './pillars/safety_pillar.js';
import { createQualityPillar } from './pillars/quality_pillar.js';
import { createLSTTraversalPillar } from './pillars/lst_pillar.js';

export function createMCPServer(db: GuppiDB) {
  // Initialize the 6 Condensed Functional Pillar Modules
  const pillars: PillarModule[] = [
    createContextPillar(db),
    createMemoryPillar(db),
    createPlanningPillar(db),
    createSafetyPillar(db),
    createQualityPillar(db),
    createLSTTraversalPillar(db),
  ];

  const server = new Server(
    {
      name: 'guppi-agentic-sidecar',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // 1. Expose MCP Virtual Context Filesystem Resources (guppi://) across all 5 Pillars
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = pillars.flatMap((p) => p.resources);
    return { resources };
  });

  // 2. Read Resource Handler — delegates to matching Pillar module
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    for (const pillar of pillars) {
      const res = await pillar.handleReadResource(uri);
      if (res) return res;
    }
    throw new Error(`Resource not found: ${uri}`);
  });

  // 3. List available GUPPI MCP tools across all 5 Pillars
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = pillars.flatMap((p) => p.tools);
    return { tools };
  });

  // 4. Handle Tool Calls — delegates to matching Pillar module
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      for (const pillar of pillars) {
        const res = await pillar.handleToolCall(name, args);
        if (res) return res;
      }
      throw new Error(`Unknown tool: ${name}`);
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error executing ${name}: ${err.message}` }],
      };
    }
  });

  return server;
}

export async function runStdioMCPServer(db: GuppiDB) {
  const server = createMCPServer(db);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
