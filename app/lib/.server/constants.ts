import { LLMManager } from '~/lib/modules/llm/manager';

const llmManager = LLMManager.getInstance();
export const DEFAULT_MODEL = 'claude-opus-4@20250514';

export const PROVIDER_LIST = llmManager.getAllProviders();

export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// Create client-safe provider data (without server-side methods)
export const getClientSafeProviders = () => {
  return PROVIDER_LIST.map(provider => ({
    name: provider.name,
    staticModels: provider.staticModels,
    getApiKeyLink: provider.getApiKeyLink,
    labelForGetApiKey: provider.labelForGetApiKey,
    icon: provider.icon,
    config: {
      baseUrlKey: provider.config?.baseUrlKey,
      apiTokenKey: provider.config?.apiTokenKey,
    },
  }));
}; 