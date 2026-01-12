import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysis.service';
import { AIService } from '../services/ai.service';
import { GitHubService } from '../services/github.service';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { logger } from '../utils/logger';

export class AnalysisController {
    constructor(
        private githubService: GitHubService,
        private convex: ConvexHttpClient
    ) { }

    async analyzeRepository(req: Request, res: Response) {
        try {
            const { owner, repo, aiProvider } = req.body;
            const userId = 'default-user'; // TODO: Get from auth

            if (!owner || !repo || !aiProvider) {
                return res.status(400).json({
                    error: 'Missing required fields: owner, repo, aiProvider',
                });
            }

            if (!['openai', 'claude', 'gemini'].includes(aiProvider)) {
                return res.status(400).json({
                    error: 'Invalid AI provider. Must be one of: openai, claude, gemini',
                });
            }

            logger.info(`Starting repository analysis for ${owner}/${repo} with ${aiProvider}`);

            // Fetch user's API keys from settings
            const settings = await this.convex.query(api.settings.getUserSettings, {
                userId,
            });

            if (!settings) {
                return res.status(400).json({
                    error: 'Please configure your API keys in Settings first',
                });
            }

            // Create AI service with user's API keys
            const aiService = new AIService({
                provider: aiProvider,
                openaiKey: settings.openaiKey || '',
                anthropicKey: settings.anthropicKey || '',
                geminiKey: settings.geminiKey || '',
            });

            // Create analysis service with user's AI service
            const analysisService = new AnalysisService(
                this.githubService,
                aiService,
                this.convex
            );

            // Start analysis (this will run in the background)
            const analysisId = await analysisService.analyzeFullRepository(
                owner,
                repo,
                aiProvider
            );

            res.json({
                analysisId,
                status: 'analyzing',
                message: 'Repository analysis started successfully',
            });
        } catch (error: any) {
            logger.error('Error starting repository analysis:', error);
            res.status(500).json({
                error: 'Failed to start repository analysis',
                message: error.message,
            });
        }
    }

    async getAnalysis(req: Request, res: Response) {
        try {
            const { analysisId } = req.params;

            const analysis = await this.convex.query(api.repositoryAnalyses.getAnalysisById, {
                analysisId: analysisId as any,
            });

            if (!analysis) {
                return res.status(404).json({ error: 'Analysis not found' });
            }

            res.json(analysis);
        } catch (error: any) {
            logger.error('Error fetching analysis:', error);
            res.status(500).json({
                error: 'Failed to fetch analysis',
                message: error.message,
            });
        }
    }

    async getAnalyses(req: Request, res: Response) {
        try {
            const userId = 'default-user'; // TODO: Get from auth

            const analyses = await this.convex.query(api.repositoryAnalyses.getUserAnalyses, {
                userId,
            });

            res.json(analyses);
        } catch (error: any) {
            logger.error('Error fetching analyses:', error);
            res.status(500).json({
                error: 'Failed to fetch analyses',
                message: error.message,
            });
        }
    }

    async getAnalysisRepository(req: Request, res: Response) {
        try {
            const { analysisId } = req.params;

            console.log('📡 [API] Fetching repository for analysis:', analysisId);

            // Get the analysis
            const analysis = await this.convex.query(api.repositoryAnalyses.getAnalysisById, {
                analysisId: analysisId as any,
            });

            if (!analysis) {
                return res.status(404).json({ error: 'Analysis not found' });
            }

            console.log('✅ [API] Analysis found, fetching repository:', analysis.repositoryId);

            // Get the repository by ID
            const repository = await this.convex.query(api.repositories.getRepositoryById, {
                repositoryId: analysis.repositoryId,
            });

            if (!repository) {
                console.error('❌ [API] Repository not found with ID:', analysis.repositoryId);
                return res.status(404).json({ error: 'Repository not found' });
            }

            console.log('✅ [API] Repository data:', {
                owner: repository.owner,
                name: repository.name,
                defaultBranch: repository.defaultBranch
            });

            res.json({
                owner: repository.owner,
                name: repository.name,
                defaultBranch: repository.defaultBranch || 'main',
                fullName: repository.fullName,
            });
        } catch (error: any) {
            console.error('❌ [API] Error fetching repository for analysis:', error);
            res.status(500).json({
                error: 'Failed to fetch repository',
                message: error.message,
            });
        }
    }
}
