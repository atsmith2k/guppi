import React, { useState } from 'react';
import { FlaskConical, Play, CheckCircle2, FileCode, Sparkles } from 'lucide-react';

export const TestStudioTab: React.FC = () => {
  const [filePath, setFilePath] = useState('src/engine/ast.ts');
  const [generatedSuite, setGeneratedSuite] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateTests = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath) return;
    setLoading(true);
    try {
      const res = await fetch('/api/test-gen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedSuite(data.suite);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.15) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <FlaskConical size={24} color="var(--accent-emerald)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Automated Unit Test Generator Studio</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '750px', lineHeight: 1.5 }}>
          Inspects AST function & class signatures in target files, generating isolated unit test suites in <code>test/generated/</code> covering standard inputs, edge cases, and boundary conditions.
        </p>

        <form onSubmit={handleGenerateTests} style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <input
            type="text"
            required
            placeholder="Enter relative file path to generate tests for (e.g. src/engine/ast.ts)..."
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)', background: '#050811', color: '#fff', fontSize: '0.95rem' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 24px', background: 'var(--accent-emerald)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={18} /> Generate Unit Test Specs
          </button>
        </form>
      </div>

      {generatedSuite && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="badge badge-emerald">Tests Generated</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '6px' }}>Test File: {generatedSuite.testFilePath}</h3>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Functions Tested: <span style={{ color: '#fff', fontWeight: 600 }}>{generatedSuite.symbolsTested.join(', ') || 'Module'}</span>
            </div>
          </div>

          <pre style={{ background: '#040711', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#34d399', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto' }}>
            {generatedSuite.testCode}
          </pre>
        </div>
      )}
    </div>
  );
};
