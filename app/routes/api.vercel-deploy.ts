import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import type { VercelProjectInfo } from '~/types/vercel';
import { DEPLOYMENT_CONFIG, generateCustomDomainUrl, generateProjectName } from '~/lib/constants/deployment';

// Function to detect framework from project files
const detectFramework = (files: Record<string, string>): string => {
  // Check for package.json first
  const packageJson = files['package.json'];

  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

      // Check for specific frameworks
      if (dependencies.next) {
        return 'nextjs';
      }

      if (dependencies.react && dependencies['@remix-run/react']) {
        return 'remix';
      }

      if (dependencies.react && dependencies.vite) {
        return 'vite';
      }

      if (dependencies.react && dependencies['@vitejs/plugin-react']) {
        return 'vite';
      }

      if (dependencies.react && dependencies['@nuxt/react']) {
        return 'nuxt';
      }

      if (dependencies.react && dependencies['@qwik-city/qwik']) {
        return 'qwik';
      }

      if (dependencies.react && dependencies['@sveltejs/kit']) {
        return 'sveltekit';
      }

      if (dependencies.react && dependencies.astro) {
        return 'astro';
      }

      if (dependencies.react && dependencies['@angular/core']) {
        return 'angular';
      }

      if (dependencies.react && dependencies.vue) {
        return 'vue';
      }

      if (dependencies.react && dependencies['@expo/react-native']) {
        return 'expo';
      }

      if (dependencies.react && dependencies['react-native']) {
        return 'react-native';
      }

      // Generic React app
      if (dependencies.react) {
        return 'react';
      }

      // Check for other frameworks
      if (dependencies['@angular/core']) {
        return 'angular';
      }

      if (dependencies.vue) {
        return 'vue';
      }

      if (dependencies['@sveltejs/kit']) {
        return 'sveltekit';
      }

      if (dependencies.astro) {
        return 'astro';
      }

      if (dependencies['@nuxt/core']) {
        return 'nuxt';
      }

      if (dependencies['@qwik-city/qwik']) {
        return 'qwik';
      }

      if (dependencies['@expo/react-native']) {
        return 'expo';
      }

      if (dependencies['react-native']) {
        return 'react-native';
      }

      // Check for build tools
      if (dependencies.vite) {
        return 'vite';
      }

      if (dependencies.webpack) {
        return 'webpack';
      }

      if (dependencies.parcel) {
        return 'parcel';
      }

      if (dependencies.rollup) {
        return 'rollup';
      }

      // Default to Node.js if package.json exists
      return 'nodejs';
    } catch (error) {
      console.error('Error parsing package.json:', error);
    }
  }

  // Check for other framework indicators
  if (files['next.config.js'] || files['next.config.ts']) {
    return 'nextjs';
  }

  if (files['remix.config.js'] || files['remix.config.ts']) {
    return 'remix';
  }

  if (files['vite.config.js'] || files['vite.config.ts']) {
    return 'vite';
  }

  if (files['nuxt.config.js'] || files['nuxt.config.ts']) {
    return 'nuxt';
  }

  if (files['svelte.config.js'] || files['svelte.config.ts']) {
    return 'sveltekit';
  }

  if (files['astro.config.js'] || files['astro.config.ts']) {
    return 'astro';
  }

  if (files['angular.json']) {
    return 'angular';
  }

  if (files['vue.config.js'] || files['vue.config.ts']) {
    return 'vue';
  }

  if (files['app.json'] && files['app.json'].includes('expo')) {
    return 'expo';
  }

  if (files['app.json'] && files['app.json'].includes('react-native')) {
    return 'react-native';
  }

  // Check for static site indicators
  if (files['index.html']) {
    return 'static';
  }

  // Default to unknown
  return 'other';
};

// Helper function to add custom domain to Vercel project
const addCustomDomainToProject = async (projectId: string, domain: string, token: string) => {
  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn(`Failed to add custom domain ${domain}:`, errorData);
      // Don't throw error, deployment can continue with default domain
      return false;
    }

    console.log(`Successfully added custom domain: ${domain}`);
    return true;
  } catch (error) {
    console.warn(`Error adding custom domain ${domain}:`, error);
    return false;
  }
};

// Helper function to get existing domains for a project
const getProjectDomains = async (projectId: string, token: string) => {
  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch project domains');
      return [];
    }

    const data = (await response.json()) as any;
    return data.domains || [];
  } catch (error) {
    console.warn('Error fetching project domains:', error);
    return [];
  }
};

interface DeployRequestBody {
  projectId?: string;
  files: Record<string, string>;
  sourceFiles?: Record<string, string>;
  chatId: string;
  framework?: string;
}

