import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, ShieldCheck, Play } from 'lucide-react';

export const GuardTab: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [testContent, setTestContent] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/guardrails')
      .then((res) => res.json())
      .then((data) => setRules(data.rules || []));
  }, []);

  const handleTestCheck = async () => {
    if (!testContent) return;
    const res = await fetch('/api/guardrails/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: testContent }),
    });
    const data = await res.json();
    setCheckResult(data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Active Guardrails */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--accent-amber)" /> Active Guardrail Rules
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rules.map((r) => (
              <div key={r.id} style={{ background: '#050811', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.rule_name}</span>
                  <span className={`badge ${r.severity === 'error' ? 'badge-rose' : 'badge-amber'}`}>{r.severity}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>{r.description}</p>
                <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                  Pattern: {r.pattern}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Safety Check Sandbox */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--accent-cyan)" /> Pre-Flight Safety Test Bench
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '12px' }}>
              Paste code or text below to test against GUPPI's active workspace guardrails before applying edits.
            </p>
            <textarea
              rows={8}
              placeholder="Paste code snippet to test (e.g. const apiKey = 'sk-proj-12345678901234567890');"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleTestCheck}
              style={{ width: '100%', padding: '10px', background: 'var(--accent-amber)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <Play size={16} /> Run Pre-Flight Guardrail Check
            </button>

            {checkResult && (
              <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', background: checkResult.passed ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)', border: `1px solid ${checkResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: checkResult.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {checkResult.passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  {checkResult.passed ? 'Guardrail Check Passed! Clean code.' : `Check Failed (${checkResult.violations.length} violations)`}
                </div>
                {checkResult.violations?.map((v: any, i: number) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    • [{v.severity.toUpperCase()}] {v.ruleName}: {v.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
