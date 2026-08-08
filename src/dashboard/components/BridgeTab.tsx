import React, { useState, useEffect } from 'react';
import { GitPullRequest, Plus, UserCheck, CheckCircle2, Clock } from 'lucide-react';

export const BridgeTab: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('all');

  const fetchTasks = () => {
    fetch('/api/bridge/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await fetch('/api/bridge/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: 'Cross-agent task created from GUPPI deck', assigned_agent: assignedAgent }),
    });

    setTitle('');
    fetchTasks();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitPullRequest size={20} color="var(--accent-purple)" /> Cross-Agent Task Switchboard
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
          Coordinate tasks and share scratchpad artifacts between multiple agents (CLI agents, subagents, IDE tools) working on this workspace.
        </p>

        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Add task for cross-agent collaboration (e.g. Implement SQLite FTS indexing)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.9rem' }}
          />
          <select
            value={assignedAgent}
            onChange={(e) => setAssignedAgent(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.9rem' }}
          >
            <option value="all">Any Agent</option>
            <option value="antigravity_cli">Antigravity CLI</option>
            <option value="claude_code">Claude Code</option>
            <option value="cursor">Cursor</option>
          </select>
          <button type="submit" style={{ padding: '10px 20px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Post Task
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {tasks.map((task) => (
          <div key={task.id} className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{task.assigned_agent}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {task.status}
              </span>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>{task.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{task.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
