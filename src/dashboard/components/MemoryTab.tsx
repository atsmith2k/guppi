import React, { useState, useEffect } from 'react';
import { Search, Plus, Database, Tag, Calendar, Bookmark } from 'lucide-react';

export const MemoryTab: React.FC = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('decision');

  const fetchMemories = async (query: string = '') => {
    const url = query ? `/api/memories?q=${encodeURIComponent(query)}` : '/api/memories';
    const res = await fetch(url);
    const data = await res.json();
    setMemories(data.memories || data.relevantMemories || []);
  };

  useEffect(() => {
    fetchMemories(searchQuery);
  }, [searchQuery]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category, tags: ['user_added'], source: 'web_dashboard' }),
    });

    setTitle('');
    setContent('');
    setShowAddModal(false);
    fetchMemories();
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'decision': return 'badge-cyan';
      case 'rule': return 'badge-rose';
      case 'architecture': return 'badge-purple';
      case 'bug_solution': return 'badge-amber';
      default: return 'badge-emerald';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search RAG memory store (hybrid vector & full-text search)..."
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

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'var(--accent-purple)',
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={18} /> Add Memory
        </button>
      </div>

      {/* Memory Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {memories.map((mem) => (
          <div key={mem.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className={`badge ${getCategoryBadgeClass(mem.category)}`}>{mem.category}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {new Date(mem.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px' }}>{mem.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                {mem.content.length > 250 ? `${mem.content.substring(0, 250)}...` : mem.content}
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Tag size={12} color="var(--text-dim)" />
              {mem.tags && mem.tags.map((tag: string, i: number) => (
                <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Add Workspace Memory</h3>
            <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Memory Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Use SQLite WAL mode for fast concurrency"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: 'var(--bg-primary)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: 'var(--bg-primary)', color: '#fff' }}
                >
                  <option value="decision">Decision</option>
                  <option value="rule">Rule</option>
                  <option value="architecture">Architecture</option>
                  <option value="bug_solution">Bug Solution</option>
                  <option value="convention">Convention</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Memory Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detailed rationale, code example, or rule explanation..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: 'var(--bg-primary)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--bg-card-border)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: 'var(--accent-purple)', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Memory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
