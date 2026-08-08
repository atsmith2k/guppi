import React, { useState } from 'react';
import { Wrench, ShieldCheck, FileCode, CheckCircle, RefreshCw, AlertOctagon } from 'lucide-react';

export const SelfHealTab: React.FC = () => {
  const [filePath, setFilePath] = useState('src/server/mcp.ts');
  const [errorTrace, setErrorTrace] = useState('TypeError: Cannot read property "id" of undefined at line 42');
  const [testName, setTestName] = useState('Unit Test #12');
  const [proposedEntry, setProposedEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleProposeSelfHeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath || !errorTrace) return;
    setLoading(true);
    try {
      const res = await fetch('/api/self-heal/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, errorTrace, failedTestName: testName }),
      });
      const data = await res.json();
      if (data.success) {
        setProposedEntry(data.entry);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(16,185,129,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Wrench size={24} color="var(--accent-amber)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Autonomous Self-Healing Diff Inspector</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '750px', lineHeight: 1.5 }}>
          Analyzes failed test traces and runtime errors, creates an emergency backup snapshot in <code>.guppi/backups</code>, and proposes AST self-healing code diffs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Input Form */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={20} color="var(--accent-amber)" /> Trigger Self-Healing Repair
          </h3>

          <form onSubmit={handleProposeSelfHeal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target File Path</label>
              <input
                type="text"
                required
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Failed Test / Suite Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Error Traceback Log</label>
              <textarea
                rows={5}
                required
                value={errorTrace}
                onChange={(e) => setErrorTrace(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ padding: '12px', background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-emerald))', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <Wrench size={16} /> Create Backup & Propose AST Fix
            </button>
          </form>
        </div>

        {/* Proposed Self-Healing Diff Output */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
            <ShieldCheck size={20} /> Self-Healing Proposal & Backup
          </h3>

          {proposedEntry ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '4px' }}>✅ Emergency Backup Created!</div>
                <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Snapshot: {proposedEntry.backup_snapshot}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Proposed Repair Diff:</label>
                <pre style={{ background: '#040711', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#38bdf8', marginTop: '6px', overflowX: 'auto' }}>
                  {proposedEntry.proposed_diff}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '60px' }}>
              No self-healing proposal active. Submit an error trace on the left to trigger emergency backup and repair analysis!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
