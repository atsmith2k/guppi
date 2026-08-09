import { Tool, Resource } from '@modelcontextprotocol/sdk/types.js';

export interface PillarModule {
  pillarName: string;
  description: string;
  tools: Tool[];
  resources: Resource[];
  handleToolCall: (name: string, args: any) => Promise<{ content: any[]; isError?: boolean } | null>;
  handleReadResource: (uri: string) => Promise<{ contents: any[] } | null>;
}
