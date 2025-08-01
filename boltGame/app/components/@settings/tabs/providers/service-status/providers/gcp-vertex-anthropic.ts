import { BaseProviderChecker } from '~/components/@settings/tabs/providers/service-status/base-provider';
import type { StatusCheckResult } from '~/components/@settings/tabs/providers/service-status/types';

export class GCPVertexAnthropicStatusChecker extends BaseProviderChecker {
  async checkStatus(): Promise<StatusCheckResult> {
    try {
      // Check Google Cloud status page for Vertex AI
      const statusPageResponse = await fetch('https://status.cloud.google.com/');
      const text = await statusPageResponse.text();

      // Check for Vertex AI specific issues
      const hasVertexAIIssues =
        text.includes('Vertex AI') &&
        (text.includes('Incident') ||
          text.includes('Disruption') ||
          text.includes('Outage') ||
          text.includes('degraded'));

      // Check for general Google Cloud issues
      const hasGeneralIssues = 
        text.includes('Major Incidents') || 
        text.includes('Service Disruption') ||
        text.includes('Partial outage');

      // Check for Anthropic model availability on Vertex AI
      const hasAnthropicIssues = 
        text.includes('Claude') || 
        (text.includes('Anthropic') && 
         (text.includes('Incident') || text.includes('Disruption')));

      // Extract incidents related to Vertex AI
      const incidents: string[] = [];
      const incidentMatches = text.matchAll(/(\d{4}-\d{2}-\d{2})\s+(.*?)\s+Impact:(.*?)(?=\n|$)/g);

      for (const match of incidentMatches) {
        const [, date, title, impact] = match;

        if (title.includes('Vertex AI') || 
            title.includes('Claude') || 
            title.includes('Anthropic') ||
            (title.includes('Cloud') && impact.includes('High'))) {
          incidents.push(`${date}: ${title.trim()} - Impact: ${impact.trim()}`);
        }
      }

      let status: StatusCheckResult['status'] = 'operational';
      let message = 'Vertex AI and Anthropic models operational';

      if (hasVertexAIIssues || hasAnthropicIssues) {
        status = 'degraded';
        message = 'Vertex AI or Anthropic model issues reported';
      } else if (hasGeneralIssues) {
        status = 'degraded';
        message = 'Google Cloud experiencing general issues';
      }

      return {
        status,
        message,
        incidents: incidents.length > 0 ? incidents : [],
      };
    } catch (error) {
      console.error('Error checking GCP Vertex AI status:', error);
      
      return {
        status: 'down',
        message: 'Unable to check Vertex AI status',
        incidents: [],
      };
    }
  }
} 