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
      const userIdStr = String(userId);

      console.log('📡 [SETTINGS] Get user settings request');
      console.log('User ID:', userIdStr);

      let settings = await this.convex.query(api.settings.getUserSettings, { userId: userIdStr });

      // Create default settings if not exists
      if (!settings) {
        console.log('⚠️ [SETTINGS] No settings found, creating defaults');
        settings = await this.convex.mutation(api.settings.createUserSettings, {
          userId: userIdStr,
          aiProvider: 'openai',
        });
      }

      console.log('✅ [SETTINGS] Settings retrieved:', {
        aiProvider: settings.aiProvider,
        hasOpenAI: !!settings.openaiKey,
        hasClaude: !!settings.anthropicKey,
        hasGemini: !!settings.geminiKey
      });

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
      const userIdStr = String(userId);
      const { aiProvider, openaiKey, anthropicKey, geminiKey } = req.body;

      console.log('💾 [SETTINGS] Update settings request');
      console.log('User ID:', userIdStr);
      console.log('AI Provider:', aiProvider);
      console.log('Has OpenAI Key:', !!openaiKey);
      console.log('Has Anthropic Key:', !!anthropicKey);
      console.log('Has Gemini Key:', !!geminiKey);

      const updateData: any = { userId: userIdStr };
      if (aiProvider) updateData.aiProvider = aiProvider;
      if (openaiKey) updateData.openaiKey = openaiKey;
      if (anthropicKey) updateData.anthropicKey = anthropicKey;
      if (geminiKey) updateData.geminiKey = geminiKey;

      const settings = await this.convex.mutation(api.settings.updateUserSettings, updateData);

      console.log('✅ [SETTINGS] Settings updated successfully');
      console.log('Saved AI Provider:', settings.aiProvider);

      res.json({
        message: `🎉 Your settings have been saved! You're now using ${settings.aiProvider === 'openai' ? 'OpenAI GPT-4 Turbo' : settings.aiProvider === 'anthropic' ? 'Claude 3.5 Sonnet' : 'Gemini 2.5 Flash'} for code analysis.`,
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
