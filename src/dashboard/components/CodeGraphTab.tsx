import React, { useState, useEffect } from 'react';
import { Code, FileCode, Layers, Search, ArrowRight } from 'lucide-react';

export const CodeGraphTab: React.FC = () => {
  const [symbols, setSymbols] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`/api/symbols?q=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => setSymbols(data.symbols || []));

    fetch('/api/codebase')
      .then((res) => res.json())
      .then((data) => setFiles(data.files || []));
  }, [searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Filter AST symbols, functions, classes, or file paths..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: '8px',
            border: '1px solid var(--bg-card-border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* AST Symbols Column */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={20} color="var(--accent-cyan)" /> AST Symbols Index ({symbols.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto' }}>
            {symbols.map((sym) => (
              <div key={sym.id} style={{ background: '#050811', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="font-mono" style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600 }}>{sym.symbol_name}</span>
                  <span className="badge badge-purple">{sym.kind}</span>
                </div>
                <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{sym.signature}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileCode size={12} /> {sym.file_path} (Lines {sym.line_start}-{sym.line_end})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Codebase File Topology Column */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-purple)" /> File Structure Topology ({files.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto' }}>
            {files.map((file) => (
              <div key={file.path} style={{ background: '#050811', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{file.path}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{file.line_count} lines</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{file.summary}</div>
                {file.exports.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Exports: {file.exports.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
