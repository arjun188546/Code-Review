import { Request, Response } from 'express';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { logger } from '../utils/logger';

export class ReviewController {
  constructor(private convex: ConvexHttpClient) {}

  async getReviews(req: Request, res: Response) {
    try {
      const { limit = 50, status, repositoryId } = req.query;

      const reviews = await this.convex.query(api.reviews.getUserReviews, {
        userId: 'default', // TODO: Get from auth
        limit: parseInt(limit as string, 10),
        status: status as string || undefined,
        repositoryId: repositoryId as string || undefined,
      });

      res.json(reviews);
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  async getReview(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const review = await this.convex.query(api.reviews.getReviewById, {
        reviewId: id,
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json(review);
    } catch (error) {
      logger.error('Error fetching review:', error);
      res.status(500).json({ error: 'Failed to fetch review' });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.convex.query(api.reviews.getReviewStats, {
        userId: 'default', // TODO: Get from auth
        timeRange: 'all',
      });

      res.json(stats);
    } catch (error) {
      logger.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  async getRepositories(req: Request, res: Response) {
    try {
      const repositories = await this.convex.query(api.repositories.getUserRepositories, {
        userId: 'default', // TODO: Get from auth
      });

      res.json(repositories);
    } catch (error) {
      logger.error('Error fetching repositories:', error);
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  }

  async getRepository(req: Request, res: Response) {
    try {
      const { repositoryId } = req.params;

      const repository = await this.convex.query(api.repositories.getRepositoryById, {
        repositoryId: repositoryId as any,
      });

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      res.json(repository);
    } catch (error) {
      logger.error('Error fetching repository:', error);
      res.status(500).json({ error: 'Failed to fetch repository' });
    }
  }
}