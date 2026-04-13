import { useState } from 'react';
import type { PromptHierarchy, TwoPassConfig } from '@withersmith/engine';
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
    <div className="flex flex-col gap-md">
      <div>
        <textarea
          placeholder="Describe the scene you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="input"
          rows={3}
          disabled={isGenerating}
        />
        <div className="flex gap-sm mt-sm">
          <button
            className="prismatic-btn filled"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          {(result || error) && (
            <button className="prismatic-btn" onClick={reset}>
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="surface">
          <p className="text-error">{error}</p>
        </div>
      )}

      {displayText && (
        <div className="output-panel">
          <div className="output-header">
            <span className="text-tertiary text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Output
            </span>
            {result && (
              <span className="text-tertiary text-xs text-mono">
                {result.metrics.totalInputTokens} in / {result.metrics.totalOutputTokens} out
                {result.metrics.passOneCacheMetrics.cacheReadInputTokens > 0 &&
                  ` | ${result.metrics.passOneCacheMetrics.cacheReadInputTokens} cached`}
              </span>
            )}
          </div>
          <div className="output-prose">{displayText}</div>
        </div>
      )}
    </div>
  );
}
