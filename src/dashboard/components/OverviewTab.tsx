import React, { useState } from 'react';
import { Play, Database, FileText, Code, ShieldCheck, Cpu, CheckCircle2, Zap } from 'lucide-react';

interface Props {
  status: any;
  onRefresh: () => void;
}

export const OverviewTab: React.FC<Props> = ({ status, onRefresh }) => {
  const [loadingOnboard, setLoadingOnboard] = useState(false);

  const handleRunOnboard = async () => {
    setLoadingOnboard(true);
    try {
      const res = await fetch('/api/onboard', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } finally {
      setLoadingOnboard(false);
    }
  };

  const stats = status?.stats || { totalFiles: 0, totalMemories: 0, totalTraces: 0, guardrailsCount: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{ padding: '28px', background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.12) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em' }}>GUPPI Control Deck</h1>
            <span className="badge badge-cyan">v1.0.0 Active</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px', lineHeight: 1.5 }}>
            General-purpose Unifying Pluggable Intelligence — Running as a standalone background sidecar, indexing your codebase, storing RAG memories, and serving primary agents.
          </p>
        </div>
        <button
          onClick={handleRunOnboard}
          disabled={loadingOnboard}
          className="glass-panel-hover"
          style={{
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(6,182,212,0.3)',
          }}
        >
          {loadingOnboard ? <Zap className="animate-spin" size={18} /> : <Play size={18} />}
          {loadingOnboard ? 'Traversing Codebase...' : 'Run Workspace Onboarding'}
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>INDEXED FILES</span>
            <FileText size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalFiles}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Codebase AST files indexed</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>RAG MEMORIES</span>
            <Database size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalMemories}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Decisions & rules stored</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TELEMETRY TRACES</span>
            <Cpu size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalTraces}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Agent step logs recorded</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE GUARDRAILS</span>
            <ShieldCheck size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.guardrailsCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pre-flight safety rules</div>
        </div>
      </div>

      {/* Integration Guide Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code size={20} color="var(--accent-cyan)" /> Agentic Integration & MCP Setup
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          GUPPI exposes standard MCP tools for primary agents (Antigravity CLI, Pi, Claude Code, Cursor, Windsurf). Add this configuration snippet to your agent settings:
        </p>

        <div style={{ background: '#050811', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8', overflowX: 'auto' }}>
          <pre>{JSON.stringify({
            mcpServers: {
              guppi: {
                command: "guppi",
                args: ["mcp"],
                env: {
                  GUPPI_WORKSPACE: status?.workspace || process.cwd()
                }
              }
            }
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};
