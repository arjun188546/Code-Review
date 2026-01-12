import { GitHubService } from './github.service';
import { AIService } from './ai.service';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { AnalysisResult } from '../types';

export class AnalysisService {
  constructor(
    private github: GitHubService,
    private ai: AIService,
    private convex: ConvexHttpClient
  ) { }

  async analyzePullRequest(owner: string, repo: string, prNumber: number) {
    const startTime = Date.now();

    // Get or create repository
    const repository = await this.convex.mutation(api.repositories.createOrGetRepository, {
      userId: 'default', // TODO: Get from auth
      name: repo,
      owner,
      fullName: `${owner}/${repo}`,
    });

    // Create review
    const review = await this.convex.mutation(api.reviews.createReview, {
      userId: 'default', // TODO: Get from auth
      repositoryId: repository._id,
      prNumber,
      prTitle: 'Analyzing...',
      prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
      status: 'analyzing',
    });

    try {
      // Get PR details
      const pr = await this.github.getPullRequest(owner, repo, prNumber);
      const diff = await this.github.getDiff(owner, repo, prNumber);
      const files = await this.github.getFiles(owner, repo, prNumber);

      // Detect primary language
      const language = this.detectLanguage(files);

      // Chunk diff if too large (max 3000 tokens ≈ 12000 chars)
      const chunks = this.chunkDiff(diff, 12000);
      const analyses = await Promise.all(
        chunks.map((chunk) => this.ai.analyzeCode(`${owner}/${repo}`, pr.title, chunk, language))
      );

      // Merge analyses
      const merged = this.mergeAnalyses(analyses);

      // Update review in database
      await this.convex.mutation(api.reviews.updateReview, {
        reviewId: review._id,
        status: 'completed',
        prTitle: pr.title,
        overallAssessment: merged.overall_assessment,
        complexityScore: merged.complexity_score,
        recommendation: merged.recommendation,
      });

      // Add issues
      await this.convex.mutation(api.reviews.addIssues, {
        reviewId: review._id,
        issues: merged.issues.map((issue) => ({
          severity: issue.severity,
          type: issue.type,
          file: issue.file,
          line: issue.line,
          description: issue.description,
          suggestion: issue.suggestion,
          codeExample: issue.code_example,
        })),
      });

      // Add metrics
      await this.convex.mutation(api.reviews.createMetrics, {
        reviewId: review._id,
        filesChanged: files.length,
        linesAdded: pr.additions,
        linesDeleted: pr.deletions,
        analysisTimeMs: Date.now() - startTime,
        aiTokensUsed: this.estimateTokens(diff),
      });

      // Post review to GitHub
      await this.postReviewToGitHub(owner, repo, prNumber, merged);

      return review._id;
    } catch (error) {
      // Update status to failed
      await this.convex.mutation(api.reviews.updateReview, {
        reviewId: review._id,
        status: 'failed',
      });
      throw error;
    }
  }

