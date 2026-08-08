import React, { useState, useEffect } from 'react';
import { GitFork, Activity, AlertTriangle, ShieldCheck, Play, Search } from 'lucide-react';

export const CallGraphTab: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [targetSymbol, setTargetSymbol] = useState('');
  const [proposedSig, setProposedSig] = useState('');
  const [simResult, setSimResult] = useState<any>(null);
  const [building, setBuilding] = useState(false);

  const handleBuildGraph = async () => {
    setBuilding(true);
    try {
      const res = await fetch('/api/callgraph/build', { method: 'POST' });
      const data = await res.json();
      if (data.graph) {
        setNodes(data.graph.nodes);
        setEdges(data.graph.edges);
      }
    } finally {
      setBuilding(false);
    }
  };

  useEffect(() => {
    handleBuildGraph();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSymbol.trim() || !proposedSig.trim()) return;

    const res = await fetch('/api/callgraph/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetSymbol, proposedSignature: proposedSig }),
    });
    const data = await res.json();
    if (data.simulation) setSimResult(data.simulation);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <GitFork size={24} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>AST Call Graph & Signature Mutation Simulator</h2>
              <span className="badge badge-amber">Poached from Tree-Sitter & GraphRAG</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Analyzes symbol caller-callee call hierarchies and simulates signature mutations to predict breaking changes.
            </p>
          </div>
          <button
            onClick={handleBuildGraph}
            disabled={building}
            style={{
              background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-red))',
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
            <Activity size={16} /> {building ? 'Scanning AST Call Graph...' : 'Re-index Call Graph'}
          </button>
        </div>
      </div>

      {/* Simulator & Graph Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Simulator Form */}
        <form onSubmit={handleSimulate} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--accent-amber)" /> Signature Mutation Risk Simulator
          </h3>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Target Symbol Name</label>
            <input
              type="text"
              value={targetSymbol}
              onChange={(e) => setTargetSymbol(e.target.value)}
              placeholder="e.g. GuppiDB or createPlan"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Proposed New Signature</label>
            <input
              type="text"
              value={proposedSig}
              onChange={(e) => setProposedSig(e.target.value)}
              placeholder="e.g. createPlan(goal: string, options: PlanOptions)"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-red))',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Play size={16} /> Simulate Risk Impact
          </button>

          {/* Simulation Output Card */}
          {simResult && (
            <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Impact Risk Score</span>
                <span className={`badge ${simResult.riskScore >= 50 ? 'badge-red' : 'badge-emerald'}`} style={{ fontSize: '0.85rem' }}>
                  {simResult.riskScore}% Risk
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{simResult.recommendation}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Affected Breaking Callers ({simResult.breakingChangeCount}): {simResult.affectedCallSites.map((c: any) => c.caller_symbol).join(', ') || 'None'}
              </div>
            </div>
          )}
        </form>

        {/* Nodes & Edges Summary */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={18} color="var(--accent-amber)" /> Symbol Call Hierarchy ({edges.length} edges)
          </h3>
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {edges.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No call graph edges detected. Click re-index above.</div>
            ) : (
              edges.map((e, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{e.caller_symbol}</span>
                  <span style={{ color: 'var(--text-dim)', margin: '0 6px' }}>calls</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{e.callee_symbol}</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>{e.file_path}:{e.line_number} ({e.call_type})</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
