import React, { useState, useEffect } from 'react';
import { Cpu, Clock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TelemetryTab: React.FC = () => {
  const [traces, setTraces] = useState<any[]>([]);

  const fetchTraces = () => {
    fetch('/api/telemetry')
      .then((res) => res.json())
      .then((data) => setTraces(data.traces || []));
  };

  useEffect(() => {
    fetchTraces();
    const interval = setInterval(fetchTraces, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>Agent Telemetry & Trace Deck</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Real-time step activity, latency tracking, and token profiling for connected agents.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
          <span className="status-dot-active"></span> Live Trace Stream
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {traces.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No agent tool traces recorded yet. Traces will appear live as connected agents call GUPPI tools!
          </div>
        ) : (
          traces.map((trace) => (
            <div key={trace.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {trace.status === 'error' ? <AlertCircle size={20} color="var(--accent-rose)" /> : <CheckCircle2 size={20} color="var(--accent-emerald)" />}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{trace.step_name}</span>
                    <span className="badge badge-cyan font-mono">{trace.tool_name}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Agent: <span style={{ color: 'var(--text-main)' }}>{trace.agent_id}</span> | Input: {trace.input_payload ? trace.input_payload.substring(0, 80) : 'None'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {trace.latency_ms}ms
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={14} color="var(--accent-amber)" /> {trace.tokens_used} tokens
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {new Date(trace.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
