import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { vercelConnection } from '~/lib/stores/vercel';
import { workbenchStore } from '~/lib/stores/workbench';
import { webcontainer } from '~/lib/webcontainer';
import { path } from '~/utils/path';
import { useState } from 'react';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import { chatId } from '~/lib/persistence/useChatHistory';
import { DEPLOYMENT_CONFIG } from '~/lib/constants/deployment';

export function useVercelDeploy() {
  const [isDeploying, setIsDeploying] = useState(false);
  const vercelConn = useStore(vercelConnection);
  const currentChatId = useStore(chatId);

  const handleVercelDeploy = async () => {
    if (!vercelConn.user || !vercelConn.token) {
      toast.error('Please connect to Vercel first in the settings tab!');
      return false;
    }

    if (!currentChatId) {
      toast.error('No active chat found');
      return false;
    }

    try {
      setIsDeploying(true);

      const artifact = workbenchStore.firstArtifact;

      if (!artifact) {
        throw new Error('No active project found');
      }

      // Create a deployment artifact for visual feedback
      const deploymentId = `deploy-vercel-project`;
      workbenchStore.addArtifact({
        id: deploymentId,
        messageId: deploymentId,
        title: 'Vercel Deployment',
        type: 'standalone',
      });

      const deployArtifact = workbenchStore.artifacts.get()[deploymentId];

      // Notify that build is starting
      deployArtifact.runner.handleDeployAction('building', 'running', { source: 'vercel' });

      const actionId = 'build-' + Date.now();
      const actionData: ActionCallbackData = {
        messageId: 'vercel build',
        artifactId: artifact.id,
        actionId,
        action: {
          type: 'build' as const,
          content: 'npm run build',
        },
      };

      // Add the action first
      artifact.runner.addAction(actionData);

      // Then run it
      await artifact.runner.runAction(actionData);

      if (!artifact.runner.buildOutput) {
        // Notify that build failed
        deployArtifact.runner.handleDeployAction('building', 'failed', {
          error: 'Build failed. Check the terminal for details.',
          source: 'vercel',
        });
        throw new Error('Build failed');
      }

      // Notify that build succeeded and deployment is starting
      deployArtifact.runner.handleDeployAction('deploying', 'running', { source: 'vercel' });

      // Get the build files
      const container = await webcontainer;

      // Remove /home/project from buildPath if it exists
      const buildPath = artifact.runner.buildOutput.path.replace('/home/project', '');

      // Check if the build path exists
      let finalBuildPath = buildPath;

      // List of common output directories to check if the specified build path doesn't exist
      const commonOutputDirs = [buildPath, '/dist', '/build', '/out', '/output', '/.next', '/public'];

      // Verify the build path exists, or try to find an alternative
      let buildPathExists = false;

      for (const dir of commonOutputDirs) {
        try {
          await container.fs.readdir(dir);
          finalBuildPath = dir;
          buildPathExists = true;
          break;
        } catch {
          // Directory doesn't exist, expected — just skip it
          continue;
        }
      }

      if (!buildPathExists) {
        throw new Error('Could not find build output directory. Please check your build configuration.');
      }

      // Get all files recursively
      async function getAllFiles(dirPath: string): Promise<Record<string, string>> {
        const files: Record<string, string> = {};
        const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isFile()) {
            const content = await container.fs.readFile(fullPath, 'utf-8');

            // Remove build path prefix from the path
            const deployPath = fullPath.replace(finalBuildPath, '');
            files[deployPath] = content;
          } else if (entry.isDirectory()) {
            const subFiles = await getAllFiles(fullPath);
            Object.assign(files, subFiles);
          }
        }

        return files;
      }

      const fileContents = await getAllFiles(finalBuildPath);

      // Get all source project files for framework detection
      const allProjectFiles: Record<string, string> = {};

      async function getAllProjectFiles(dirPath: string): Promise<void> {
        const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isFile()) {
            try {
              const content = await container.fs.readFile(fullPath, 'utf-8');

              // Store with relative path from project root
              let relativePath = fullPath;

              if (fullPath.startsWith('/home/project/')) {
                relativePath = fullPath.replace('/home/project/', '');
              } else if (fullPath.startsWith('./')) {
                relativePath = fullPath.replace('./', '');
              }

              allProjectFiles[relativePath] = content;
            } catch (error) {
              // Skip binary files or files that can't be read as text
              console.log(`Skipping file ${entry.name}: ${error}`);
            }
          } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await getAllProjectFiles(fullPath);
          }
        }
      }

      // Try to read from the current directory first
      try {
        await getAllProjectFiles('.');
      } catch {
        // Fallback to /home/project if current directory doesn't work
        await getAllProjectFiles('/home/project');
      }

      // Use chatId instead of artifact.id
      const existingProjectId = localStorage.getItem(`vercel-project-${currentChatId}`);

      const response = await fetch('/api/vercel-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: existingProjectId || undefined,
          files: fileContents,
          sourceFiles: allProjectFiles,
          token: vercelConn.token,
          chatId: currentChatId,
          customDomain: DEPLOYMENT_CONFIG.CUSTOM_DOMAIN, // Use constant instead of hardcoded
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        console.error('Deployment API error:', data);
        
        // Provide specific error messages based on the error type
        let errorMessage = 'Deployment failed';
        if (data.error) {
          if (data.error.includes('DEPLOYMENT_NOT_FOUND')) {
            errorMessage = 'Deployment not found. This may be a temporary issue - please try again.';
          } else if (data.error.includes('timed out')) {
            errorMessage = 'Deployment timed out. The project may still be deploying in the background.';
          } else if (data.error.includes('Invalid deployment response')) {
            errorMessage = 'Deployment creation failed. Please check your Vercel account and try again.';
          } else {
            errorMessage = `Deployment failed: ${data.error}`;
          }
        }

        // Notify that deployment failed
        deployArtifact.runner.handleDeployAction('deploying', 'failed', {
          error: errorMessage,
          source: 'vercel',
        });
        throw new Error(errorMessage);
      }

      if (!data.deploy || !data.project) {
        console.error('Invalid deploy response structure:', data);

        // Notify that deployment failed
        deployArtifact.runner.handleDeployAction('deploying', 'failed', {
          error: 'Invalid deployment response - missing required data',
          source: 'vercel',
        });
        throw new Error('Invalid deployment response - missing required data');
      }

      if (data.project) {
        localStorage.setItem(`vercel-project-${currentChatId}`, data.project.id);
      }

      // Notify that deployment completed successfully
      deployArtifact.runner.handleDeployAction('complete', 'complete', {
        url: data.deploy.url,
        source: 'vercel',
      });

      return true;
    } catch (err) {
      console.error('Vercel deploy error:', err);
      toast.error(err instanceof Error ? err.message : 'Vercel deployment failed');

      return false;
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    isDeploying,
    handleVercelDeploy,
    isConnected: !!vercelConn.user,
  };
}
