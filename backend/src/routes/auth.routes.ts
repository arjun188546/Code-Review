import express from 'express';
import { AuthController } from '../controllers/auth.controller';

export function createAuthRoutes(authController: AuthController) {
  const router = express.Router();

  router.get('/login', (req, res) => authController.getLoginUrl(req, res));
  router.get('/callback', (req, res) => authController.handleCallback(req, res));
  router.get('/repos', (req, res) => authController.getUserRepos(req, res));

  return router;
}
