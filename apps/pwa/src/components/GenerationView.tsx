import { useState } from 'react';
import type { LoreDocument, PromptHierarchy, TwoPassConfig } from '@withersmith/engine';
import { useLoreDocuments } from '../hooks/use-lore';
import { useGeneration } from '../hooks/use-generation';

interface GenerationViewProps {
  apiKey: string;
}

const DEFAULT_CORE_INSTRUCTIONS = `You are an AI writing assistant for a fantasy novel series called "Advent of Ultima." Generate narrative prose that is faithful to the provided lore and continuity.`;

export function GenerationView({ apiKey }: GenerationViewProps) {
  const [prompt, setPrompt] = useState('');
  const { documents } = useLoreDocuments();
  const { isGenerating, streamingText, result, error, generate, reset } =
    useGeneration({ apiKey });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const hierarchy: PromptHierarchy = {
      coreInstructions: DEFAULT_CORE_INSTRUCTIONS,
      loreDocuments: documents,
      canonicalText: '',
      sessionContext: {
        voiceNotes: [],
        ephemeralOutline: null,
        recentTurns: [],
      },
    };

    const config: TwoPassConfig = {
      skipPassTwo: true,
      streamPassTwo: false,
    };

    await generate(prompt, hierarchy, config);
  };

  const displayText = streamingText || result?.passOneOutput || result?.passTwoOutput || '';

  return (
    <div>
      <div style={styles.inputArea}>
        <textarea
          placeholder="Describe the scene you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={styles.textarea}
          rows={3}
          disabled={isGenerating}
        />
        <div style={styles.actions}>
          <button
            style={styles.generateBtn}
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          {(result || error) && (
            <button style={styles.resetBtn} onClick={reset}>
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {displayText && (
        <div style={styles.output}>
          <div style={styles.outputHeader}>
            <span style={styles.outputLabel}>Output</span>
            {result && (
              <span style={styles.metrics}>
                {result.metrics.totalInputTokens} in / {result.metrics.totalOutputTokens} out
                {result.metrics.passOneCacheMetrics.cacheReadInputTokens > 0 &&
                  ` | ${result.metrics.passOneCacheMetrics.cacheReadInputTokens} cached`}
              </span>
            )}
          </div>
          <div style={styles.prose}>{displayText}</div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  inputArea: {
    marginBottom: '1rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #2a2a4a',
    background: '#0f0f23',
    color: '#e6e6e6',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  generateBtn: {
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    border: 'none',
    background: '#4a6fa5',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resetBtn: {
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid #3a3a5a',
    background: 'transparent',
    color: '#8a8a9a',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  error: {
    color: '#ff6b6b',
    background: '#2a1a1a',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  output: {
    background: '#0f0f23',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  outputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    background: '#16213e',
    borderBottom: '1px solid #2a2a4a',
  },
  outputLabel: {
    color: '#8a8a9a',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metrics: {
    color: '#5a7a9a',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
  },
  prose: {
    padding: '1rem',
    color: '#d4d4d4',
    fontSize: '0.9rem',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
};
