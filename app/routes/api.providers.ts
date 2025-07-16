import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getClientSafeProviders, DEFAULT_PROVIDER, providerBaseUrlEnvKeys } from '~/lib/.server/constants';

export async function loader({ request }: ActionFunctionArgs) {
  const providers = getClientSafeProviders();
  
  return Response.json({
    providers,
    defaultProvider: DEFAULT_PROVIDER?.name || 'Anthropic',
    providerBaseUrlEnvKeys,
  });
} 