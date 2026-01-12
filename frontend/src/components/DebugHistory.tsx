import { useState, useEffect } from 'react';
import { Clock, GitBranch, CheckCircle, Loader, Upload, ChevronDown, ChevronUp, FileCode } from 'lucide-react';

interface DebugSession {
  _id: string;
  _creationTime: number;
  userId: string;
  repositoryId: string;
  status: 'generating' | 'ready' | 'pushed';
  totalIssues: number;
  fixedIssues: number;
  branch?: string;
}

interface DebugFix {
  _id: string;
  sessionId: string;
  issueTitle: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  status: 'pending' | 'completed' | 'failed';
}

interface Repository {
  _id: string;
  fullName: string;
  owner: string;
  name: string;
}

export function DebugHistory() {
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [repositories, setRepositories] = useState<Record<string, Repository>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionFixes, setSessionFixes] = useState<Record<string, DebugFix[]>>({});
  const [loadingFixes, setLoadingFixes] = useState<Record<string, boolean>>({});
  const [pushing, setPushing] = useState<Record<string, boolean>>({});

  const userId = localStorage.getItem('userId') || 'default-user';

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      console.log('📖 [HISTORY] Loading debug sessions for user:', userId);

      const response = await fetch(`http://localhost:3000/api/debug/sessions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      console.log('✅ [HISTORY] Loaded', data.length, 'sessions');
      setSessions(data);

      // Load repository details for all sessions
      const repoIds = [...new Set(data.map((s: DebugSession) => s.repositoryId))];
      await loadRepositories(repoIds);
    } catch (error) {
      console.error('❌ [HISTORY] Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepositories = async (repoIds: string[]) => {
    try {
      const repoMap: Record<string, Repository> = {};
      
      for (const repoId of repoIds) {
        const response = await fetch(`http://localhost:3000/api/repositories/${repoId}`);
        if (response.ok) {
          const repo = await response.json();
          repoMap[repoId] = repo;
        }
      }
      
      setRepositories(repoMap);
    } catch (error) {
      console.error('❌ [HISTORY] Error loading repositories:', error);
    }
  };

  const loadSessionFixes = async (sessionId: string) => {
    if (sessionFixes[sessionId]) {
      // Already loaded, just toggle
      setExpandedSession(expandedSession === sessionId ? null : sessionId);
      return;
    }

    try {
      setLoadingFixes({ ...loadingFixes, [sessionId]: true });
      console.log('📖 [HISTORY] Loading fixes for session:', sessionId);

      const response = await fetch(`http://localhost:3000/api/debug/sessions/${sessionId}/fixes`);
      if (!response.ok) throw new Error('Failed to fetch fixes');

      const fixes = await response.json();
      console.log('✅ [HISTORY] Loaded', fixes.length, 'fixes');
      
      setSessionFixes({ ...sessionFixes, [sessionId]: fixes });
      setExpandedSession(sessionId);
    } catch (error) {
      console.error('❌ [HISTORY] Error loading fixes:', error);
    } finally {
      setLoadingFixes({ ...loadingFixes, [sessionId]: false });
    }
  };

  const handlePushSession = async (session: DebugSession) => {
    try {
      setPushing({ ...pushing, [session._id]: true });
      console.log('🚀 [HISTORY] Pushing session to GitHub:', session._id);

      const repo = repositories[session.repositoryId];
      if (!repo) {
        alert('Repository information not available');
        return;
      }

      // Load fixes if not already loaded
      let fixes = sessionFixes[session._id];
      if (!fixes) {
        const response = await fetch(`http://localhost:3000/api/debug/sessions/${session._id}/fixes`);
        if (!response.ok) throw new Error('Failed to fetch fixes');
        fixes = await response.json();
      }

      const formattedFixes = fixes.map(fix => ({
        file: fix.issueTitle,
        fixedCode: fix.fixedCode,
        description: fix.explanation
      }));

      const response = await fetch('http://localhost:3000/api/debug/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryInfo: {
            owner: repo.owner,
            repo: repo.name,
            fullName: repo.fullName
          },
          sessionId: session._id,
          fixes: formattedFixes,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to push fixes to GitHub');
      }

      const data = await response.json();
      console.log('✅ [HISTORY] Push successful:', data);
      
      alert(`✅ Successfully pushed fixes to GitHub!\nBranch: ${data.branch}\nCommit: ${data.commitSha}`);
      
      // Reload sessions to update status
      await loadSessions();
    } catch (error: any) {
      console.error('❌ [HISTORY] Push failed:', error);
      alert(`Failed to push to GitHub: ${error.message}`);
    } finally {
      setPushing({ ...pushing, [session._id]: false });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generating':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full flex items-center gap-1">
            <Loader className="w-3 h-3 animate-spin" />
            Generating
          </span>
        );
      case 'ready':
        return (
          <span className="px-3 py-1 bg-lime-500/20 text-lime-400 text-xs font-semibold rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Ready
          </span>
        );
      case 'pushed':
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            Pushed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-lime-500 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
        <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Debug History</h3>
        <p className="text-gray-400">
          Your debug sessions will appear here once you start fixing issues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Debug History</h2>
          <p className="text-gray-400 mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {sessions.map(session => {
        const repo = repositories[session.repositoryId];
        const fixes = sessionFixes[session._id] || [];
        const isExpanded = expandedSession === session._id;
        const isLoadingFixes = loadingFixes[session._id];
        const isPushing = pushing[session._id];

        return (
          <div
            key={session._id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-lime-500/30 transition-colors"
          >
            {/* Session Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">{formatDate(session._creationTime)}</span>
                    {getStatusBadge(session.status)}
                  </div>
                  
                  {repo && (
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch className="w-4 h-4 text-lime-500" />
                      <span className="text-white font-medium">{repo.fullName}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      {session.fixedIssues}/{session.totalIssues} issues fixed
                    </span>
                    {session.branch && (
                      <span className="text-gray-400">
                        Branch: <span className="text-lime-400">{session.branch}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {session.status === 'ready' && (
                    <button
                      onClick={() => handlePushSession(session)}
                      disabled={isPushing}
                      className="px-4 py-2 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isPushing ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Pushing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Push to GitHub
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => loadSessionFixes(session._id)}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    {isLoadingFixes ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Hide' : 'View'} Fixes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Fixes List */}
            {isExpanded && fixes.length > 0 && (
              <div className="border-t border-zinc-800 p-6 bg-black/30">
                <div className="space-y-4">
                  {fixes.map(fix => (
                    <div
                      key={fix._id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <FileCode className="w-5 h-5 text-lime-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{fix.issueTitle}</h4>
                          <p className="text-sm text-gray-400">{fix.explanation}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          fix.status === 'completed' ? 'bg-lime-500/20 text-lime-400' :
                          fix.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {fix.status}
                        </span>
                      </div>

                      {fix.fixedCode && (
                        <div className="mt-3">
                          <div className="bg-black/50 border border-zinc-700 rounded p-3">
                            <pre className="text-xs text-gray-300 overflow-x-auto">
                              <code>{fix.fixedCode.substring(0, 500)}{fix.fixedCode.length > 500 ? '...' : ''}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
