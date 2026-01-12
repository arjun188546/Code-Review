export interface AnalysisResult {
  overall_assessment: string;
  complexity_score: number;
  issues: Issue[];
  positive_points: string[];
  recommendation: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
}

export interface Issue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'bug' | 'security' | 'performance' | 'quality' | 'style';
  file: string;
  line?: number;
  description: string;
  suggestion?: string;
  code_example?: string;
}

export interface WebhookPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
  };
  repository: {
    name: string;
    owner: {
      login: string;
    };
  };
}

export interface QueueJob {
  owner: string;
  repo: string;
  prNumber: number;
}
