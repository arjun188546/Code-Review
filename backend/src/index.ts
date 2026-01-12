import express from 'express';
import cors from 'cors';
import { ConvexHttpClient } from 'convex/browser';
import { config } from './config';
import { logger } from './utils/logger';
import { setupQueue } from './utils/queue';
import { GitHubService } from './services/github.service';
import { AIService } from './services/ai.service';
import { AnalysisService } from './services/analysis.service';
import { ReviewController } from './controllers/review.controller';
import { AnalysisController } from './controllers/analysis.controller';
import { AuthController } from './controllers/auth.controller';
import { SettingsController } from './controllers/settings.controller';
import { DebugController } from './controllers/debug.controller';
import { createApiRoutes } from './routes/api.routes';
import { createAuthRoutes } from './routes/auth.routes';
import { createSettingsRoutes } from './routes/settings.routes';
import { api } from '../../convex/_generated/api';

const app = express();
const convex = new ConvexHttpClient(process.env.CONVEX_URL || 'https://quiet-moose-974.convex.cloud');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const githubService = new GitHubService(config.github.token);
const aiService = new AIService({
  provider: 'openai',
  openaiKey: config.ai.openaiKey,
  anthropicKey: config.ai.anthropicKey,
  geminiKey: config.ai.geminiKey,
});
const analysisService = new AnalysisService(githubService, aiService, convex);

// Initialize controllers
const reviewController = new ReviewController(convex);
const analysisController = new AnalysisController(githubService, convex);
const authController = new AuthController(convex);
const settingsController = new SettingsController(convex);
const debugController = new DebugController(convex);

// Setup queue
setupQueue(analysisService);

// Routes
app.use('/api', createApiRoutes(reviewController, analysisController, settingsController, debugController));
app.use('/api/auth', createAuthRoutes(authController));
app.use('/api/settings', createSettingsRoutes(convex));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`🚀 CodeReview AI Backend running on port ${PORT}`);
  logger.info(`Environment: ${config.server.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  convex.close();
  process.exit(0);
});

export default app;
