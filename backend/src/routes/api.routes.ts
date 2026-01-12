import express from 'express';
import { ReviewController } from '../controllers/review.controller';
import { AnalysisController } from '../controllers/analysis.controller';
import { SettingsController } from '../controllers/settings.controller';
import { DebugController } from '../controllers/debug.controller';

export function createApiRoutes(
  reviewController: ReviewController,
  analysisController: AnalysisController,
  settingsController: SettingsController,
  debugController: DebugController
) {
  const router = express.Router();

  router.get('/reviews', (req, res) => reviewController.getReviews(req, res));
  router.get('/reviews/:id', (req, res) => reviewController.getReview(req, res));
  router.get('/stats', (req, res) => reviewController.getStats(req, res));
  router.get('/repositories', (req, res) => reviewController.getRepositories(req, res));

  // Repository analysis routes
  router.post('/analysis/repository', (req, res) => analysisController.analyzeRepository(req, res));
  router.get('/analysis/:analysisId', (req, res) => analysisController.getAnalysis(req, res));
  router.get('/analysis/:analysisId/repository', (req, res) => analysisController.getAnalysisRepository(req, res));
  router.get('/analyses', (req, res) => analysisController.getAnalyses(req, res));

  // Settings routes
  router.get('/settings/:userId', (req, res) => settingsController.getUserSettings(req, res));
  router.put('/settings/:userId', (req, res) => settingsController.updateUserSettings(req, res));

  // Debug routes
  router.post('/debug', (req, res) => debugController.debugCode(req, res));
  router.post('/debug/issue', (req, res) => debugController.debugIssue(req, res));
  router.post('/debug/push', (req, res) => debugController.pushToGitHub(req, res));
  router.get('/debug/sessions/:userId', (req, res) => debugController.getUserSessions(req, res));
  router.get('/debug/sessions/:sessionId/fixes', (req, res) => debugController.getSessionFixes(req, res));
  
  // Repository routes
  router.get('/repositories/:repositoryId', (req, res) => reviewController.getRepository(req, res));

  return router;
}