// Add loader function to handle GET requests
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const token = url.searchParams.get('token');

  if (!projectId || !token) {
    return json({ error: 'Missing projectId or token' }, { status: 400 });
  }

  try {
    // Get project info
    const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!projectResponse.ok) {
      return json({ error: 'Failed to fetch project' }, { status: 400 });
    }

    const projectData = (await projectResponse.json()) as any;

    // Get latest deployment
    const deploymentsResponse = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!deploymentsResponse.ok) {
      return json({ error: 'Failed to fetch deployments' }, { status: 400 });
    }

    const deploymentsData = (await deploymentsResponse.json()) as any;

    const latestDeployment = deploymentsData.deployments?.[0];

    return json({
      project: {
        id: projectData.id,
        name: projectData.name,
        url: `https://${projectData.name}.vercel.app`,
      },
      deploy: latestDeployment
        ? {
            id: latestDeployment.id,
            state: latestDeployment.state,
            url: latestDeployment.url ? `https://${latestDeployment.url}` : `https://${projectData.name}.vercel.app`,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching Vercel deployment:', error);
    return json({ error: 'Failed to fetch deployment' }, { status: 500 });
  }
}

// Existing action function for POST requests
export async function action({ request }: ActionFunctionArgs) {
  try {
    const { projectId, files, sourceFiles, token, chatId, framework, customDomain } = (await request.json()) as DeployRequestBody & {
      token: string;
      customDomain?: string;
    };

    if (!token) {
      return json({ error: 'Not connected to Vercel' }, { status: 401 });
    }

    let targetProjectId = projectId;
    let projectInfo: VercelProjectInfo | undefined;
    const useCustomDomain = customDomain || DEPLOYMENT_CONFIG.CUSTOM_DOMAIN;

    // Detect framework from the source files if not provided
    let detectedFramework = framework;

    if (!detectedFramework && sourceFiles) {
      detectedFramework = detectFramework(sourceFiles);
      console.log('Detected framework from source files:', detectedFramework);
    }

    // If no projectId provided, create a new project
    if (!targetProjectId) {
      const projectName = generateProjectName(chatId);
      const fullCustomDomain = generateCustomDomainUrl(projectName);
      
      const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          framework: detectedFramework || null,
        }),
      });

      if (!createProjectResponse.ok) {
        const errorData = (await createProjectResponse.json()) as any;
        return json(
          { error: `Failed to create project: ${errorData.error?.message || 'Unknown error'}` },
          { status: 400 },
        );
      }

      const newProject = (await createProjectResponse.json()) as any;
      targetProjectId = newProject.id;
      
      // Add custom domain to the project
      await addCustomDomainToProject(targetProjectId!, fullCustomDomain, token);
      
      projectInfo = {
        id: newProject.id,
        name: newProject.name,
        url: `https://${fullCustomDomain}`,
        chatId,
      };
    } else {
      // Get existing project info
      const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${targetProjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (projectResponse.ok) {
        const existingProject = (await projectResponse.json()) as any;
        
        // Check if project already has custom domain, if not add it
        const fullCustomDomain = generateCustomDomainUrl(existingProject.name);
        
        // Get existing domains for the project
        const existingDomains = await getProjectDomains(targetProjectId!, token);
        const hasCustomDomain = existingDomains.some((domain: any) => domain.name === fullCustomDomain);
        
        if (!hasCustomDomain) {
          await addCustomDomainToProject(targetProjectId!, fullCustomDomain, token);
        }
        
        projectInfo = {
          id: existingProject.id,
          name: existingProject.name,
          url: `https://${fullCustomDomain}`,
          chatId,
        };
      } else {
        // If project doesn't exist, create a new one
        const projectName = generateProjectName(chatId);
        const fullCustomDomain = generateCustomDomainUrl(projectName);
        
        const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            framework: detectedFramework || null,
          }),
        });

        if (!createProjectResponse.ok) {
          const errorData = (await createProjectResponse.json()) as any;
          return json(
            { error: `Failed to create project: ${errorData.error?.message || 'Unknown error'}` },
            { status: 400 },
          );
        }

        const newProject = (await createProjectResponse.json()) as any;
        targetProjectId = newProject.id;
        
        // Add custom domain to the project
        await addCustomDomainToProject(targetProjectId!, fullCustomDomain, token);
        
        projectInfo = {
          id: newProject.id,
          name: newProject.name,
          url: `https://${fullCustomDomain}`,
          chatId,
        };
      }
    }

    // Prepare files for deployment
    const deploymentFiles = [];

    /*
     * For frameworks that need to build on Vercel, include source files
     * For static sites, only include build output
     */
    const shouldIncludeSourceFiles =
      detectedFramework &&
      ['nextjs', 'react', 'vite', 'remix', 'nuxt', 'sveltekit', 'astro', 'vue', 'angular'].includes(detectedFramework);

    if (shouldIncludeSourceFiles && sourceFiles) {
      // Include source files for frameworks that need to build
      for (const [filePath, content] of Object.entries(sourceFiles)) {
        // Ensure file path doesn't start with a slash for Vercel
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        deploymentFiles.push({
          file: normalizedPath,
          data: content,
        });
      }
    } else {
      // For static sites, only include build output
      for (const [filePath, content] of Object.entries(files)) {
        // Ensure file path doesn't start with a slash for Vercel
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        deploymentFiles.push({
          file: normalizedPath,
          data: content,
        });
      }
    }

    // Create deployment configuration based on framework
    const deploymentConfig: any = {
      name: projectInfo.name,
      project: targetProjectId,
      target: 'production',
      files: deploymentFiles,
      // Add custom domain configuration
      alias: [generateCustomDomainUrl(projectInfo.name)]
    };

    // Add framework-specific configuration
    if (detectedFramework === 'nextjs') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = '.next';
    } else if (detectedFramework === 'react' || detectedFramework === 'vite') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else if (detectedFramework === 'remix') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'public';
    } else if (detectedFramework === 'nuxt') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = '.output';
    } else if (detectedFramework === 'sveltekit') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'build';
    } else if (detectedFramework === 'astro') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else if (detectedFramework === 'vue') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else if (detectedFramework === 'angular') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else {
      // For static sites, no build command needed
      deploymentConfig.routes = [{ src: '/(.*)', dest: '/$1' }];
    }

    // Create a new deployment
    const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentConfig),
    });

    if (!deployResponse.ok) {
      const errorData = (await deployResponse.json()) as any;
      return json(
        { error: `Failed to create deployment: ${errorData.error?.message || 'Unknown error'}` },
        { status: 400 },
      );
    }

    const deployData = (await deployResponse.json()) as any;

    // Validate deployment creation response
    if (!deployData.id) {
      console.error('Invalid deployment response - missing deployment ID:', deployData);
      return json({ error: 'Invalid deployment response - missing deployment ID' }, { status: 500 });
    }

    console.log(`Deployment created with ID: ${deployData.id}`);

    // Poll for deployment status with improved error handling
    let retryCount = 0;
    const maxRetries = 60;
    let deploymentUrl = '';
    let deploymentState = '';
    let lastError = '';

    while (retryCount < maxRetries) {
      try {
      const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deployData.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statusResponse.ok) {
        const status = (await statusResponse.json()) as any;
        deploymentState = status.readyState;
        deploymentUrl = status.url ? `https://${status.url}` : '';

          console.log(`Deployment ${deployData.id} status: ${deploymentState}`);

        if (status.readyState === 'READY' || status.readyState === 'ERROR') {
          break;
        }
        } else {
          // Handle specific error cases
          const errorData = (await statusResponse.json().catch(() => ({}))) as any;
          lastError = `HTTP ${statusResponse.status}: ${errorData.error?.code || errorData.error?.message || 'Unknown error'}`;
          
          console.warn(`Deployment status check failed (attempt ${retryCount + 1}):`, lastError);
          
          // If it's a NOT_FOUND error and we're early in the process, the deployment might still be initializing
          if (statusResponse.status === 404 && retryCount < 10) {
            console.log('Deployment not found yet, continuing to poll...');
          } else if (statusResponse.status === 404) {
            // If deployment is still not found after several attempts, something is wrong
            console.error('Deployment not found after multiple attempts, aborting');
            break;
          } else if (statusResponse.status >= 500) {
            // Server errors - continue retrying
            console.log('Server error, retrying...');
          } else {
            // Client errors (400-499) except 404 - stop retrying
            console.error('Client error, stopping retry attempts');
            break;
          }
        }
      } catch (fetchError) {
        lastError = `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`;
        console.warn(`Network error during status check (attempt ${retryCount + 1}):`, lastError);
      }

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Handle deployment completion or failure
    if (deploymentState === 'ERROR') {
      return json({ error: 'Deployment failed during build/deployment process' }, { status: 500 });
    }

    if (retryCount >= maxRetries) {
      const timeoutError = lastError ? 
        `Deployment timed out. Last error: ${lastError}` : 
        'Deployment timed out after 2 minutes';
      return json({ error: timeoutError }, { status: 500 });
    }

    // If we don't have a deployment state but we're here, assume success
    if (!deploymentState) {
      console.warn('Deployment state unknown, but no errors detected. Assuming success.');
      deploymentState = 'READY';
    }

    // Determine final URL - prefer custom domain, fallback to deployment URL
    const finalUrl = projectInfo?.url || deploymentUrl || `https://${deployData.url || 'unknown'}`;

    return json({
      success: true,
      deploy: {
        id: deployData.id,
        state: deploymentState,
        url: finalUrl,
      },
      project: projectInfo,
    });
  } catch (error) {
    console.error('Vercel deploy error:', error);
    return json({ error: 'Deployment failed' }, { status: 500 });
  }
}
