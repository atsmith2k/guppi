import React, { useState, useEffect } from 'react';
import { OverviewTab } from './components/OverviewTab.js';
import { MemoryTab } from './components/MemoryTab.js';
import { CodeGraphTab } from './components/CodeGraphTab.js';
import { TelemetryTab } from './components/TelemetryTab.js';
import { GuardTab } from './components/GuardTab.js';
import { BridgeTab } from './components/BridgeTab.js';
import { GraphViewTab } from './components/GraphViewTab.js';
import { BrainstormTab } from './components/BrainstormTab.js';
import { SelfHealTab } from './components/SelfHealTab.js';
import { MeshTab } from './components/MeshTab.js';
import { TestStudioTab } from './components/TestStudioTab.js';
import { LayoutDashboard, Database, Code, Cpu, ShieldCheck, GitPullRequest, GitGraph, Lightbulb, Wrench, Network, FlaskConical, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'codegraph' | 'telemetry' | 'guard' | 'bridge'>('overview');
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = () => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--bg-card-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
        }}
      >
        <div>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px 24px 12px', borderBottom: '1px solid var(--bg-card-border)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' }}>
              🐟
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                GUPPI
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.05em' }}>
                AGENTIC SIDECAR
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'overview' ? 'rgba(6,182,212,0.12)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: activeTab === 'overview' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LayoutDashboard size={18} /> Overview & Setup
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={activeTab === 'memory' ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'memory' ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: activeTab === 'memory' ? 'var(--accent-purple)' : 'var(--text-muted)',
                fontWeight: activeTab === 'memory' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Database size={18} /> Cortex RAG Memory
            </button>

            <button
              onClick={() => setActiveTab('codegraph')}
              className={activeTab === 'codegraph' ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'codegraph' ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: activeTab === 'codegraph' ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontWeight: activeTab === 'codegraph' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Code size={18} /> ContextForge AST Map
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={activeTab === 'telemetry' ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'telemetry' ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: activeTab === 'telemetry' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontWeight: activeTab === 'telemetry' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Cpu size={18} /> AgentLens Telemetry
            </button>

            <button
              onClick={() => setActiveTab('guard')}
              className={activeTab === 'guard' ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'guard' ? 'rgba(245,158,11,0.12)' : 'transparent',
                color: activeTab === 'guard' ? 'var(--accent-amber)' : 'var(--text-muted)',
                fontWeight: activeTab === 'guard' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <ShieldCheck size={18} /> AgentGuard Safety
            </button>

            <button
              onClick={() => setActiveTab('bridge')}
              className={activeTab === 'bridge' ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'bridge' ? 'rgba(244,63,94,0.12)' : 'transparent',
                color: activeTab === 'bridge' ? 'var(--accent-rose)' : 'var(--text-muted)',
                fontWeight: activeTab === 'bridge' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <GitPullRequest size={18} /> AgentBridge Mesh
            </button>
            <button
              onClick={() => setActiveTab('graph' as any)}
              className={activeTab === ('graph' as any) ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === ('graph' as any) ? 'rgba(6,182,212,0.12)' : 'transparent',
                color: activeTab === ('graph' as any) ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: activeTab === ('graph' as any) ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <GitGraph size={18} /> Visual Knowledge Graph
            </button>
            <button
              onClick={() => setActiveTab('brainstorm' as any)}
              className={activeTab === ('brainstorm' as any) ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === ('brainstorm' as any) ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: activeTab === ('brainstorm' as any) ? 'var(--accent-purple)' : 'var(--text-muted)',
                fontWeight: activeTab === ('brainstorm' as any) ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Lightbulb size={18} /> Brainstorm Studio
            </button>
            <button
              onClick={() => setActiveTab('selfheal' as any)}
              className={activeTab === ('selfheal' as any) ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === ('selfheal' as any) ? 'rgba(245,158,11,0.12)' : 'transparent',
                color: activeTab === ('selfheal' as any) ? 'var(--accent-amber)' : 'var(--text-muted)',
                fontWeight: activeTab === ('selfheal' as any) ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Wrench size={18} /> Self-Healing Studio
            </button>
            <button
              onClick={() => setActiveTab('mesh' as any)}
              className={activeTab === ('mesh' as any) ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === ('mesh' as any) ? 'rgba(6,182,212,0.12)' : 'transparent',
                color: activeTab === ('mesh' as any) ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: activeTab === ('mesh' as any) ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Network size={18} /> Multi-Repo Mesh
            </button>
            <button
              onClick={() => setActiveTab('testgen' as any)}
              className={activeTab === ('testgen' as any) ? 'glass-panel' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === ('testgen' as any) ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: activeTab === ('testgen' as any) ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontWeight: activeTab === ('testgen' as any) ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <FlaskConical size={18} /> Test Studio
            </button>
          </nav>
        </div>

        {/* Footer Status */}
        <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span className="status-dot-active"></span> Server Online
          </div>
          <button onClick={fetchStatus} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {activeTab === 'overview' && <OverviewTab status={status} onRefresh={fetchStatus} />}
        {activeTab === 'memory' && <MemoryTab />}
        {activeTab === 'codegraph' && <CodeGraphTab />}
        {activeTab === 'telemetry' && <TelemetryTab />}
        {activeTab === 'guard' && <GuardTab />}
        {activeTab === 'bridge' && <BridgeTab />}
        {activeTab === ('graph' as any) && <GraphViewTab />}
        {activeTab === ('brainstorm' as any) && <BrainstormTab />}
        {activeTab === ('selfheal' as any) && <SelfHealTab />}
        {activeTab === ('mesh' as any) && <MeshTab />}
        {activeTab === ('testgen' as any) && <TestStudioTab />}
      </main>
    </div>
  );
};
