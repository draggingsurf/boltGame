import { useEffect, useState } from 'react';
import { initializeProviders } from '~/lib/stores/settings';

interface ClientSafeProvider {
  name: string;
  staticModels: Array<{
    name: string;
    label: string;
    provider: string;
    maxTokenAllowed: number;
  }>;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
  icon?: string;
  config: {
    baseUrlKey?: string;
    apiTokenKey?: string;
  };
}

interface ProvidersData {
  providers: ClientSafeProvider[];
  defaultProvider: string;
  providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }>;
}

export function useProviders() {
  const [data, setData] = useState<ProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/api/providers')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        return response.json();
      })
      .then((rawData) => {
        const data = rawData as ProvidersData;
        setData(data);
        
        // Initialize the settings store with provider data
        if (data.providers) {
          initializeProviders(data.providers);
        }
        
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return {
    providers: data?.providers || [],
    defaultProvider: data?.defaultProvider || 'GCP-Vertex-Anthropic',
    providerBaseUrlEnvKeys: data?.providerBaseUrlEnvKeys || {},
    loading,
    error,
  };
} 