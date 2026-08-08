import React, { useState, useEffect } from 'react';
import { GitGraph, Layers, Database, RefreshCw, Share2 } from 'lucide-react';

export const GraphViewTab: React.FC = () => {
  const [symbols, setSymbols] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  const loadGraphData = () => {
    fetch('/api/symbols')
      .then((res) => res.json())
      .then((data) => setSymbols(data.symbols || []));

    fetch('/api/memories')
      .then((res) => res.json())
      .then((data) => setMemories(data.memories || []));

    fetch('/api/codebase')
      .then((res) => res.json())
      .then((data) => setFiles(data.files || []));
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitGraph size={20} color="var(--accent-cyan)" /> Knowledge & Module Dependency Graph
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Interactive node-link visualization connecting RAG decision memories $\rightarrow$ AST symbols $\rightarrow$ codebase files.
          </p>
        </div>
        <button onClick={loadGraphData} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-card-border)', color: '#fff', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh Graph
        </button>
      </div>

      {/* Interactive Visual Canvas */}
      <div className="glass-panel" style={{ padding: '24px', minHeight: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)' }}>
            <Database size={14} /> Memory Nodes ({memories.length})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
            <Share2 size={14} /> AST Symbol Nodes ({symbols.length})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
            <Layers size={14} /> File Modules ({files.length})
          </span>
        </div>

        {/* Node Graph Visualizer representation */}
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', background: '#040711', padding: '30px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignContent: 'flex-start', minHeight: '380px' }}>
          {memories.map((m, i) => (
            <div key={m.id} className="glass-panel-hover" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c084fc', padding: '10px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={12} /> {m.title.substring(0, 30)}...
            </div>
          ))}

          {symbols.slice(0, 15).map((s) => (
            <div key={s.id} className="glass-panel-hover" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', color: '#38bdf8', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
              {s.kind}: {s.symbol_name}
            </div>
          ))}

          {files.slice(0, 12).map((f) => (
            <div key={f.path} className="glass-panel-hover" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
              📁 {f.path}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
