import { Request, Response } from 'express';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

export class SettingsController {
  private convex: ConvexHttpClient;

  constructor(convex: ConvexHttpClient) {
    this.convex = convex;
  }

  async getUserSettings(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      let settings = await this.convex.query(api.settings.getUserSettings, { userId });

      // Create default settings if not exists
      if (!settings) {
        settings = await this.convex.mutation(api.settings.createUserSettings, {
          userId,
          aiProvider: 'openai',
        });
      }

      res.json({
        aiProvider: settings.aiProvider,
        openaiKey: settings.openaiKey || '',
        anthropicKey: settings.anthropicKey || '',
        geminiKey: settings.geminiKey || '',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async updateUserSettings(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { aiProvider, openaiKey, anthropicKey, geminiKey } = req.body;

      const updateData: any = { userId };
      if (aiProvider) updateData.aiProvider = aiProvider;
      if (openaiKey) updateData.openaiKey = openaiKey;
      if (anthropicKey) updateData.anthropicKey = anthropicKey;
      if (geminiKey) updateData.geminiKey = geminiKey;

      const settings = await this.convex.mutation(api.settings.updateUserSettings, updateData);

      res.json({
        message: 'Settings updated successfully',
        aiProvider: settings.aiProvider,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  async getApiKeys(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const settings = await this.convex.query(api.settings.getUserSettings, { userId });

      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }

      res.json({
        aiProvider: settings.aiProvider,
        openaiKey: settings.openaiKey,
        anthropicKey: settings.anthropicKey,
        geminiKey: settings.geminiKey,
      });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  }
}
