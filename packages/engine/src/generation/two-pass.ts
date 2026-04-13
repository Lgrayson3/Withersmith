import type { PromptHierarchy } from '../prompt/types.js';
import type { StyleArchive } from '../store/types.js';
import type { CacheMetrics } from '../client/types.js';
import type { GenerationRequest, GenerationResult } from './types.js';
import { AdventClient, type StreamCallbacks } from '../client/anthropic-client.js';
import { PromptBuilder } from '../prompt/builder.js';
import { PASS_ONE_INSTRUCTIONS } from './pass-one.js';
import { PASS_TWO_INSTRUCTIONS } from './pass-two.js';

interface TextBlockParam {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' } | null;
}

interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
}

/**
 * Orchestrates the two-pass generation flow:
 *   Pass 1: Content/Logic - generates structurally sound narrative
 *   Pass 2: Voice/Style - rewrites to match the author's voice
 *
 * Pass 2 can be skipped when no Style Archive exists (skipPassTwo).
 * Pass 2 output can optionally be streamed to the UI.
 */
export class TwoPassGenerator {
  private client: AdventClient;
  private promptBuilder: PromptBuilder;

  constructor(client: AdventClient, promptBuilder: PromptBuilder) {
    this.client = client;
    this.promptBuilder = promptBuilder;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const metrics: {
      passOneCacheMetrics: CacheMetrics;
      passTwoCacheMetrics: CacheMetrics | null;
    } = {
      passOneCacheMetrics: zeroCacheMetrics(),
      passTwoCacheMetrics: null,
    };

    // --- Pass 1: Content/Logic ---
    const passOneHierarchy: PromptHierarchy = {
      ...request.hierarchy,
      coreInstructions: PASS_ONE_INSTRUCTIONS + '\n\n' + request.hierarchy.coreInstructions,
    };

    const passOneSystem = this.promptBuilder.buildSystemPrompt(passOneHierarchy);
    const passOneResponse = await this.client.generate({
      system: passOneSystem,
      messages: [{ role: 'user', content: request.userMessage }],
      maxTokens: request.config.maxOutputTokens ?? 4096,
      model: request.config.passOneModel,
    });

    const passOneOutput = AdventClient.extractText(passOneResponse);
    metrics.passOneCacheMetrics = extractMetrics(passOneResponse);

    // --- Pass 2: Voice/Style (optional) ---
    if (request.config.skipPassTwo || !request.styleArchive) {
      return {
        passOneOutput,
        passTwoOutput: null,
        metrics: {
          ...metrics,
          totalInputTokens: metrics.passOneCacheMetrics.inputTokens,
          totalOutputTokens: metrics.passOneCacheMetrics.outputTokens,
        },
      };
    }

    const passTwoSystem = this.buildPassTwoSystem(request.styleArchive);
    const passTwoResponse = await this.client.generate({
      system: passTwoSystem,
      messages: [
        {
          role: 'user',
          content: `<raw_content>\n${passOneOutput}\n</raw_content>\n\nRewrite this content to match the author's voice as defined in the Style Archive.`,
        },
      ],
      maxTokens: request.config.maxOutputTokens ?? 4096,
      model: request.config.passTwoModel,
    });

    const passTwoOutput = AdventClient.extractText(passTwoResponse);
    metrics.passTwoCacheMetrics = extractMetrics(passTwoResponse);

    return {
      passOneOutput,
      passTwoOutput,
      metrics: {
        ...metrics,
        totalInputTokens:
          metrics.passOneCacheMetrics.inputTokens +
          (metrics.passTwoCacheMetrics?.inputTokens ?? 0),
        totalOutputTokens:
          metrics.passOneCacheMetrics.outputTokens +
          (metrics.passTwoCacheMetrics?.outputTokens ?? 0),
      },
    };
  }

