import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';
import type { ProviderInfo } from '~/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';
import { enhanceGamePrompt, PROMPT_ENHANCER_INSTRUCTIONS } from '~/lib/common/prompts/game-prompt-enhancer';

export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

const logger = createScopedLogger('api.enhancer');

// Game detection patterns - same as in game-prompt-enhancer.ts
const GAME_KEYWORDS = [
  'game', 'mario', 'sonic', 'platformer', 'shooter', 'puzzle', 'racing',
  'flappy', 'tetris', 'snake', 'arcade', 'player', 'enemy', 'level',
  'score', 'lives', 'power-up', 'boss', 'sprite', 'phaser', 'kaboom'
];

function isGameRequest(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return GAME_KEYWORDS.some(keyword => normalizedMessage.includes(keyword));
}

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const { message, model, provider } = await request.json<{
    message: string;
    model: string;
    provider: ProviderInfo;
    apiKeys?: Record<string, string>;
  }>();

  const { name: providerName } = provider;

  // validate 'model' and 'provider' fields
  if (!model || typeof model !== 'string') {
    throw new Response('Invalid or missing model', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  if (!providerName || typeof providerName !== 'string') {
    throw new Response('Invalid or missing provider', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  // Check if this is a game request
  const isGame = isGameRequest(message);
  
  // If it's a game request, use the game prompt enhancer directly
  if (isGame) {
    logger.info('🎮 Game request detected - using game-specific enhancement');
    
    try {
      // Use the game prompt enhancer
      const gameEnhancement = enhanceGamePrompt({
        userInput: message,
        preferredEngine: 'phaser' // Default to Phaser 3
      });
      
      // Stream the enhanced game prompt back
      const result = await streamText({
        messages: [
          {
            role: 'assistant',
            content: gameEnhancement.enhancedPrompt
          }
        ],
        env: context.cloudflare?.env as any,
        apiKeys,
        providerSettings,
        options: {
          // Empty system prompt since we're just streaming back the enhanced prompt
          system: ''
        }
      });

      return new Response(result.textStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'X-Enhancement-Type': 'game' // Custom header to indicate game enhancement
        },
      });
    } catch (error) {
      logger.error('Game enhancement error:', error);
      // Fall back to general enhancement if game enhancement fails
    }
  }

  // Use general enhancement for non-game requests
  logger.info('📝 Using general prompt enhancement');
  
  try {
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content:
            `[Model: ${model}]\n\n[Provider: ${providerName}]\n\n` +
            stripIndents`
            You are a professional prompt engineer specializing in crafting precise, effective prompts.
            Your task is to enhance prompts by making them more specific, actionable, and effective.

            I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

            For valid prompts:
            - Make instructions explicit and unambiguous
            - Add relevant context and constraints
            - Remove redundant information
            - Maintain the core intent
            - Ensure the prompt is self-contained
            - Use professional language

            For invalid or unclear prompts:
            - Respond with clear, professional guidance
            - Keep responses concise and actionable
            - Maintain a helpful, constructive tone
            - Focus on what the user should provide
            - Use a standard template for consistency

            IMPORTANT: Your response must ONLY contain the enhanced prompt text.
            Do not include any explanations, metadata, or wrapper tags.

            <original_prompt>
              ${message}
            </original_prompt>
          `,
        },
      ],
      env: context.cloudflare?.env as any,
      apiKeys,
      providerSettings,
      options: {
        system:
          'You are a senior software principal architect, you should help the user analyse the user query and enrich it with the necessary context and constraints to make it more specific, actionable, and effective. You should also ensure that the prompt is self-contained and uses professional language. Your response should ONLY contain the enhanced prompt text. Do not include any explanations, metadata, or wrapper tags.',
      },
    });

    // Handle streaming errors in a non-blocking way
    (async () => {
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'error') {
            const error: any = part.error;
            logger.error('Streaming error:', error);
            break;
          }
        }
      } catch (error) {
        logger.error('Error processing stream:', error);
      }
    })();

    // Return the text stream directly since it's already text data
    return new Response(result.textStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.log(error);

    if (error instanceof Error && error.message?.includes('API key')) {
      throw new Response('Invalid or missing API key', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
