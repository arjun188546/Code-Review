import { Router } from 'express';
import { ConvexHttpClient } from 'convex/browser';
import { SettingsController } from '../controllers/settings.controller';

export function createSettingsRoutes(convex: ConvexHttpClient) {
  const router = Router();
  const controller = new SettingsController(convex);

  router.get('/:userId', controller.getUserSettings.bind(controller));
  router.put('/:userId', controller.updateUserSettings.bind(controller));
  router.get('/:userId/keys', controller.getApiKeys.bind(controller));

  return router;
}
