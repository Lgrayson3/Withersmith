import { useState } from 'react';

interface ApiKeySetupProps {
  onSave: (key: string) => void;
}

export function ApiKeySetup({ onSave }: ApiKeySetupProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with sk-ant-');
      return;
    }
    onSave(trimmed);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '1rem',
    }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          <span className="app-title" style={{ fontSize: '1.5rem' }}>Advent Writing Engine</span>
        </h1>
        <p className="text-secondary" style={{ fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Enter your Anthropic API key to get started. Your key is stored
          locally on this device and never sent anywhere except the Anthropic API.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            placeholder="sk-ant-api03-..."
            className="input input-mono"
            autoFocus
          />
          {error && <p className="text-error">{error}</p>}
          <button type="submit" className="prismatic-btn filled" disabled={!key.trim()}>
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
}
