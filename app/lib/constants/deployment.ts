// Deployment configuration constants
export const DEPLOYMENT_CONFIG = {
  // Custom domain for deployments
  CUSTOM_DOMAIN: 'gameterminal.io',
  
  // Project naming convention
  PROJECT_PREFIX: 'code-zero',
  
  // Default subdomain pattern for multi-tenant deployments
  SUBDOMAIN_PATTERN: '{projectName}',
  
  // Fallback to Vercel domains if custom domain fails
  FALLBACK_TO_VERCEL: true,
} as const;

// Helper function to generate project name
export const generateProjectName = (chatId: string): string => {
  return `${DEPLOYMENT_CONFIG.PROJECT_PREFIX}-${chatId}-${Date.now()}`;
};

// Helper function to generate custom domain URL
export const generateCustomDomainUrl = (projectName: string): string => {
  return `${projectName}.${DEPLOYMENT_CONFIG.CUSTOM_DOMAIN}`;
}; 