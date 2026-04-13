import { useState, useEffect } from 'react';
import type { PromptHierarchy, TwoPassConfig } from '@withersmith/engine';
import { useLoreDocuments } from '../hooks/use-lore';
import { useChapters } from '../hooks/use-chapters';
import { useGeneration } from '../hooks/use-generation';

interface GenerationViewProps {
  apiKey: string;
  onCrystallized?: () => void;
}

const DEFAULT_CORE_INSTRUCTIONS = `You are an AI writing assistant for a fantasy novel series called "Advent of Ultima." Generate narrative prose that is faithful to the provided lore and continuity.`;

export function GenerationView({ apiKey, onCrystallized }: GenerationViewProps) {
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');
  const [crystallizeTitle, setCrystallizeTitle] = useState('');
  const [showCrystallize, setShowCrystallize] = useState(false);
  const [crystallizing, setCrystallizing] = useState(false);

  const { documents } = useLoreDocuments();
  const { chapters, crystallize, getFullCanonicalText } = useChapters();
  const { isGenerating, streamingText, result, error, generate, reset } =
    useGeneration({ apiKey });

  // When generation completes, populate the editable draft
  useEffect(() => {
    if (result) {
      setDraft(result.passTwoOutput ?? result.passOneOutput);
    }
  }, [result]);

  // While streaming, mirror to draft for live preview
  useEffect(() => {
    if (streamingText) {
      setDraft(streamingText);
    }
  }, [streamingText]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Build canonical context from all crystallized chapters
    const canonicalText = await getFullCanonicalText();

    const hierarchy: PromptHierarchy = {
      coreInstructions: DEFAULT_CORE_INSTRUCTIONS,
      loreDocuments: documents,
      canonicalText,
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

  const handleCrystallize = async () => {
    if (!crystallizeTitle.trim() || !draft.trim()) return;
    setCrystallizing(true);
    try {
      await crystallize(crystallizeTitle.trim(), draft.trim());
      // Reset everything after crystallizing
      setDraft('');
      setPrompt('');
      setCrystallizeTitle('');
      setShowCrystallize(false);
      reset();
      onCrystallized?.();
    } finally {
      setCrystallizing(false);
    }
  };

  const handleClear = () => {
    setDraft('');
    setShowCrystallize(false);
    setCrystallizeTitle('');
    reset();
  };

  const hasDraft = draft.length > 0 && !isGenerating;

  return (
    <div className="flex flex-col gap-md">
      {/* Prompt input */}
      <div>
        <textarea
          placeholder="Describe the scene you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="input"
          rows={3}
          disabled={isGenerating}
        />
        <div className="flex gap-sm mt-sm" style={{ alignItems: 'center' }}>
          <button
            className="prismatic-btn filled"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          {hasDraft && (
            <button className="prismatic-btn" onClick={handleClear}>
              Clear
            </button>
          )}
          {chapters.length > 0 && (
            <span className="text-tertiary text-xs text-mono" style={{ marginLeft: 'auto' }}>
              {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} in context
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="surface">
          <p className="text-error">{error}</p>
        </div>
      )}

      {/* Editable draft area */}
      {draft && (
        <div className="output-panel">
          <div className="output-header">
            <span className="text-tertiary text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isGenerating ? 'Generating...' : 'Draft'}
            </span>
            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
              {result && (
                <span className="text-tertiary text-xs text-mono">
                  {result.metrics.totalInputTokens} in / {result.metrics.totalOutputTokens} out
                  {result.metrics.passOneCacheMetrics.cacheReadInputTokens > 0 &&
                    ` | ${result.metrics.passOneCacheMetrics.cacheReadInputTokens} cached`}
                </span>
              )}
              <span className="text-tertiary text-xs text-mono">
                ~{Math.ceil(draft.length / 4).toLocaleString()} tokens
              </span>
            </div>
          </div>

          <textarea
            className="draft-editor"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={isGenerating}
          />

          {/* Crystallize bar */}
          {hasDraft && (
            <div style={{
              padding: '0.75rem',
              borderTop: '1px solid var(--border-light)',
            }}>
              {showCrystallize ? (
                <div className="flex flex-col gap-sm">
                  <input
                    className="input"
                    placeholder="Chapter title..."
                    value={crystallizeTitle}
                    onChange={(e) => setCrystallizeTitle(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && crystallizeTitle.trim()) handleCrystallize();
                      if (e.key === 'Escape') setShowCrystallize(false);
                    }}
                  />
                  <div className="flex gap-sm">
                    <button
                      className="prismatic-btn filled"
                      onClick={handleCrystallize}
                      disabled={!crystallizeTitle.trim() || crystallizing}
                    >
                      {crystallizing ? 'Saving...' : 'Confirm Crystallize'}
                    </button>
                    <button
                      className="prismatic-btn"
                      onClick={() => setShowCrystallize(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="crystallize-btn"
                  onClick={() => setShowCrystallize(true)}
                >
                  Crystallize
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
