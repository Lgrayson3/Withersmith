import { useState, useEffect } from 'react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { GenerationView } from './components/GenerationView';
import { LoreManager } from './components/LoreManager';
import { getApiKey, setApiKey, clearApiKey } from './settings/api-key';

type Tab = 'generate' | 'codex';

export function App() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  useEffect(() => {
    getApiKey().then((key) => {
      setApiKeyState(key);
      setLoading(false);
    });
  }, []);

  const handleSaveKey = async (key: string) => {
    await setApiKey(key);
    setApiKeyState(key);
  };

  const handleClearKey = async () => {
    await clearApiKey();
    setApiKeyState(null);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p style={{ color: '#8a8a9a' }}>Loading...</p>
      </div>
    );
  }

  if (!apiKey) {
    return <ApiKeySetup onSave={handleSaveKey} />;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Advent</h1>
        <nav style={styles.nav}>
          <button
            style={activeTab === 'generate' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('generate')}
          >
            Generate
          </button>
          <button
            style={activeTab === 'codex' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('codex')}
          >
            Codex
          </button>
        </nav>
        <button style={styles.logoutBtn} onClick={handleClearKey}>
          Key
        </button>
      </header>

      <main style={styles.main}>
        {activeTab === 'generate' && <GenerationView apiKey={apiKey} />}
        {activeTab === 'codex' && <LoreManager />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#1a1a2e',
  },
  container: {
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#e6e6e6',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #2a2a4a',
    gap: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.2rem',
    color: '#4a6fa5',
    fontWeight: 700,
  },
  nav: {
    display: 'flex',
    gap: '0.25rem',
    flex: 1,
  },
  tab: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#6a6a8a',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  tabActive: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: 'none',
    background: '#2a2a4a',
    color: '#e6e6e6',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  logoutBtn: {
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    border: '1px solid #3a3a5a',
    background: 'transparent',
    color: '#6a6a8a',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  main: {
    padding: '1rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
};
