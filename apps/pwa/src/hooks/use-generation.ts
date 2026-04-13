import { useState, useCallback, useRef } from 'react';
import {
  AdventClient,
  PromptBuilder,
  TwoPassGenerator,
  type GenerationResult,
  type PromptHierarchy,
  type TwoPassConfig,
  type StyleArchive,
  type CacheMetrics,
} from '@withersmith/engine';

interface UseGenerationOptions {
  apiKey: string;
  onCacheMetrics?: (metrics: CacheMetrics) => void;
}

interface GenerationState {
  isGenerating: boolean;
  streamingText: string;
  result: GenerationResult | null;
  error: string | null;
}

export function useGeneration({ apiKey, onCacheMetrics }: UseGenerationOptions) {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    streamingText: '',
    result: null,
    error: null,
  });

  const generatorRef = useRef<TwoPassGenerator | null>(null);

  const getGenerator = useCallback(() => {
    if (!generatorRef.current) {
      const client = new AdventClient({
        apiKey,
        onCacheMetrics,
      });
      const builder = new PromptBuilder();
      generatorRef.current = new TwoPassGenerator(client, builder);
    }
    return generatorRef.current;
  }, [apiKey, onCacheMetrics]);

  const generate = useCallback(
    async (
      userMessage: string,
      hierarchy: PromptHierarchy,
      config: TwoPassConfig,
      styleArchive?: StyleArchive,
    ) => {
      setState({
        isGenerating: true,
        streamingText: '',
        result: null,
        error: null,
      });

      try {
        const generator = getGenerator();
        const result = await generator.generateStreaming(
          { userMessage, hierarchy, config, styleArchive },
          {
            onText: (_delta, snapshot) => {
              setState((prev) => ({ ...prev, streamingText: snapshot }));
            },
            onError: (err) => {
              setState((prev) => ({ ...prev, error: err.message }));
            },
          },
        );

        setState({
          isGenerating: false,
          streamingText: '',
          result,
          error: null,
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: message,
        }));
        return null;
      }
    },
    [getGenerator],
  );

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      streamingText: '',
      result: null,
      error: null,
    });
  }, []);

  return { ...state, generate, reset };
}
