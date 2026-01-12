import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, CheckCircle, XCircle, Activity, Plus, ExternalLink, Loader, Sparkles } from 'lucide-react';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  html_url: string;
  description: string;
  private: boolean;
  updated_at: string;
}

export function Repositories() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Record<number, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchRepositories(token);
  }, [navigate]);

  const fetchRepositories = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/repos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setRepos(data);

      // Initialize default AI provider for each repo
      const defaults: Record<number, string> = {};
      data.forEach((repo: GitHubRepo) => {
        defaults[repo.id] = 'openai';
      });
      setSelectedProviders(defaults);
    } catch (error) {
      console.error('Error fetching repos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeRepository = async (repo: GitHubRepo) => {
    setAnalyzing(repo.id);

    try {
      const aiProvider = selectedProviders[repo.id] || 'openai';

      const response = await fetch('http://localhost:3000/api/analysis/repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
          aiProvider,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Show specific error message
        if (error.error && error.error.includes('API keys')) {
          alert(`⚠️ ${error.error}\n\nPlease go to Settings and configure your ${aiProvider.toUpperCase()} API key.`);
        } else {
          throw new Error(error.error || error.message || 'Failed to start analysis');
        }
        setAnalyzing(null);
        return;
      }

      const data = await response.json();

      // Navigate to analysis results page
      navigate(`/analysis/${data.analysisId}`);
    } catch (error: any) {
      console.error('Error analyzing repository:', error);
      alert(`❌ Failed to start analysis: ${error.message}`);
      setAnalyzing(null);
    }
  };

  const handleProviderChange = (repoId: number, provider: string) => {
    setSelectedProviders(prev => ({
      ...prev,
      [repoId]: provider,
    }));
  };

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Repositories</h1>
          <p className="text-gray-400">
            Select repositories to enable AI code reviews
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-card rounded-lg border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Repositories</p>
                <p className="text-3xl font-bold text-white">{repos.length}</p>
              </div>
              <Github className="w-8 h-8 text-lime-400" />
            </div>
          </div>

          <div className="bg-dark-card rounded-lg border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Public</p>
                <p className="text-3xl font-bold text-green-400">
                  {repos.filter((r) => !r.private).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-dark-card rounded-lg border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Private</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {repos.filter((r) => r.private).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Repositories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="bg-dark-card rounded-lg border border-dark-border p-6 hover:border-lime-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Github className="w-5 h-5 text-lime-400" />
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-1"
                    >
                      {repo.full_name}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {repo.description || 'No description'}
                  </p>
                </div>
                {repo.private && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
                    Private
                  </span>
                )}
              </div>

              {/* AI Provider Selector */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">AI Model</label>
                <select
                  value={selectedProviders[repo.id] || 'openai'}
                  onChange={(e) => handleProviderChange(repo.id, e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500"
                >
                  <option value="openai">OpenAI GPT-4 Turbo</option>
                  <option value="claude">Claude 3.5 Sonnet</option>
                  <option value="gemini">Gemini 2.5 Flash</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dark-border">
                <span className="text-xs text-gray-500">
                  Updated {new Date(repo.updated_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAnalyzeRepository(repo)}
                    disabled={analyzing === repo.id}
                    className="px-3 py-2 bg-lime-500 hover:bg-lime-400 text-black font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {analyzing === repo.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRepos.length === 0 && (
          <div className="bg-dark-card rounded-lg border border-dark-border p-12 text-center">
            <p className="text-gray-400">No repositories found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
