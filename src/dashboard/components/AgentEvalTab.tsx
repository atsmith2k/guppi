import React, { useState, useEffect } from 'react';
import { BarChart3, Target, ShieldCheck, Zap, DollarSign, RefreshCw } from 'lucide-react';

export const AgentEvalTab: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/eval/report');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const triggerTestEval = async () => {
    await fetch('/api/eval/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'antigravity_agent',
        queryPrompt: 'How does GUPPI SQLite WAL mode enable concurrent RAG query reads?',
        responseText: 'GUPPI SQLite WAL mode enables concurrent RAG query reads by writing transactions to a write-ahead log without blocking readers.',
        latencyMs: 142,
        tokenCost: 420,
        contextItems: ['SQLite WAL mode enables sub-millisecond concurrent reads/writes.'],
      }),
    });
    fetchReport();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <BarChart3 size={24} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Agent RAG Precision & Latency Benchmark Studio</h2>
              <span className="badge badge-emerald">Poached from DeepEval & AgentOps</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Evaluates agent context retrieval precision score, answer faithfulness score, execution latency, and token cost metrics.
            </p>
          </div>
          <button
            onClick={triggerTestEval}
            style={{
              background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={16} /> Run Sample Eval Benchmark
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>RAG PRECISION</span>
            <Target size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {report ? `${(report.avgPrecision * 100).toFixed(0)}%` : '0%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Query concept match density</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ANSWER FAITHFULNESS</span>
            <ShieldCheck size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {report ? `${(report.avgFaithfulness * 100).toFixed(0)}%` : '0%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Context grounded score</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AVG LATENCY</span>
            <Zap size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            {report ? `${report.avgLatencyMs} ms` : '0 ms'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Response generation time</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TOTAL TOKENS</span>
            <DollarSign size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
            {report ? report.totalTokenCost : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tokens consumed in evals</div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Evaluation Run History</h3>
        {!report || report.runs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No benchmark runs recorded yet. Click above to run a benchmark!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {report.runs.map((r: any) => (
              <div
                key={r.id}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Agent: {r.agent_id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prompt: "{r.query_prompt}"</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="badge badge-emerald">Precision: {(r.precision_score * 100).toFixed(0)}%</span>
                  <span className="badge badge-cyan">Faithfulness: {(r.faithfulness_score * 100).toFixed(0)}%</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{r.latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