  /**
   * Streaming variant - streams Pass 2 output (or Pass 1 if skipPassTwo).
   * Returns the final result after the stream completes.
   */
  async generateStreaming(
    request: GenerationRequest,
    callbacks: StreamCallbacks,
  ): Promise<GenerationResult> {
    const metrics: {
      passOneCacheMetrics: CacheMetrics;
      passTwoCacheMetrics: CacheMetrics | null;
    } = {
      passOneCacheMetrics: zeroCacheMetrics(),
      passTwoCacheMetrics: null,
    };

    // --- Pass 1: always non-streaming (intermediate result) ---
    const passOneHierarchy: PromptHierarchy = {
      ...request.hierarchy,
      coreInstructions: PASS_ONE_INSTRUCTIONS + '\n\n' + request.hierarchy.coreInstructions,
    };

    const passOneSystem = this.promptBuilder.buildSystemPrompt(passOneHierarchy);

    if (request.config.skipPassTwo || !request.styleArchive) {
      // Stream Pass 1 directly
      let passOneOutput = '';
      const stream = this.client.stream(
        {
          system: passOneSystem,
          messages: [{ role: 'user', content: request.userMessage }],
          maxTokens: request.config.maxOutputTokens ?? 4096,
          model: request.config.passOneModel,
        },
        {
          onText: (delta, snapshot) => {
            passOneOutput = snapshot;
            callbacks.onText?.(delta, snapshot);
          },
          onMessage: (msg) => {
            metrics.passOneCacheMetrics = extractMetrics(msg);
            callbacks.onMessage?.(msg);
          },
          onError: callbacks.onError,
        },
      );

      await stream.done();

      return {
        passOneOutput,
        passTwoOutput: null,
        metrics: {
          ...metrics,
          totalInputTokens: metrics.passOneCacheMetrics.inputTokens,
          totalOutputTokens: metrics.passOneCacheMetrics.outputTokens,
        },
      };
    }

    // Pass 1 non-streaming
    const passOneResponse = await this.client.generate({
      system: passOneSystem,
      messages: [{ role: 'user', content: request.userMessage }],
      maxTokens: request.config.maxOutputTokens ?? 4096,
      model: request.config.passOneModel,
    });
    const passOneOutput = AdventClient.extractText(passOneResponse);
    metrics.passOneCacheMetrics = extractMetrics(passOneResponse);

    // --- Pass 2: streaming ---
    const passTwoSystem = this.buildPassTwoSystem(request.styleArchive);
    let passTwoOutput = '';

    const stream = this.client.stream(
      {
        system: passTwoSystem,
        messages: [
          {
            role: 'user',
            content: `<raw_content>\n${passOneOutput}\n</raw_content>\n\nRewrite this content to match the author's voice as defined in the Style Archive.`,
          },
        ],
        maxTokens: request.config.maxOutputTokens ?? 4096,
        model: request.config.passTwoModel,
      },
      {
        onText: (delta, snapshot) => {
          passTwoOutput = snapshot;
          callbacks.onText?.(delta, snapshot);
        },
        onMessage: (msg) => {
          metrics.passTwoCacheMetrics = extractMetrics(msg);
          callbacks.onMessage?.(msg);
        },
        onError: callbacks.onError,
      },
    );

    await stream.done();

    return {
      passOneOutput,
      passTwoOutput,
      metrics: {
        ...metrics,
        totalInputTokens:
          metrics.passOneCacheMetrics.inputTokens +
          (metrics.passTwoCacheMetrics?.inputTokens ?? 0),
        totalOutputTokens:
          metrics.passOneCacheMetrics.outputTokens +
          (metrics.passTwoCacheMetrics?.outputTokens ?? 0),
      },
    };
  }

  private buildPassTwoSystem(styleArchive: StyleArchive): TextBlockParam[] {
    return [
      { type: 'text', text: PASS_TWO_INSTRUCTIONS },
      {
        type: 'text',
        text: `<style_archive>\n${styleArchive.content}\n</style_archive>`,
        cache_control: { type: 'ephemeral' },
      },
    ];
  }
}

function extractMetrics(message: { usage: UsageLike }): CacheMetrics {
  return {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: message.usage.cache_read_input_tokens ?? 0,
  };
}

function zeroCacheMetrics(): CacheMetrics {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  };
}
