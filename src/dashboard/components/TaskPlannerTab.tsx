import React, { useState, useEffect } from 'react';
import { ListTodo, Plus, CheckCircle2, Clock, AlertTriangle, Layers, UserCheck } from 'lucide-react';

export const TaskPlannerTab: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.plans) setPlans(data.plans);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      const data = await res.json();
      if (data.success) {
        setGoalInput('');
        fetchPlans();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStepStatusChange = async (stepId: string, status: string) => {
    await fetch('/api/tasks/step/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId, status }),
    });
    fetchPlans();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ListTodo size={24} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Task Execution Planner & DAG Orchestrator</h2>
          <span className="badge badge-purple">Poached from Aider & Superpowers</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Decomposes complex feature goals into multi-agent DAG task dependency graphs, assigns agent roles, and tracks step progress.
        </p>
      </div>

      {/* Goal Input Form */}
      <form onSubmit={handleCreatePlan} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="Enter a high-level goal to generate a DAG task plan (e.g. 'Build user auth system')..."
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#fff',
            fontSize: '0.9rem',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={18} /> Decompose Goal
        </button>
      </form>

      {/* Active Plans List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active task plans. Enter a goal above to generate a DAG execution plan!
          </div>
        ) : (
          plans.map((p) => (
            <div key={p.plan.id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{p.plan.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Goal: {p.plan.goal}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{p.progressPercent}% Complete</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{p.completedCount}/{p.totalCount} Steps</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '6px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ width: `${p.progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))', transition: 'width 0.3s ease' }} />
              </div>

              {/* Steps List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {p.steps.map((step: any) => (
                  <div
                    key={step.id}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>Step {step.step_number}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{step.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{step.description}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={14} /> {step.assigned_role}
                      </span>
                      <select
                        value={step.status}
                        onChange={(e) => handleStepStatusChange(step.id, e.target.value)}
                        style={{
                          background: 'rgba(15,23,42,0.8)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="running">Running</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
