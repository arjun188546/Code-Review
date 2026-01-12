import { useState, useEffect } from 'react';
import { Bug, Sparkles, Code, CheckCircle, XCircle, Loader, Copy, Check, Upload, GitBranch, FileCode, Zap, Rocket, Clock } from 'lucide-react';
import { useDebug } from '../contexts/DebugContext';
import { DebugHistory } from '../components/DebugHistory';

interface DebugResult {
  originalCode: string;
  fixedCode: string;
  explanation: string;
  error: string;
}

interface IssueWithFix {
  issue: any;
  fix: DebugResult | null;
  loading: boolean;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

type TabType = 'input' | 'generating' | 'ready' | 'history';

export function Debug() {
  const { selectedIssues, repositoryInfo } = useDebug();
  const [activeTab, setActiveTab] = useState<TabType>('input');

  // Manual code debugging state
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Issue-based debugging state
  const [issuesWithFixes, setIssuesWithFixes] = useState<IssueWithFix[]>([]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [debugSessionId, setDebugSessionId] = useState<string | null>(null);

  // Get GitHub user from localStorage (set during login)
  const getGitHubUser = () => {
    try {
      // First try to get the Convex user ID
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        return storedUserId;
      }

      // Fallback to GitHub user
      const userStr = localStorage.getItem('github_user');
      if (userStr) {
        // If it's a JSON object, parse it
        try {
          const user = JSON.parse(userStr);
          return user.id || user.login || userStr; // Return Convex ID if available, else GitHub ID or username
        } catch {
          // If it's just a string, return it
          return userStr;
        }
      }
    } catch (error) {
      console.error('Error getting GitHub user:', error);
    }
    return 'default';
  };

  const userId = getGitHubUser();


  // Restore session from Convex if sessionId exists
  useEffect(() => {
    const restoreSession = async () => {
      if (debugSessionId && selectedIssues.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 [DEBUG] Restoring Session from Convex');
        console.log('Session ID:', debugSessionId);

        try {
          // Fetch fixes from Convex
          const response = await fetch(`http://localhost:3000/api/debug/session/${debugSessionId}/fixes`);

          if (response.ok) {
            const fixes = await response.json();
            console.log('✅ [DEBUG] Retrieved', fixes.length, 'fixes from Convex');

            // Map Convex fixes to issuesWithFixes format
            const restoredIssues = selectedIssues.map((issue, idx) => {
              const convexFix = fixes.find((f: any) =>
                f.issueTitle === issue.description ||
                f.issueDescription === issue.description
              );

              if (convexFix) {
                console.log(`  ✓ Restored fix for issue ${idx + 1}`);
                return {
                  issue,
                  fix: {
                    originalCode: convexFix.originalCode || '',
                    fixedCode: convexFix.fixedCode || '',
                    explanation: convexFix.explanation || '',
                    error: convexFix.error || '',
                  },
                  loading: false,
                  status: convexFix.status === 'completed' ? 'completed' as const : 'pending' as const
                };
              }

              return {
                issue,
                fix: null,
                loading: false,
                status: 'pending' as const
              };
            });

            setIssuesWithFixes(restoredIssues);

            // Check if all are completed
            const allCompleted = restoredIssues.every(item => item.status === 'completed');
            if (allCompleted) {
              console.log('✅ [DEBUG] All fixes completed - switching to Ready tab');
              setActiveTab('ready');
            } else {
              setActiveTab('input');
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          } else {
            console.warn('⚠️ [DEBUG] Failed to fetch fixes from Convex');
            // Fall back to normal initialization
            setIssuesWithFixes(selectedIssues.map(issue => ({
              issue,
              fix: null,
              loading: false,
              status: 'pending' as const
            })));
          }
        } catch (error) {
          console.error('❌ [DEBUG] Error restoring session:', error);
          // Fall back to normal initialization
          setIssuesWithFixes(selectedIssues.map(issue => ({
            issue,
            fix: null,
            loading: false,
            status: 'pending' as const
          })));
        }
      } else if (selectedIssues.length > 0) {
        // No session ID, initialize normally
        setIssuesWithFixes(selectedIssues.map(issue => ({
          issue,
          fix: null,
          loading: false,
          status: 'pending' as const
        })));
      }
    };

    restoreSession();
  }, [selectedIssues, debugSessionId]);

  const handleDebug = async () => {
    if (!code.trim()) {
      alert('Please enter some code to debug');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const settingsResponse = await fetch(`http://localhost:3000/api/settings/${userId}`);
      const settings = await settingsResponse.json();

      const response = await fetch('http://localhost:3000/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          errorMessage,
          language,
          aiProvider: settings.aiProvider || 'openai',
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to debug code');
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('Debug error:', error);
      alert(`Failed to debug: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFix = async (index: number) => {
    const issueWithFix = issuesWithFixes[index];
    const issue = issueWithFix.issue;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 [DEBUG] Generate Fix Button Clicked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Issue Index:', index);
    console.log('Issue Details:', {
      file: issue.file,
      line: issue.line,
      severity: issue.severity,
      type: issue.type,
      description: issue.description?.substring(0, 100) + '...'
    });
    console.log('Repository Info:', repositoryInfo);
    console.log('Current Session ID:', debugSessionId);
    console.log('User ID:', userId);

    // Update status to generating and switch to generating tab
    setIssuesWithFixes(prev => prev.map((item, idx) =>
      idx === index ? { ...item, loading: true, status: 'generating' as const } : item
    ));
    setActiveTab('generating');

    try {
      console.log('📡 [API] Fetching user settings...');
      const settingsResponse = await fetch(`http://localhost:3000/api/settings/${userId}`);
      const settings = await settingsResponse.json();
      console.log('✅ [API] Settings retrieved:', { aiProvider: settings.aiProvider });

      console.log('📡 [API] Sending debug request to backend...');
      const requestBody = {
        issue: {
          file: issue.file,
          line: issue.line,
          description: issue.description,
          suggestion: issue.suggestion,
          codeExample: issue.codeExample,
          severity: issue.severity,
          type: issue.type
        },
        repositoryInfo,
        sessionId: debugSessionId,
        aiProvider: settings.aiProvider || 'openai',
        userId,
      };
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://localhost:3000/api/debug/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API] Request failed:', response.status, errorText);
        throw new Error('Failed to generate fix');
      }

      const data = await response.json();
      console.log('✅ [API] Fix generated successfully');
      console.log('Response Data:', {
        hasFixedCode: !!data.fixedCode,
        hasExplanation: !!data.explanation,
        sessionId: data.sessionId
      });

      // Store sessionId from first fix if we don't have one yet
      if (data.sessionId && !debugSessionId) {
        console.log('💾 [STATE] Storing new session ID:', data.sessionId);
        setDebugSessionId(data.sessionId);
      }

      console.log('💾 [STATE] Updating issue status to completed');
      setIssuesWithFixes(prev => prev.map((item, idx) =>
        idx === index ? { ...item, fix: data, loading: false, status: 'completed' as const } : item
      ));

      // Check if all issues are done
      const allDone = issuesWithFixes.every((item, idx) =>
        idx === index ? true : (item.status === 'completed' || item.status === 'failed')
      );
      if (allDone) {
        console.log('✅ [STATE] All issues completed - switching to Ready tab');
        setActiveTab('ready');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [ERROR] Fix generation failed');
      console.error('Error:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      alert(`Failed to generate fix: ${error.message}`);
      setIssuesWithFixes(prev => prev.map((item, idx) =>
        idx === index ? { ...item, loading: false, status: 'failed' as const } : item
      ));
    }
  };

  const handleGenerateAllFixes = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [DEBUG] Generate All Fixes Button Clicked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total Issues:', issuesWithFixes.length);
    console.log('Pending Issues:', issuesWithFixes.filter(i => !i.fix).length);

    setGeneratingAll(true);
    setActiveTab('generating');

    for (let i = 0; i < issuesWithFixes.length; i++) {
      if (!issuesWithFixes[i].fix) {
        console.log(`\n📝 [BATCH] Processing issue ${i + 1}/${issuesWithFixes.length}`);
        await handleGenerateFix(i);
      }
    }

    console.log('✅ [BATCH] All fixes generated');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    setGeneratingAll(false);
    setActiveTab('ready');
  };

  const handlePushToGitHub = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [GITHUB] Push to GitHub Button Clicked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!repositoryInfo) {
      console.error('❌ [ERROR] Repository information not available');
      alert('Repository information not available');
      return;
    }

    const fixedIssues = issuesWithFixes.filter(item => item.fix !== null);
    console.log('Repository:', repositoryInfo);
    console.log('Fixed Issues Count:', fixedIssues.length);
    console.log('Session ID:', debugSessionId);

    if (fixedIssues.length === 0) {
      console.error('❌ [ERROR] No fixes generated yet');
      alert('No fixes generated yet. Generate fixes first before pushing.');
      return;
    }

    setPushing(true);

    try {
      const fixes = fixedIssues.map(item => ({
        file: item.issue.file,
        fixedCode: item.fix!.fixedCode,
        description: item.issue.description
      }));

      console.log('📦 [GITHUB] Preparing fixes for push:', fixes.length, 'files');
      fixes.forEach((fix, idx) => {
        console.log(`  ${idx + 1}. ${fix.file}`);
      });

      console.log('📡 [API] Sending push request to backend...');
      const response = await fetch('http://localhost:3000/api/debug/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryInfo,
          sessionId: debugSessionId,
          fixes,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [API] Push failed:', errorData);
        throw new Error(errorData.message || 'Failed to push fixes to GitHub');
      }

      const data = await response.json();
      console.log('✅ [GITHUB] Push successful!');
      console.log('Branch:', data.branch);
      console.log('Commit SHA:', data.commitSha);
      console.log('Details:', data.details);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      alert(`✅ Successfully pushed fixes to GitHub!\nBranch: ${data.branch}\nCommit: ${data.commitSha}`);
      // clearSelection(); // TODO: Implement clearSelection in DebugContext
    } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [ERROR] Push to GitHub failed');
      console.error('Error:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      alert(`Failed to push to GitHub: ${error.message}`);
    } finally {
      setPushing(false);
    }
  };

  const handleCopy = () => {
    if (result?.fixedCode) {
      navigator.clipboard.writeText(result.fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyFix = () => {
    if (result?.fixedCode) {
      setCode(result.fixedCode);
      setResult(null);
      setErrorMessage('');
    }
  };

  const getTabStats = () => {
    const pending = issuesWithFixes.filter(item => item.status === 'pending').length;
    const generating = issuesWithFixes.filter(item => item.status === 'generating').length;
    const completed = issuesWithFixes.filter(item => item.status === 'completed').length;
    return { pending, generating, completed };
  };

  const stats = getTabStats();

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-lime-500/10 rounded-xl">
              <Bug className="w-8 h-8 text-lime-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">AI Code Debugger</h1>
              <p className="text-gray-400 mt-1">Enterprise-grade bug fixing powered by AI</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Always Visible */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'input'
              ? 'border-lime-500 text-lime-400'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <FileCode className="w-5 h-5" />
            Select Issues
            {stats.pending > 0 && (
              <span className="px-2 py-0.5 bg-gray-700 text-white text-xs rounded-full">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('generating')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'generating'
              ? 'border-lime-500 text-lime-400'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <Zap className="w-5 h-5" />
            Generating Fixes
            {stats.generating > 0 && (
              <span className="px-2 py-0.5 bg-lime-500 text-black text-xs rounded-full animate-pulse">
                {stats.generating}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ready')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'ready'
              ? 'border-lime-500 text-lime-400'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <Rocket className="w-5 h-5" />
            Ready to Push
            {stats.completed > 0 && (
              <span className="px-2 py-0.5 bg-lime-500 text-black text-xs rounded-full">
                {stats.completed}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'history'
              ? 'border-lime-500 text-lime-400'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <Clock className="w-5 h-5" />
            History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'input' && (
          issuesWithFixes.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-lime-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-lime-500" />
                        <h2 className="text-xl font-semibold text-white">
                          {issuesWithFixes.length} Issue{issuesWithFixes.length > 1 ? 's' : ''} Selected
                        </h2>
                      </div>
                      {repositoryInfo && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <GitBranch className="w-4 h-4" />
                          <span>{repositoryInfo.owner}/{repositoryInfo.repo}</span>
                          {repositoryInfo.branch && <span>({repositoryInfo.branch})</span>}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleGenerateAllFixes}
                      disabled={generatingAll || stats.pending === 0}
                      className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate All Fixes
                    </button>
                  </div>
                </div>

                {issuesWithFixes.map((item, index) => (
                  <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${item.issue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            item.issue.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                              item.issue.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                            {item.issue.severity}
                          </span>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                            {item.issue.type}
                          </span>
                          {item.status === 'completed' && (
                            <span className="px-2 py-1 bg-lime-500/20 text-lime-400 rounded text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Fixed
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium mb-2">{item.issue.description}</p>
                        <p className="text-sm text-gray-400">
                          {item.issue.file}{item.issue.line && ` (line ${item.issue.line})`}
                        </p>
                        {item.issue.suggestion && (
                          <div className="mt-3 p-3 bg-lime-500/10 border border-lime-500/30 rounded">
                            <p className="text-sm text-lime-400">💡 {item.issue.suggestion}</p>
                          </div>
                        )}
                      </div>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleGenerateFix(index)}
                          disabled={item.loading}
                          className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Fix
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            /* Manual Debug Mode - when no issues selected */
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Bug className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No Issues Selected
              </h3>
              <p className="text-gray-500">
                Go to the Analysis Results page and select issues to debug, or check History for past sessions
              </p>
            </div>
          )
        )}

        {activeTab === 'generating' && (
          issuesWithFixes.length > 0 ? (
            <div className="space-y-6">
                <div className="bg-zinc-900 border border-lime-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
                        <Loader className="w-5 h-5 animate-spin text-lime-500" />
                        AI is Analyzing and Fixing Issues
                      </h2>
                      <p className="text-gray-400">
                        Applying enterprise-grade debugging methodology...
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-lime-400">
                        {stats.completed}/{issuesWithFixes.length}
                      </div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-500 transition-all duration-500"
                      style={{ width: `${(stats.completed / issuesWithFixes.length) * 100}%` }}
                    />
                  </div>
                </div>

                {issuesWithFixes.map((item, index) => (
                  <div key={index} className={`bg-zinc-900 border rounded-xl p-6 ${item.status === 'generating' ? 'border-lime-500/50 ring-2 ring-lime-500/20' :
                    item.status === 'completed' ? 'border-lime-500/30' :
                      'border-zinc-800'
                    }`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {item.status === 'pending' && (
                          <div className="w-6 h-6 border-2 border-gray-600 rounded-full" />
                        )}
                        {item.status === 'generating' && (
                          <Loader className="w-6 h-6 text-lime-500 animate-spin" />
                        )}
                        {item.status === 'completed' && (
                          <CheckCircle className="w-6 h-6 text-lime-500" />
                        )}
                        {item.status === 'failed' && (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${item.issue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            item.issue.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                              item.issue.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                            {item.issue.severity}
                          </span>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                            {item.issue.type}
                          </span>
                        </div>

                        <p className="text-white font-medium mb-1">{item.issue.description}</p>
                        <p className="text-sm text-gray-400 mb-3">
                          {item.issue.file}{item.issue.line && ` (line ${item.issue.line})`}
                        </p>

                        {item.status === 'generating' && (
                          <div className="flex items-center gap-2 text-sm text-lime-400">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span>Senior AI engineer analyzing code...</span>
                          </div>
                        )}

                        {item.status === 'completed' && item.fix && (
                          <div className="text-sm text-lime-400 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Fix generated successfully
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Zap className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No Active Generation
              </h3>
              <p className="text-gray-500">
                Select issues from the Input tab to start generating fixes
              </p>
            </div>
          )
        )}

        {activeTab === 'ready' && (
          issuesWithFixes.length > 0 && stats.completed > 0 ? (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-lime-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
                        <CheckCircle className="w-6 h-6 text-lime-500" />
                        All Fixes Ready!
                      </h2>
                      <p className="text-gray-400">
                        {stats.completed} issue{stats.completed > 1 ? 's' : ''} fixed and ready to push to GitHub
                      </p>
                    </div>
                    <button
                      onClick={handlePushToGitHub}
                      disabled={pushing || stats.completed === 0}
                      className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {pushing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Pushing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Push to GitHub
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {issuesWithFixes.filter(item => item.status === 'completed').map((item, index) => (
                  <div key={index} className="bg-zinc-900 border border-lime-500/30 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <CheckCircle className="w-5 h-5 text-lime-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${item.issue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            item.issue.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                              item.issue.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                            {item.issue.severity}
                          </span>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                            {item.issue.type}
                          </span>
                        </div>
                        <p className="text-white font-medium mb-1">{item.issue.description}</p>
                        <p className="text-sm text-gray-400">
                          {item.issue.file}{item.issue.line && ` (line ${item.issue.line})`}
                        </p>
                      </div>
                    </div>

                    {item.fix && (
                      <div className="space-y-4">
                        <div className="bg-[#0a0a0a] border border-lime-500/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-lime-400">✨ Fixed Code</h4>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.fix!.fixedCode);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                          </div>
                          <pre className="text-sm text-gray-300 overflow-x-auto max-h-64">
                            <code>{item.fix.fixedCode}</code>
                          </pre>
                        </div>

                        <div className="bg-[#0a0a0a] border border-zinc-700 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-lime-500" />
                            Senior Engineer Analysis
                          </h4>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {item.fix.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Rocket className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No Fixes Ready
              </h3>
              <p className="text-gray-500">
                Generate fixes for issues to see them here, ready to push to GitHub
              </p>
            </div>
          )
        )}

        {activeTab === 'history' && (
          <DebugHistory />
        )}

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-lime-500/10 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-lime-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-400 text-sm">
              Advanced AI models analyze your code and identify bugs, syntax errors, and logic issues
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-lime-500/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-lime-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Fixes</h3>
            <p className="text-gray-400 text-sm">
              Get working code instantly with one-click fixes and detailed explanations
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-lime-500/10 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-lime-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Language Support</h3>
            <p className="text-gray-400 text-sm">
              Supports 10+ programming languages including JavaScript, Python, Java, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
