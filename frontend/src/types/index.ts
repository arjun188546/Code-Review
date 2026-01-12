export interface Review {
  id: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  repositoryId: string;
  status: string;
  overallAssessment: string | null;
  complexityScore: number | null;
  recommendation: string | null;
  analyzedAt: string | null;
  createdAt: string;
  issues: Issue[];
  metrics: Metrics | null;
  repository: Repository;
}

export interface Issue {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'bug' | 'security' | 'performance' | 'quality' | 'style';
  file: string;
  line: number | null;
  description: string;
  suggestion: string | null;
  codeExample: string | null;
  createdAt: string;
}

export interface Metrics {
  id: string;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  analysisTimeMs: number;
  aiTokensUsed: number;
  createdAt: string;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  isActive: boolean;
  webhookId: string | null;
  createdAt: string;
}

export interface Stats {
  totalReviews: number;
  avgComplexity: number;
  criticalIssues: number;
  avgAnalysisTime: number;
  issuesBySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  issuesByType: {
    bug: number;
    security: number;
    performance: number;
    quality: number;
    style: number;
  };
}