  async analyzeFullRepository(owner: string, repo: string, aiProvider: 'openai' | 'claude' | 'gemini') {
    const startTime = Date.now();

    // Get or create repository
    const repository = await this.convex.mutation(api.repositories.createOrGetRepository, {
      userId: 'default', // TODO: Get from auth
      name: repo,
      owner,
      fullName: `${owner}/${repo}`,
    });

    // Create analysis record (using new Convex function we'll create)
    const analysis = await this.convex.mutation(api.repositoryAnalyses.createAnalysis, {
      userId: 'default',
      repositoryId: repository._id,
      aiProvider,
      status: 'analyzing',
    });

    try {
      console.log(`[Analysis ${analysis._id}] Starting analysis for ${owner}/${repo}`);

      // Get default branch
      const defaultBranch = await this.github.getDefaultBranch(owner, repo);
      console.log(`[Analysis ${analysis._id}] Default branch: ${defaultBranch}`);

      // Get repository file tree
      const tree = await this.github.getRepositoryTree(owner, repo, defaultBranch);
      console.log(`[Analysis ${analysis._id}] Total items in tree: ${tree.length}`);

      // Filter code files
      const codeFiles = this.filterCodeFiles(tree);
      console.log(`[Analysis ${analysis._id}] Code files after filtering: ${codeFiles.length}`);

      if (codeFiles.length === 0) {
        console.warn(`[Analysis ${analysis._id}] No code files found to analyze`);
        await this.convex.mutation(api.repositoryAnalyses.updateAnalysis, {
          analysisId: analysis._id,
          status: 'completed',
          totalFiles: 0,
          filesAnalyzed: 0,
          totalIssues: 0,
          criticalIssues: 0,
          highIssues: 0,
          mediumIssues: 0,
          lowIssues: 0,
          overallScore: 100,
          summary: 'No code files found to analyze in this repository.',
          recommendations: ['Add code files to enable analysis'],
          analyzedAt: Date.now(),
        });
        return analysis._id;
      }

      // Update total files count
      await this.convex.mutation(api.repositoryAnalyses.updateAnalysis, {
        analysisId: analysis._id,
        totalFiles: codeFiles.length,
        filesAnalyzed: 0,
      });

      // Chunk files into batches
      const batches = this.chunkFiles(codeFiles, 10);
      const allIssues: any[] = [];
      let filesAnalyzed = 0;

      console.log(`[Analysis ${analysis._id}] Processing ${batches.length} batches`);

      // Analyze each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`[Analysis ${analysis._id}] Processing batch ${i + 1}/${batches.length} (${batch.length} files)`);

        // Fetch file contents
        const fileContents = await Promise.all(
          batch.map(async (file: any) => {
            try {
              const content = await this.github.getFileContent(owner, repo, file.path);
              console.log(`[Analysis ${analysis._id}] Fetched ${file.path} (${content.length} chars)`);
              return { path: file.path, content };
            } catch (error: any) {
              console.error(`[Analysis ${analysis._id}] Failed to fetch ${file.path}:`, error.message);
              return null;
            }
          })
        );

        // Filter out failed fetches
        const validFiles = fileContents.filter((f) => f !== null);
        console.log(`[Analysis ${analysis._id}] Valid files in batch: ${validFiles.length}/${batch.length}`);

        if (validFiles.length === 0) {
          console.warn(`[Analysis ${analysis._id}] No valid files in batch ${i + 1}, skipping`);
          continue;
        }

        // Create combined content for analysis
        const combinedContent = validFiles
          .map((f) => `// File: ${f!.path}\n${f!.content}\n\n`)
          .join('---\n\n');

        console.log(`[Analysis ${analysis._id}] Analyzing batch with ${combinedContent.length} chars`);

        // Analyze with AI - pass the selected provider
        const result = await this.ai.analyzeCode(
          `${owner}/${repo}`,
          'Full Repository Analysis',
          combinedContent,
          'Multiple',
          aiProvider
        );

        console.log(`[Analysis ${analysis._id}] AI found ${result.issues.length} issues in batch`);

        allIssues.push(...result.issues);
        filesAnalyzed += validFiles.length;

        // Update progress
        await this.convex.mutation(api.repositoryAnalyses.updateAnalysis, {
          analysisId: analysis._id,
          filesAnalyzed,
        });

        // Rate limiting - wait 1 second between batches
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(`[Analysis ${analysis._id}] Analysis complete. Files: ${filesAnalyzed}, Issues: ${allIssues.length}`);

      // Calculate statistics
      const criticalIssues = allIssues.filter((i) => i.severity === 'CRITICAL').length;
      const highIssues = allIssues.filter((i) => i.severity === 'HIGH').length;
      const mediumIssues = allIssues.filter((i) => i.severity === 'MEDIUM').length;
      const lowIssues = allIssues.filter((i) => i.severity === 'LOW').length;

      // Calculate overall score (100 - weighted issues)
      const overallScore = Math.max(
        0,
        100 - (criticalIssues * 10 + highIssues * 5 + mediumIssues * 2 + lowIssues * 0.5)
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(allIssues);

      // Update analysis with final results
      await this.convex.mutation(api.repositoryAnalyses.updateAnalysis, {
        analysisId: analysis._id,
        status: 'completed',
        overallScore: Math.round(overallScore),
        totalIssues: allIssues.length,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
        summary: `Analyzed ${filesAnalyzed} files and found ${allIssues.length} issues.`,
        recommendations,
        analyzedAt: Date.now(),
      });

      // Add issues to database
      if (allIssues.length > 0) {
        await this.convex.mutation(api.repositoryAnalyses.addIssues, {
          analysisId: analysis._id,
          issues: allIssues.map((issue) => ({
            severity: issue.severity,
            type: issue.type,
            file: issue.file,
            line: issue.line,
            description: issue.description,
            suggestion: issue.suggestion,
            codeExample: issue.code_example,
          })),
        });
      }

      console.log(`[Analysis ${analysis._id}] Results saved to database`);

      // Create a review record for this repository analysis
      const review = await this.convex.mutation(api.reviews.createReview, {
        userId: 'default', // TODO: Get from auth
        repositoryId: repository._id,
        prNumber: 0, // 0 indicates this is a full repository analysis
        prTitle: `Repository Analysis: ${owner}/${repo}`,
        prUrl: `/analysis/${analysis._id}`, // Link to analysis page
        status: 'completed',
        analysisId: analysis._id, // Link to the analysis
      });

      // Update review with analysis results
      await this.convex.mutation(api.reviews.updateReview, {
        reviewId: review._id,
        status: 'completed',
        overallAssessment: `Full repository analysis completed with score ${Math.round(overallScore)}/100. ${allIssues.length} issues found across ${filesAnalyzed} files.`,
        complexityScore: Math.round(overallScore),
        recommendation: recommendations.join('; '),
      });

      // Add issues to review
      if (allIssues.length > 0) {
        await this.convex.mutation(api.reviews.addIssues, {
          reviewId: review._id,
          issues: allIssues.map((issue) => ({
            severity: issue.severity,
            type: issue.type,
            file: issue.file,
            line: issue.line,
            description: issue.description,
            suggestion: issue.suggestion,
            codeExample: issue.code_example,
          })),
        });
      }

      // Add metrics
      await this.convex.mutation(api.reviews.createMetrics, {
        reviewId: review._id,
        filesChanged: filesAnalyzed,
        linesAdded: 0,
        linesDeleted: 0,
        analysisTimeMs: Date.now() - startTime,
        aiTokensUsed: this.estimateTokens(codeFiles.map(f => f.path).join('')),
      });

      console.log(`[Analysis ${analysis._id}] Review record created: ${review._id}`);

      return analysis._id;
    } catch (error: any) {
      console.error(`[Analysis ${analysis._id}] Error during analysis:`, error);
      // Update status to failed
      await this.convex.mutation(api.repositoryAnalyses.updateAnalysis, {
        analysisId: analysis._id,
        status: 'failed',
        failureReason: error.message,
      });
      throw error;
    }
  }

  private filterCodeFiles(tree: any[]): any[] {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.rb',
      '.php', '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.scala',
      '.vue', '.svelte', '.html', '.css', '.scss', '.sass', '.less',
      '.json', '.yml', '.yaml', '.xml', '.md', '.sql', '.sh', '.bash',
    ];

    const excludePatterns = [
      'node_modules/',
      'dist/',
      'build/',
      '.git/',
      'coverage/',
      '.next/',
      'out/',
      'vendor/',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.min.js',
      '.bundle.js',
    ];

    console.log(`[Filter] Total tree items: ${tree.length}`);

    const blobs = tree.filter((item: any) => item.type === 'blob');
    console.log(`[Filter] Blobs (files): ${blobs.length}`);

    const withCodeExt = blobs.filter((item: any) =>
      codeExtensions.some((ext) => item.path.endsWith(ext))
    );
    console.log(`[Filter] Files with code extensions: ${withCodeExt.length}`);

    if (withCodeExt.length > 0 && withCodeExt.length <= 5) {
      console.log(`[Filter] Sample files:`, withCodeExt.slice(0, 5).map((f: any) => f.path));
    }

    const notExcluded = withCodeExt.filter((item: any) =>
      !excludePatterns.some((pattern) => item.path.includes(pattern))
    );
    console.log(`[Filter] After excluding patterns: ${notExcluded.length}`);

    const sizeFiltered = notExcluded.filter((item: any) =>
      !item.size || item.size <= 100000
    );
    console.log(`[Filter] After size filter (<100KB): ${sizeFiltered.length}`);

    if (sizeFiltered.length === 0 && tree.length > 0) {
      console.warn(`[Filter] No files passed filtering! Tree had ${tree.length} items`);
      console.warn(`[Filter] Sample tree items:`, tree.slice(0, 10).map((item: any) => ({
        path: item.path,
        type: item.type,
        size: item.size
      })));
    }

    return sizeFiltered;
  }

