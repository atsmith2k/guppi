import { PillarModule } from './types.js';
import { GuppiDB } from '../../db/client.js';
import { RAGEngine } from '../../engine/rag.js';
import { EpisodicMemoryEngine } from '../../engine/episodic_memory.js';

export function createMemoryPillar(db: GuppiDB): PillarModule {
  const ragEngine = new RAGEngine(db);
  const episodicMemory = new EpisodicMemoryEngine(db);

  return {
    pillarName: 'Memory & Knowledge Graph',
    description: 'Persistent RAG decisions, decay-ranked episodic memory, Fact Graph extraction, and ephemeral scratchpad.',
    resources: [
      {
        uri: 'guppi://memories/all',
        name: 'All Workspace RAG Memories',
        description: 'Virtual context file containing all stored workspace architectural decisions and rules.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://memories/decisions',
        name: 'Architectural Decisions',
        description: 'Key decisions recorded for this workspace.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://facts/graph',
        name: 'Extracted Entity-Relation Fact Graph',
        description: 'Subject-relation-object fact triples extracted from codebase and commit history.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://working/scratchpad',
        name: 'Working Memory Tier Scratchpad',
        description: 'Ephemeral working memory key-value scratchpad for active agent sessions.',
        mimeType: 'application/json',
      },
    ],
    tools: [
      {
        name: 'guppi_remember',
        description:
          '🧠 STORE ARCHITECTURAL RULE / DECISION: Persist a key architectural decision, rule, coding convention, or bug solution into GUPPI long-term memory graph for future agent sessions.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Concise title of decision or rule' },
            content: { type: 'string', description: 'Detailed explanation, rationale, or code example' },
            category: {
              type: 'string',
              enum: ['decision', 'rule', 'architecture', 'bug_solution', 'convention', 'context'],
              description: 'Memory category',
            },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorical retrieval' },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'guppi_episodic_remember',
        description:
          '🧠 EPISODIC MEMORY & FACT TRIPLE EXTRACTOR: Store an agent interaction with Ebbinghaus decay scoring and automatically extract subject-relation-object Fact Triples.',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Memory topic or title' },
            content: { type: 'string', description: 'Detailed memory content' },
            memoryType: { type: 'string', enum: ['episodic', 'semantic', 'preference'] },
            importanceScore: { type: 'number', description: 'Importance rating between 0.1 and 1.0' },
          },
          required: ['topic', 'content'],
        },
      },
      {
        name: 'guppi_query_facts',
        description:
          '🕸️ QUERY FACT GRAPH: Search subject-relation-object fact triples extracted across codebase, commit history, and past sessions.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Keyword or subject search query' },
          },
        },
      },
      {
        name: 'guppi_working_memory',
        description:
          '📝 WORKING MEMORY SCRATCHPAD: Read or write key-value state items in GUPPI ephemeral scratchpad tier during active task execution.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['get', 'set', 'get_all'], description: 'Working memory action' },
            key: { type: 'string', description: 'Scratchpad key' },
            value: { type: 'string', description: 'Value to store (required if action is set)' },
            agentId: { type: 'string', description: 'Agent identifier' },
          },
          required: ['action'],
        },
      },
      {
        name: 'guppi_link_knowledge',
        description:
          '🔗 LINK KNOWLEDGE GRAPH EDGE: Connect a GUPPI memory item to an AST symbol or file path with a relation type (e.g. affects, resolves, defines).',
        inputSchema: {
          type: 'object',
          properties: {
            memoryId: { type: 'string', description: 'GUPPI memory ID' },
            targetId: { type: 'string', description: 'Target file path or AST symbol ID' },
            relationType: { type: 'string', description: 'Relation type (e.g. affects, defines, resolves)' },
          },
          required: ['memoryId', 'targetId'],
        },
      },
    ],
    async handleReadResource(uri: string) {
      if (uri === 'guppi://memories/all') {
        const memories = db.getRecentMemories(100);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(memories, null, 2) }] };
      }
      if (uri === 'guppi://memories/decisions') {
        const memories = db.getRecentMemories(100).filter((m) => m.category === 'decision');
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(memories, null, 2) }] };
      }
      if (uri === 'guppi://facts/graph') {
        const facts = episodicMemory.queryFacts('', 100);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(facts, null, 2) }] };
      }
      if (uri === 'guppi://working/scratchpad') {
        const scratchpad = db.getAllWorkingMemory();
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(scratchpad, null, 2) }] };
      }
      return null;
    },
    async handleToolCall(name: string, args: any) {
      if (name === 'guppi_remember') {
        const title = (args?.title as string) || '';
        const content = (args?.content as string) || '';
        const category = (args?.category as any) || 'decision';
        const tags = (args?.tags as string[]) || ['agent_recorded'];
        const mem = ragEngine.storeMemory(title, content, category, tags);
        return {
          content: [
            {
              type: 'text',
              text: `🧠 Saved to GUPPI Memory [ID: ${mem.id}]!\nTitle: ${mem.title}\nCategory: ${mem.category}\nTags: ${mem.tags.join(', ')}\n\n💡 Next Suggested Agent Action: Link this memory to target symbols using guppi_link_knowledge.`,
            },
          ],
        };
      }

      if (name === 'guppi_episodic_remember') {
        const topic = (args?.topic as string) || '';
        const content = (args?.content as string) || '';
        const memoryType = (args?.memoryType as any) || 'episodic';
        const importanceScore = (args?.importanceScore as number) || 0.8;
        const mem = episodicMemory.remember(topic, content, memoryType, importanceScore);
        const extracted = episodicMemory.extractFactTriples(content, topic);
        return {
          content: [
            {
              type: 'text',
              text: `🧠 Episodic Memory Stored! [ID: ${mem.id}]\nTopic: "${mem.topic}"\nDecay Score: ${mem.decay_score}\nFact Triples Extracted (${extracted.length}):\n${extracted.map((f) => `- ${f.subject} --[${f.relation}]--> ${f.object}`).join('\n') || 'None'}`,
            },
          ],
        };
      }

      if (name === 'guppi_query_facts') {
        const query = (args?.query as string) || '';
        const facts = episodicMemory.queryFacts(query, 20);
        if (facts.length === 0) {
          return { content: [{ type: 'text', text: `No Fact Triples found matching "${query}".` }] };
        }
        let output = `### Extracted Fact Triples matching "${query}":\n`;
        facts.forEach((f) => {
          output += `- \`${f.subject}\` --[**${f.relation}**]--> \`${f.object}\` (Confidence: ${(f.confidence * 100).toFixed(0)}%, Source: ${f.source})\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_working_memory') {
        const action = args?.action as string;
        const key = args?.key as string;
        const value = args?.value as string;
        const agentId = (args?.agentId as string) || 'agent';

        if (action === 'set') {
          if (!key || !value) throw new Error('Key and value required for set');
          db.setWorkingMemory(key, value, agentId);
          return { content: [{ type: 'text', text: `📝 Stored Working Memory: "${key}"` }] };
        } else if (action === 'get') {
          if (!key) throw new Error('Key required for get');
          const val = db.getWorkingMemory(key);
          return { content: [{ type: 'text', text: val ? `📝 Working Memory [${key}]: ${val}` : `Key "${key}" not found in working memory.` }] };
        } else {
          const all = db.getAllWorkingMemory();
          return { content: [{ type: 'text', text: JSON.stringify(all, null, 2) }] };
        }
      }

      if (name === 'guppi_link_knowledge') {
        const memoryId = args?.memoryId as string;
        const targetId = args?.targetId as string;
        const relationType = (args?.relationType as string) || 'affects';
        db.linkMemory(memoryId, targetId, relationType);
        return { content: [{ type: 'text', text: `🔗 Knowledge Edge Linked: Memory [${memoryId}] --(${relationType})--> [${targetId}]` }] };
      }

      return null;
    },
  };
}
