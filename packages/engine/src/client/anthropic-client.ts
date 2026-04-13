import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import type { EngineClientConfig, CacheMetrics } from './types.js';
import { DEFAULT_MODEL } from './types.js';

type TextBlockParam = Anthropic.Messages.TextBlockParam;
type MessageParam = Anthropic.Messages.MessageParam;
type Message = Anthropic.Messages.Message;

export interface GenerateOptions {
  system: TextBlockParam[];
  messages: MessageParam[];
  maxTokens?: number;
  model?: string;
}

export interface StreamCallbacks {
  onText?: (delta: string, snapshot: string) => void;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

/**
 * Wraps the Anthropic SDK with:
 * - dangerouslyAllowBrowser for PWA context
 * - Cache metrics extraction from every response
 * - Both streaming and non-streaming generation
 */
export class AdventClient {
  private client: Anthropic;
  private defaultModel: string;
  private onCacheMetrics?: (metrics: CacheMetrics) => void;

  constructor(config: EngineClientConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      maxRetries: config.maxRetries ?? 2,
      dangerouslyAllowBrowser: true,
    });
    this.defaultModel = config.model ?? DEFAULT_MODEL;
    this.onCacheMetrics = config.onCacheMetrics;
  }

  async generate(options: GenerateOptions): Promise<Message> {
    const response = await this.client.messages.create({
      model: options.model ?? this.defaultModel,
      max_tokens: options.maxTokens ?? 4096,
      system: options.system,
      messages: options.messages,
    });

    this.reportMetrics(response);
    return response;
  }

  stream(
    options: GenerateOptions,
    callbacks: StreamCallbacks = {},
  ): MessageStream {
    const stream = this.client.messages.stream({
      model: options.model ?? this.defaultModel,
      max_tokens: options.maxTokens ?? 4096,
      system: options.system,
      messages: options.messages,
    });

    if (callbacks.onText) {
      stream.on('text', callbacks.onText);
    }

    if (callbacks.onError) {
      stream.on('error', callbacks.onError);
    }

    stream.on('finalMessage', (message) => {
      this.reportMetrics(message);
      callbacks.onMessage?.(message);
    });

    return stream;
  }

  /** Extract text content from a Message response. */
  static extractText(message: Message): string {
    return message.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  private reportMetrics(message: Message): void {
    if (!this.onCacheMetrics) return;

    const { usage } = message;
    this.onCacheMetrics({
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
    });
  }
}