  private chunkFiles(files: any[], batchSize: number): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      chunks.push(files.slice(i, i + batchSize));
    }
    return chunks;
  }

  private generateRecommendations(issues: any[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const securityCount = issues.filter((i) => i.type === 'security').length;
    const performanceCount = issues.filter((i) => i.type === 'performance').length;

    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical issue(s) immediately`);
    }

    if (securityCount > 0) {
      recommendations.push(`Review and fix ${securityCount} security vulnerability(ies)`);
    }

    if (performanceCount > 5) {
      recommendations.push('Consider performance optimization for better efficiency');
    }

    if (recommendations.length === 0) {
      recommendations.push('Code quality is good! Continue following best practices');
    }

    return recommendations;
  }

  private detectLanguage(files: any[]): string {
    const extensions: Record<string, string> = {
      ts: 'TypeScript',
      js: 'JavaScript',
      tsx: 'TypeScript React',
      jsx: 'JavaScript React',
      py: 'Python',
      java: 'Java',
      go: 'Go',
      rs: 'Rust',
      rb: 'Ruby',
    };

    const ext = files[0]?.filename.split('.').pop() || 'unknown';
    return extensions[ext] || 'Unknown';
  }

  private chunkDiff(diff: string, maxSize: number): string[] {
    if (diff.length <= maxSize) return [diff];

    const chunks: string[] = [];
    const lines = diff.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if ((currentChunk + line).length > maxSize) {
        chunks.push(currentChunk);
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks;
  }

  private mergeAnalyses(analyses: AnalysisResult[]): AnalysisResult {
    // Merge multiple analyses into one
    return {
      overall_assessment: analyses.map((a) => a.overall_assessment).join(' '),
      complexity_score: Math.round(
        analyses.reduce((sum, a) => sum + a.complexity_score, 0) / analyses.length
      ),
      issues: analyses.flatMap((a) => a.issues),
      positive_points: [...new Set(analyses.flatMap((a) => a.positive_points))],
      recommendation: this.getMostSevereRecommendation(
        analyses.map((a) => a.recommendation)
      ),
    };
  }

  private getMostSevereRecommendation(
    recommendations: ('APPROVE' | 'REQUEST_CHANGES' | 'COMMENT')[]
  ): 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' {
    if (recommendations.includes('REQUEST_CHANGES')) return 'REQUEST_CHANGES';
    if (recommendations.includes('COMMENT')) return 'COMMENT';
    return 'APPROVE';
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private async postReviewToGitHub(
    owner: string,
    repo: string,
    prNumber: number,
    analysis: AnalysisResult
  ) {
    // Format main review comment
    const body = this.formatReviewBody(analysis);

    // Format inline comments
    const comments = analysis.issues
      .filter((i) => i.line)
      .map((issue) => ({
        path: issue.file,
        line: issue.line!,
        body: this.formatIssueComment(issue),
      }));

    // Post to GitHub
    await this.github.postReview(owner, repo, prNumber, body, analysis.recommendation, comments);
  }

  private formatReviewBody(analysis: AnalysisResult): string {
    const severityEmojis = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵',
    };

    const issuesBySeverity = {
      CRITICAL: analysis.issues.filter((i) => i.severity === 'CRITICAL'),
      HIGH: analysis.issues.filter((i) => i.severity === 'HIGH'),
      MEDIUM: analysis.issues.filter((i) => i.severity === 'MEDIUM'),
      LOW: analysis.issues.filter((i) => i.severity === 'LOW'),
    };

    let body = `## 🤖 AI Code Review\n\n`;
    body += `**Overall Assessment:** ${analysis.overall_assessment}\n\n`;
    body += `**Complexity Score:** ${analysis.complexity_score}/10\n\n`;

    if (analysis.positive_points.length > 0) {
      body += `### ✅ Positive Points\n`;
      analysis.positive_points.forEach((point: string) => {
        body += `- ${point}\n`;
      });
      body += `\n`;
    }

    body += `### 🔍 Issues Found\n\n`;

    Object.entries(issuesBySeverity).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        body += `#### ${severityEmojis[severity as keyof typeof severityEmojis]
          } ${severity} (${issues.length})\n`;
        issues.forEach((issue, idx) => {
          body += `${idx + 1}. **${issue.type}** in \`${issue.file}\`${issue.line ? ` (line ${issue.line})` : ''
            }\n`;
          body += `   - ${issue.description}\n`;
          if (issue.suggestion) {
            body += `   - 💡 Suggestion: ${issue.suggestion}\n`;
          }
          body += `\n`;
        });
      }
    });

    body += `\n---\n`;
    body += `**Recommendation:** ${analysis.recommendation}\n`;
    body += `\n*Powered by CodeReview AI Agent*`;

    return body;
  }

  private formatIssueComment(issue: any): string {
    const severityEmoji = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵',
    }[issue.severity];

    let comment = `${severityEmoji} **${issue.severity}** ${issue.type}\n\n`;
    comment += `${issue.description}\n\n`;

    if (issue.suggestion) {
      comment += `💡 **Suggestion:**\n${issue.suggestion}\n\n`;
    }

    if (issue.code_example) {
      comment += `**Example:**\n\`\`\`\n${issue.code_example}\n\`\`\`\n`;
    }

    return comment;
  }
}
