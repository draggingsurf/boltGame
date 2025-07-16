import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';

interface GCPVertexAnthropicConfig {
  projectId: string;
  region?: string;
  serviceAccountKey?: any;
}

export default class GCPVertexAnthropicProvider extends BaseProvider {
  name = 'GCP-Vertex-Anthropic';
  getApiKeyLink = 'https://console.cloud.google.com/apis/credentials';

  config = {
    apiTokenKey: 'GCP_VERTEX_CONFIG',
    baseUrlKey: 'GOOGLE_VERTEX_REGION',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'claude-opus-4@20250514',
      label: 'Claude Opus 4 (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 32000,
    },
    {
      name: 'claude-sonnet-4@20250514',
      label: 'Claude Sonnet 4 (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 32000,
    },
    {
      name: 'claude-3-7-sonnet@20250219',
      label: 'Claude 3.7 Sonnet (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 64000,
    },
    {
      name: 'claude-3-5-sonnet-v2@20241022',
      label: 'Claude 3.5 Sonnet v2 (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-5-haiku@20241022',
      label: 'Claude 3.5 Haiku (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-5-sonnet@20240620',
      label: 'Claude 3.5 Sonnet (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-opus@20240229',
      label: 'Claude 3 Opus (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 4096,
    },
    {
      name: 'claude-3-sonnet@20240229',
      label: 'Claude 3 Sonnet (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 4096,
    },
    {
      name: 'claude-3-haiku@20240307',
      label: 'Claude 3 Haiku (Vertex AI)',
      provider: 'GCP-Vertex-Anthropic',
      maxTokenAllowed: 4096,
    },
  ];

  private _parseAndValidateConfig(configString: string): GCPVertexAnthropicConfig {
    let parsedConfig: GCPVertexAnthropicConfig;

    try {
      parsedConfig = JSON.parse(configString);
    } catch {
      throw new Error(
        'Invalid GCP Vertex AI configuration format. Please provide a valid JSON string containing projectId, and optionally region and serviceAccountKey.',
      );
    }

    const { projectId, region, serviceAccountKey } = parsedConfig;

    if (!projectId) {
      throw new Error(
        'Missing required GCP configuration. Configuration must include projectId.',
      );
    }

    return {
      projectId,
      region: region || 'us-east5',
      ...(serviceAccountKey && { serviceAccountKey }),
    };
  }

  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'GOOGLE_VERTEX_REGION',
      defaultApiTokenKey: 'GCP_VERTEX_CONFIG',
    });

    if (!apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider. Please provide GCP_VERTEX_CONFIG as JSON string with projectId.`);
    }

    const config = this._parseAndValidateConfig(apiKey);

    try {
      // Create Vertex Anthropic client using the official AI SDK provider
      const vertexAnthropicConfig: any = {
        project: config.projectId,
        location: config.region,
      };

      // Add Google Auth options if service account key is provided
      if (config.serviceAccountKey) {
        vertexAnthropicConfig.googleAuthOptions = {
          credentials: config.serviceAccountKey,
        };
      }

      const vertexAnthropic = createVertexAnthropic(vertexAnthropicConfig);

      return vertexAnthropic(model);
    } catch (error) {
      throw new Error(`Failed to initialize ${this.name} provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Additional method to validate configuration
  validateConfig(configString: string): { isValid: boolean; error?: string } {
    try {
      this._parseAndValidateConfig(configString);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid configuration',
      };
    }
  }
} 