import React, { useState, useEffect } from 'react';
import { Network, Plus, Search, GitBranch, Layers, CheckCircle2 } from 'lucide-react';

export const MeshTab: React.FC = () => {
  const [repoPathInput, setRepoPathInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoPathInput) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/mesh/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRepoPath: repoPathInput }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Successfully linked repository: "${data.repo.repo_name}"`);
        setRepoPathInput('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMesh = async () => {
    const res = await fetch(`/api/mesh/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.results || []);
  };

  useEffect(() => {
    if (searchQuery) {
      handleSearchMesh();
    }
  }, [searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Network size={24} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Multi-Repository Knowledge Mesh</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '750px', lineHeight: 1.5 }}>
          Link external project repositories on your local system into GUPPI's unified knowledge network to share AST symbols, architectural rules, and cross-repo context across AI agents.
        </p>

        <form onSubmit={handleLinkRepo} style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <input
            type="text"
            required
            placeholder="Enter absolute path to external repository (e.g. /Users/ashton/git/other-repo)..."
            value={repoPathInput}
            onChange={(e) => setRepoPathInput(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.95rem' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 24px', background: 'var(--accent-cyan)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Link Repository Node
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '14px', fontSize: '0.88rem', color: message.startsWith('✅') ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            {message}
          </div>
        )}
      </div>

      {/* Cross-Repo Search */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={20} color="var(--accent-purple)" /> Cross-Repository Symbol & Knowledge Search
        </h3>

        <input
          type="text"
          placeholder="Search AST symbols across all linked multi-repo nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.95rem', marginBottom: '16px' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {searchResults.map((r, idx) => (
            <div key={idx} style={{ background: '#040711', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={16} /> Repository Node: {r.repoName} ({r.repoPath})
              </div>
              {r.matches.map((m: any) => (
                <div key={m.id} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  - {m.signature} ({m.kind}) in {m.file_path}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
