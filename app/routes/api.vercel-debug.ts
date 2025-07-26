import { type LoaderFunctionArgs, json } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const deploymentId = url.searchParams.get('deploymentId');
  const token = url.searchParams.get('token');

  if (!token) {
    return json({ error: 'Missing token' }, { status: 400 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    projectId,
    deploymentId,
  };

  try {
    // Check project if projectId provided
    if (projectId) {
      try {
        const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (projectResponse.ok) {
          const projectData = (await projectResponse.json()) as any;
          results.project = {
            id: projectData.id,
            name: projectData.name,
            status: 'found',
            targets: projectData.targets,
          };

          // Get project deployments
          const deploymentsResponse = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (deploymentsResponse.ok) {
            const deploymentsData = (await deploymentsResponse.json()) as any;
            results.project.recentDeployments = deploymentsData.deployments?.map((d: any) => ({
              id: d.id,
              url: d.url,
              state: d.state,
              readyState: d.readyState,
              created: d.created,
            }));
          }

          // Get project domains
          const domainsResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (domainsResponse.ok) {
            const domainsData = (await domainsResponse.json()) as any;
            results.project.domains = domainsData.domains;
          }
        } else {
          results.project = {
            status: 'not_found',
            httpStatus: projectResponse.status,
          };
        }
      } catch (err) {
        results.project = {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }

    // Check deployment if deploymentId provided
    if (deploymentId) {
      try {
        const deploymentResponse = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (deploymentResponse.ok) {
          const deploymentData = (await deploymentResponse.json()) as any;
          results.deployment = {
            id: deploymentData.id,
            url: deploymentData.url,
            state: deploymentData.state,
            readyState: deploymentData.readyState,
            status: 'found',
            created: deploymentData.created,
          };
        } else {
          const errorData = (await deploymentResponse.json().catch(() => ({}))) as any;
          results.deployment = {
            status: 'not_found',
            httpStatus: deploymentResponse.status,
            error: errorData,
          };
        }
      } catch (err) {
        results.deployment = {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }

    return json(results);
  } catch (error) {
    return json({
      error: 'Debug request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 