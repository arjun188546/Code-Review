import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { config } from '../config';

export class AuthController {
  async getLoginUrl(req: Request, res: Response) {
    const clientId = config.github.clientId;
    const redirectUri = `${config.server.baseUrl}/api/auth/callback`;
    const scope = 'repo,admin:repo_hook,read:org';
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    res.json({ url: githubAuthUrl });
  }

  async handleCallback(req: Request, res: Response) {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: config.github.clientId,
          client_secret: config.github.clientSecret,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return res.status(400).json({ error: tokenData.error_description });
      }

      const accessToken = tokenData.access_token;

      // Get user info
      const octokit = new Octokit({ auth: accessToken });
      const { data: user } = await octokit.users.getAuthenticated();

      // Redirect to frontend with token
      res.redirect(`${config.frontend.url}/auth/success?token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  async getUserRepos(req: Request, res: Response) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const octokit = new Octokit({ auth: token });
      
      // Get user's repositories
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        sort: 'updated',
      });

      // Get organization repositories
      const { data: orgs } = await octokit.orgs.listForAuthenticatedUser();
      
      const orgRepos = await Promise.all(
        orgs.map(async (org) => {
          const { data } = await octokit.repos.listForOrg({
            org: org.login,
            per_page: 100,
          });
          return data;
        })
      );

      const allRepos = [...repos, ...orgRepos.flat()];

      res.json(allRepos);
    } catch (error) {
      console.error('Error fetching repos:', error);
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  }
}
