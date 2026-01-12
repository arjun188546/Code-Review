import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getPullRequest(owner: string, repo: string, prNumber: number) {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    return data;
  }

  async getDiff(owner: string, repo: string, prNumber: number): Promise<string> {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      mediaType: { format: 'diff' },
    });
    return data as unknown as string;
  }

  async getFiles(owner: string, repo: string, prNumber: number) {
    const { data } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });
    return data;
  }

  async postReview(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    comments: Array<{
      path: string;
      line: number;
      body: string;
    }>
  ) {
    await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      body,
      event,
      comments: comments.map((c) => ({
        path: c.path,
        line: c.line,
        body: c.body,
      })),
    });
  }

  async createWebhook(owner: string, repo: string, url: string, secret: string) {
    const { data } = await this.octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url,
        content_type: 'json',
        secret,
      },
      events: ['pull_request'],
    });
    return data.id;
  }

  // New methods for repository analysis
  async getRepositoryInfo(owner: string, repo: string) {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });
    return data;
  }

  async getRepositoryTree(owner: string, repo: string, branch: string = 'main') {
    try {
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true',
      });
      return data.tree;
    } catch (error: any) {
      // Try 'master' if 'main' fails
      if (branch === 'main') {
        const { data } = await this.octokit.git.getTree({
          owner,
          repo,
          tree_sha: 'master',
          recursive: 'true',
        });
        return data.tree;
      }
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ('content' in data && data.type === 'file') {
      // Content is base64 encoded
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    throw new Error('Not a file or content not available');
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });
    return data.default_branch;
  }
}
