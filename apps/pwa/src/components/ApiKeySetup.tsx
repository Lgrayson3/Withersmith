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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Advent Writing Engine</h1>
        <p style={styles.subtitle}>
          Enter your Anthropic API key to get started. Your key is stored
          locally on this device and never sent anywhere except the Anthropic
          API.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
            placeholder="sk-ant-api03-..."
            style={styles.input}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={!key.trim()}>
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1rem',
    background: '#1a1a2e',
  },
  card: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  title: {
    margin: '0 0 0.5rem',
    color: '#e6e6e6',
    fontSize: '1.5rem',
  },
  subtitle: {
    color: '#8a8a9a',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    margin: '0 0 1.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #2a2a4a',
    background: '#0f0f23',
    color: '#e6e6e6',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '0.8rem',
    margin: '0.5rem 0 0',
  },
  button: {
    width: '100%',
    marginTop: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: '#4a6fa5',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
