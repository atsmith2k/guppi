import React, { useState, useEffect } from 'react';
import { Brain, Search, Plus, Network, Clock, ShieldAlert, Sparkles } from 'lucide-react';

export const EpisodicMemoryTab: React.FC = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [queryInput, setQueryInput] = useState('');

  const fetchData = async () => {
    try {
      const memRes = await fetch('/api/episodic');
      const memData = await memRes.json();
      if (memData.memories) setMemories(memData.memories);

      const factRes = await fetch(`/api/episodic/facts?q=${encodeURIComponent(queryInput)}`);
      const factData = await factRes.json();
      if (factData.facts) setFacts(factData.facts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [queryInput]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || !contentInput.trim()) return;

    await fetch('/api/episodic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicInput, content: contentInput, importanceScore: 0.9 }),
    });

    setTopicInput('');
    setContentInput('');
    fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Brain size={24} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Decay-Ranked Episodic Memory & Fact Graph</h2>
          <span className="badge badge-purple">Poached from Mem0 & MemGPT</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Ebbinghaus decay memory retention engine combined with automated subject-relation-object Fact Triple extraction.
        </p>
      </div>

      {/* Grid for Add Memory Form & Fact Search */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Memory Form */}
        <form onSubmit={handleAddMemory} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-purple)" /> Add Episodic Agent Memory
          </h3>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Topic (e.g. SQLite WAL Concurrency)..."
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
          <textarea
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="Memory content & extracted architectural rules..."
            rows={3}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
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
            <Plus size={16} /> Save Memory
          </button>
        </form>

        {/* Fact Search */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} color="var(--accent-cyan)" /> Fact Graph Triple Search
          </h3>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search subject/relation/object facts..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>
          <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {facts.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No fact triples found.</div>
            ) : (
              facts.map((f) => (
                <div key={f.id} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{f.subject}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>--[{f.relation}]--&gt;</span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{f.object}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Decay Ranked Memories */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--accent-purple)" /> Ebbinghaus Decay Ranked Memories
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {memories.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No episodic memories recorded yet.</div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{m.topic}</h4>
                  <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>Decay: {m.decay_score}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{m.content}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 'auto', paddingTop: '8px' }}>
                  Type: {m.memory_type} | Accesses: {m.access_count}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
