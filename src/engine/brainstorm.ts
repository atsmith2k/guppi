import { GuppiDB } from '../db/client.js';

export interface BrainstormQuestion {
  id: string;
  phase: 'DISCOVERY' | 'DEEP_DIVE' | 'ARCHITECTURE' | 'CRITIC_PASS' | 'COMPLETE';
  persona: 'Visionary' | 'Architect' | 'Skeptic' | 'UserExperience';
  question: string;
  context: string;
  suggestedAnswers?: string[];
}

export interface BrainstormState {
  sessionId: string;
  topic: string;
  currentPhase: BrainstormQuestion['phase'];
  questionIndex: number;
  history: {
    question: BrainstormQuestion;
    answer: string;
    timestamp: string;
  }[];
  personaInsights: Record<string, string[]>;
  synthesizedBlueprint?: string;
  isComplete: boolean;
}

export class BrainstormEngine {
  private db: GuppiDB;
  private activeSessions: Map<string, BrainstormState> = new Map();

  constructor(db: GuppiDB) {
    this.db = db;
  }

  /**
   * Start a new interactive brainstorming session.
   */
  public startSession(topic: string): BrainstormState {
    const sessionId = `bs_${Date.now()}`;
    const state: BrainstormState = {
      sessionId,
      topic,
      currentPhase: 'DISCOVERY',
      questionIndex: 0,
      history: [],
      personaInsights: {
        Visionary: [],
        Architect: [],
        Skeptic: [],
        UserExperience: [],
      },
      isComplete: false,
    };

    this.activeSessions.set(sessionId, state);
    return state;
  }

  public getSession(sessionId: string): BrainstormState | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get the next Q&A question based on proven brainstorming methodologies (Starbursting, 5-Whys, SCAMPER).
   */
  public getNextQuestion(sessionId: string): BrainstormQuestion | null {
    const state = this.activeSessions.get(sessionId);
    if (!state || state.isComplete) return null;

    const topic = state.topic;
    const count = state.history.length;

    if (count === 0) {
      return {
        id: 'q1',
        phase: 'DISCOVERY',
        persona: 'Visionary',
        question: `What is the core purpose and target user for "${topic}"? What problem does it uniquely solve?`,
        context: 'Defining core value proposition and primary user persona.',
        suggestedAnswers: [
          `Targeted for developers building automated workflows with instant feedback.`,
          `Designed as an intuitive desktop/CLI dashboard for power users.`,
        ],
      };
    }

    if (count === 1) {
      return {
        id: 'q2',
        phase: 'DEEP_DIVE',
        persona: 'UserExperience',
        question: `What are the key interactive features or visual UI components required for "${topic}"?`,
        context: 'Starbursting user experience & UI micro-interactions.',
        suggestedAnswers: [
          `Needs a real-time visual canvas with glassmorphic dark mode and instant state updates.`,
          `Needs a minimal CLI wizard with zero external setup.`,
        ],
      };
    }

    if (count === 2) {
      return {
        id: 'q3',
        phase: 'ARCHITECTURE',
        persona: 'Architect',
        question: `What are the data schemas, contracts, or background processes backing "${topic}"?`,
        context: 'Defining technical backend architecture, database schema, and tool contracts.',
        suggestedAnswers: [
          `Backed by SQLite WAL mode, REST APIs, WebSockets, and MCP tools.`,
          `Pure client-side state stored in local storage with web worker threads.`,
        ],
      };
    }

    if (count === 3) {
      return {
        id: 'q4',
        phase: 'CRITIC_PASS',
        persona: 'Skeptic',
        question: `What are the explicit non-goals, failure modes, or safety guardrails for "${topic}"? What should it NEVER do?`,
        context: 'Critic Pass — identifying traps, edge cases, and human-in-the-loop boundaries.',
        suggestedAnswers: [
          `Should never mutate existing files without user confirmation or fallback backups.`,
          `Should strictly restrict network calls to trusted local daemons.`,
        ],
      };
    }

    // Mark complete and synthesize
    state.currentPhase = 'COMPLETE';
    state.isComplete = true;
    return null;
  }

  /**
   * Submit an answer to the current question.
   */
  public submitAnswer(sessionId: string, answer: string): { state: BrainstormState; nextQuestion: BrainstormQuestion | null } {
    const state = this.activeSessions.get(sessionId);
    if (!state) throw new Error('Session not found');

    const question = this.getNextQuestion(sessionId);
    if (question) {
      state.history.push({
        question,
        answer,
        timestamp: new Date().toISOString(),
      });

      // Record persona insight
      if (!state.personaInsights[question.persona]) {
        state.personaInsights[question.persona] = [];
      }
      state.personaInsights[question.persona].push(answer);
    }

    const nextQ = this.getNextQuestion(sessionId);
    if (!nextQ) {
      state.isComplete = true;
      state.currentPhase = 'COMPLETE';
      state.synthesizedBlueprint = this.synthesizeBlueprint(state);

      // Automatically store Blueprint in GUPPI RAG Memory!
      const mem = this.db.addMemory({
        id: `mem_blueprint_${state.sessionId}`,
        workspace: this.db.getConfig('project_name') || 'workspace',
        category: 'architecture',
        title: `Brainstorm Spec Blueprint: ${state.topic}`,
        content: state.synthesizedBlueprint,
        tags: ['brainstorm_spec', 'blueprint', state.topic.toLowerCase().replace(/\s+/g, '_')],
        source: 'guppi_brainstorm_engine',
      });

      this.db.setWorkingMemory('latest_brainstorm_blueprint', state.synthesizedBlueprint, 'brainstorm_engine');
    }

    return { state, nextQuestion: nextQ };
  }

  /**
   * Synthesize full atomic specification blueprint (Spec Image) to inject into primary agents.
   */
  public synthesizeBlueprint(state: BrainstormState): string {
    let spec = `# 🎨 GUPPI BRAINSTORM SPEC BLUEPRINT: "${state.topic}"\n\n`;
    spec += `**Generated:** ${new Date().toLocaleString()}\n`;
    spec += `**Session ID:** \`${state.sessionId}\`\n\n`;

    spec += `## 🎯 1. PURPOSE & VALUE PROPOSITION\n`;
    const vision = state.personaInsights['Visionary'] || [];
    spec += `${vision.join('\n\n') || 'General project enhancement'}\n\n`;

    spec += `## 🎨 2. USER EXPERIENCE & INTERACTION DESIGN\n`;
    const ux = state.personaInsights['UserExperience'] || [];
    spec += `${ux.join('\n\n') || 'Standard modern web/CLI UI'}\n\n`;

    spec += `## 🏗️ 3. ARCHITECTURE & TECHNICAL CONTRACTS\n`;
    const arch = state.personaInsights['Architect'] || [];
    spec += `${arch.join('\n\n') || 'TypeScript Node.js SQLite integration'}\n\n`;

    spec += `## 🛡️ 4. GUARDRAILS, NON-GOALS & FAILURE MODES\n`;
    const skeptic = state.personaInsights['Skeptic'] || [];
    spec += `${skeptic.join('\n\n') || 'Enforce clean error boundaries and non-destructive file edits'}\n\n`;

    spec += `## 💡 5. PRIMARY AGENT INSTRUCTION PROMPT\n`;
    spec += `> **Instruction for Primary Agent (Antigravity CLI / Claude Code / Cursor):**\n`;
    spec += `> Consume the blueprint above to build "${state.topic}". Ensure all technical contracts and safety guardrails are strictly maintained.\n`;

    return spec;
  }
}
