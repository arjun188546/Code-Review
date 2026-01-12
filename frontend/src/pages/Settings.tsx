import React, { useState, useEffect } from 'react';
import { useRepositories } from '../hooks/useReviews';
import { Settings as SettingsIcon, Github, Key, Bell, Save, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface UserSettings {
  aiProvider: 'openai' | 'claude' | 'gemini';
  openaiKey: string;
  anthropicKey: string;
  geminiKey: string;
}

export function Settings() {
  const { data: repositories = [] } = useRepositories();
  const [settings, setSettings] = useState<UserSettings>({
    aiProvider: 'openai',
    openaiKey: '',
    anthropicKey: '',
    geminiKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Get GitHub user from localStorage (same as Debug page)
  const getGitHubUser = (): string => {
    try {
      // First try to get the Convex user ID
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        return storedUserId;
      }

      // Fallback to GitHub user
      const userStr = localStorage.getItem('github_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Convert to string to ensure it's always a string
          const id = user.id || user.githubId || user.login || userStr;
          return String(id);
        } catch {
          return String(userStr);
        }
      }
    } catch (error) {
      console.error('Error getting GitHub user:', error);
    }
    return 'default';
  };

  const userId = getGitHubUser();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('📡 [SETTINGS] Loading settings for user:', userId);
      const response = await fetch(`http://localhost:3000/api/settings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SETTINGS] Settings loaded:', {
          aiProvider: data.aiProvider,
          hasOpenAI: !!data.openaiKey,
          hasClaude: !!data.anthropicKey,
          hasGemini: !!data.geminiKey
        });
        setSettings(prev => ({
          ...prev,
          aiProvider: data.aiProvider,
          openaiKey: data.openaiKey || '',
          anthropicKey: data.anthropicKey || '',
          geminiKey: data.geminiKey || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      console.log('💾 [SETTINGS] Saving settings for user:', userId);
      console.log('AI Provider:', settings.aiProvider);

      const response = await fetch(`http://localhost:3000/api/settings/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        console.log('✅ [SETTINGS] Settings saved successfully');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your CodeReview AI Agent</p>
        </div>

        {saved && (
          <div className="mb-6 bg-lime-500/10 border border-lime-500 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-lime-500" />
            <span className="text-lime-500">Settings saved successfully!</span>
          </div>
        )}

        {/* Active AI Provider Banner */}
        <div className="mb-6 bg-gradient-to-r from-[#BFFF00]/10 to-[#8B9F00]/10 border border-[#BFFF00]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Default AI Provider</h3>
              <p className="text-gray-400 text-sm">This AI will be used for all code analysis and debugging operations</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#BFFF00]">
                  {settings.aiProvider === 'openai' && 'OpenAI GPT-4'}
                  {settings.aiProvider === 'claude' && 'Claude 3.5'}
                  {settings.aiProvider === 'gemini' && 'Gemini 2.5 Flash'}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Active Provider</div>
              </div>
              <div className="w-12 h-12 bg-[#BFFF00] rounded-full flex items-center justify-center">
                <Key className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Provider Selection */}
        <div className="bg-dark-card rounded-lg border border-dark-border p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">AI Configuration</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Choose AI Provider
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setSettings({ ...settings, aiProvider: 'openai' })}
                className={`p-4 rounded-lg border-2 transition-all ${settings.aiProvider === 'openai'
                  ? 'border-lime-500 bg-lime-500/10'
                  : 'border-dark-border hover:border-gray-600'
                  }`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2">
                    <img src="/openai-logo.svg" alt="OpenAI" className="w-full h-full" />
                  </div>
                  <div className="text-white font-medium">OpenAI</div>
                  <div className="text-xs text-gray-400 mt-1">GPT-4 Turbo</div>
                </div>
              </button>

              <button
                onClick={() => setSettings({ ...settings, aiProvider: 'claude' })}
                className={`p-4 rounded-lg border-2 transition-all ${settings.aiProvider === 'claude'
                  ? 'border-lime-500 bg-lime-500/10'
                  : 'border-dark-border hover:border-gray-600'
                  }`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2">
                    <img src="/claude-logo.svg" alt="Claude" className="w-full h-full" />
                  </div>
                  <div className="text-white font-medium">Claude</div>
                  <div className="text-xs text-gray-400 mt-1">Claude 3.5 Sonnet</div>
                </div>
              </button>

              <button
                onClick={() => setSettings({ ...settings, aiProvider: 'gemini' })}
                className={`p-4 rounded-lg border-2 transition-all ${settings.aiProvider === 'gemini'
                  ? 'border-lime-500 bg-lime-500/10'
                  : 'border-dark-border hover:border-gray-600'
                  }`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2">
                    <img src="/gemini-logo.svg" alt="Gemini" className="w-full h-full" />
                  </div>
                  <div className="text-white font-medium">Gemini</div>
                  <div className="text-xs text-gray-400 mt-1">Gemini 2.5 Flash</div>
                </div>
              </button>
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            {settings.aiProvider === 'openai' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showOpenaiKey ? "text" : "password"}
                    value={settings.openaiKey}
                    onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 pr-12 text-white focus:outline-none focus:border-lime-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showOpenaiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Get your API key from platform.openai.com</p>
              </div>
            )}

            {settings.aiProvider === 'claude' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    type={showAnthropicKey ? "text" : "password"}
                    value={settings.anthropicKey}
                    onChange={(e) => setSettings({ ...settings, anthropicKey: e.target.value })}
                    placeholder="sk-ant-..."
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 pr-12 text-white focus:outline-none focus:border-lime-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showAnthropicKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Get your API key from console.anthropic.com</p>
              </div>
            )}

            {settings.aiProvider === 'gemini' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={settings.geminiKey}
                    onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                    placeholder="AIza..."
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 pr-12 text-white focus:outline-none focus:border-lime-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showGeminiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Get your API key from makersuite.google.com/app/apikey</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => loadSettings()}
              className="px-4 py-2 bg-dark-hover text-white rounded-lg hover:bg-dark-border transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-lime-500 text-black font-medium rounded-lg hover:bg-lime-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
