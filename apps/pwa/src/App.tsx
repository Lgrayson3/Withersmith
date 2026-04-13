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
    getApiKey()
      .then((key) => {
        setApiKeyState(key);
      })
      .catch(() => {
        // IndexedDB unavailable or error - fall through to key entry
        setApiKeyState(null);
      })
      .finally(() => {
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
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!apiKey) {
    return <ApiKeySetup onSave={handleSaveKey} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Advent</h1>
        <nav className="app-nav">
          <button
            className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate
          </button>
          <button
            className={`tab-btn ${activeTab === 'codex' ? 'active' : ''}`}
            onClick={() => setActiveTab('codex')}
          >
            Codex
          </button>
        </nav>
        <button className="prismatic-btn small" onClick={handleClearKey}>
          Key
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'generate' && <GenerationView apiKey={apiKey} />}
        {activeTab === 'codex' && <LoreManager />}
      </main>
    </div>
  );
}
