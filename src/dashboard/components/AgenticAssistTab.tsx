import React, { useState, useEffect } from 'react';
import { Network, Layers, Wrench, Shield, CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export const AgenticAssistTab: React.FC = () => {
  const [impactInput, setImpactInput] = useState('client.ts');
  const [impactReport, setImpactReport] = useState<any>(null);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    fetch('/api/checkpoints')
      .then((r) => r.json())
      .then((d) => setCheckpoints(d.checkpoints || []))
      .catch(() => {});

    fetch('/api/vfs/backups')
      .then((r) => r.json())
      .then((d) => setBackups(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/vfs/feedback')
      .then((r) => r.json())
      .then((d) => setFeedback(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runImpactAnalysis = () => {
    if (!impactInput) return;
    setLoading(true);
    fetch('/api/dependencies/impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbolOrPath: impactInput }),
    })
      .then((r) => r.json())
      .then((d) => {
        setImpactReport(d.report);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>
              ⚡ Stronger Agentic Assistance Deck
            </h2>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Subagent Handoff Checkpoints, Impact Analysis, Auto-Fix Feedback, and Shadow Backups.
            </p>
          </div>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid var(--accent-cyan)',
              background: 'rgba(6,182,212,0.1)',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Impact Analysis Explorer */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
            <Network size={18} /> Symbol Impact Analysis
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Check callers, dependent files, and downstream risk level before making code changes.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <input
              type="text"
              value={impactInput}
              onChange={(e) => setImpactInput(e.target.value)}
              placeholder="e.g. GuppiDB, client.ts, onboarder"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--bg-card-border)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
              }}
            />
            <button
              onClick={runImpactAnalysis}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'var(--accent-purple)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Analyze Impact
            </button>
          </div>

          {impactReport && (
            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--bg-card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>Target: {impactReport.target}</span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: impactReport.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.2)' : impactReport.riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                    color: impactReport.riskLevel === 'HIGH' ? '#ef4444' : impactReport.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981',
                  }}
                >
                  {impactReport.riskLevel} RISK
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>{impactReport.recommendation}</p>

              {impactReport.affectedFiles?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Affected Files:</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {impactReport.affectedFiles.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subagent Handoff Checkpoints */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
            <Layers size={18} /> Subagent Handoff Checkpoints
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Serialized state checkpoints passed between parent agents and specialized subagents.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', maxHeight: '240px', overflowY: 'auto' }}>
            {checkpoints.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No subagent checkpoints stored yet.</div>
            ) : (
              checkpoints.map((c) => (
                <div key={c.id} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>Role: {c.subagent_role}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.created_at?.substring(11, 19)}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{c.task_summary}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Execution Feedback & Auto-Fix */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
            <Wrench size={18} /> Execution Feedback & Auto-Fix
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', maxHeight: '240px', overflowY: 'auto' }}>
            {feedback.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No feedback records logged.</div>
            ) : (
              feedback.map((f) => (
                <div key={f.id} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#f59e0b' }}>Cmd: {f.command_type} (Exit: {f.exit_code})</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.created_at?.substring(11, 19)}</span>
                  </div>
                  {f.proposed_fix && (
                    <pre style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '4px', marginTop: '6px', overflowX: 'auto' }}>
                      {f.proposed_fix}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shadow File Backups */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <Shield size={18} /> Active Shadow File Backups
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', maxHeight: '240px', overflowY: 'auto' }}>
            {backups.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No shadow backups active.</div>
            ) : (
              backups.map((b) => (
                <div key={b.id} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#10b981' }}>{b.file_path}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.created_at?.substring(11, 19)}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Backup: <code style={{ color: 'var(--accent-purple)' }}>{b.backup_path}</code>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
