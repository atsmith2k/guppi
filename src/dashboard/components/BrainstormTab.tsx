import React, { useState, useEffect } from 'react';
import { Lightbulb, Send, CheckCircle2, Sparkles, ShieldAlert, Cpu, FileText, BookmarkCheck } from 'lucide-react';

export const BrainstormTab: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/brainstorm/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data.blueprint) setBlueprint(data.blueprint);
      });
  }, []);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    try {
      const res = await fetch('/api/brainstorm/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.state.sessionId);
        setCurrentQuestion(data.nextQuestion);
        setHistory([]);
        setBlueprint(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnswer = async (answerText?: string) => {
    const textToSend = answerText || answerInput;
    if (!sessionId || !textToSend) return;

    setLoading(true);
    try {
      const res = await fetch('/api/brainstorm/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: textToSend }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => [...prev, { question: currentQuestion, answer: textToSend }]);
        setAnswerInput('');
        if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion);
        } else {
          setCurrentQuestion(null);
          setBlueprint(data.state?.synthesizedBlueprint || 'Blueprint Synthesized!');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getPersonaBadge = (persona: string) => {
    switch (persona) {
      case 'Visionary': return <span className="badge badge-purple">💡 Visionary Persona</span>;
      case 'Architect': return <span className="badge badge-cyan">🛠️ Architect Persona</span>;
      case 'Skeptic': return <span className="badge badge-rose">🕵️ Security Skeptic</span>;
      default: return <span className="badge badge-emerald">👤 UX Experience</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Lightbulb size={24} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Interactive Q&A Brainstorming Studio</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '750px', lineHeight: 1.5 }}>
          Guided ideation framework combining proven methodologies (Starbursting, 5-Whys, SCAMPER, Critic Pass) to produce a structured, high-density <strong>Spec Blueprint</strong> to inject into primary agents.
        </p>

        {!sessionId && (
          <form onSubmit={handleStartSession} style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <input
              type="text"
              required
              placeholder="What feature or project idea would you like to brainstorm? (e.g. Autonomous Code Refactoring Bot)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.95rem' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={18} /> Start Q&A Brainstorm
            </button>
          </form>
        )}
      </div>

      {/* Active Session View */}
      {sessionId && currentQuestion && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PHASE: {currentQuestion.phase}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2px' }}>Topic: "{topic}"</h3>
            </div>
            {getPersonaBadge(currentQuestion.persona)}
          </div>

          {/* Question Box */}
          <div style={{ background: '#050811', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '18px' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{currentQuestion.question}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>💡 Focus: {currentQuestion.context}</p>

            {currentQuestion.suggestedAnswers && currentQuestion.suggestedAnswers.length > 0 && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Suggested Starters:</span>
                {currentQuestion.suggestedAnswers.map((suggestion: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendAnswer(suggestion)}
                    style={{ textAlign: 'left', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'var(--accent-cyan)', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    👉 {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Answer Form */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Type your answer or build on the suggestions above..."
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAnswer()}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)', background: 'var(--bg-secondary)', color: '#fff', fontSize: '0.95rem' }}
            />
            <button
              onClick={() => handleSendAnswer()}
              disabled={loading}
              style={{ padding: '12px 24px', background: 'var(--accent-cyan)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={16} /> Submit Answer
            </button>
          </div>
        </div>
      )}

      {/* Synthesized Blueprint Spec Display */}
      {blueprint && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={20} /> Synthesized Brainstorm Spec Blueprint
            </h3>
            <button
              onClick={() => setSessionId(null)}
              style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--bg-card-border)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Start New Session
            </button>
          </div>

          <div style={{ background: '#040711', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#f8fafc', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto' }}>
            {blueprint}
          </div>
        </div>
      )}
    </div>
  );
};
