import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebug } from '../contexts/DebugContext';
import {
    ArrowLeft, Loader, CheckCircle, XCircle, AlertTriangle,
    TrendingUp, FileCode, Clock, Sparkles, AlertCircle, Bug
} from 'lucide-react';

interface Analysis {
    _id: string;
    _creationTime: number;
    status: string;
    aiProvider: string;
    overallScore?: number;
    totalFiles: number;
    filesAnalyzed: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    summary?: string;
    recommendations?: string[];
    analyzedAt?: number;
    failureReason?: string;
    issues?: Issue[];
}

interface Issue {
    severity: string;
    type: string;
    file: string;
    line?: number;
    description: string;
    suggestion?: string;
    codeExample?: string;
}

export function AnalysisResults() {
    const { analysisId } = useParams<{ analysisId: string }>();
    const navigate = useNavigate();
    const { setSelectedIssues, setRepositoryInfo } = useDebug();
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
    const [selectedIssueIndices, setSelectedIssueIndices] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!analysisId) {
            setError('No analysis ID provided');
            setLoading(false);
            return;
        }

        // Poll for updates every 2 seconds
        const fetchAnalysis = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/analysis/${analysisId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch analysis');
                }

                const data = await response.json();
                setAnalysis(data);
                setLoading(false);

                // Calculate estimated time if still analyzing
                if (data.status === 'analyzing' && data.totalFiles > 0) {
                    const filesRemaining = data.totalFiles - data.filesAnalyzed;
                    const avgTimePerFile = 2; // seconds (estimate)
                    const estimated = filesRemaining * avgTimePerFile;
                    setEstimatedTime(estimated);
                } else {
                    setEstimatedTime(null);
                }
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchAnalysis();
        const interval = setInterval(fetchAnalysis, 2000);

        return () => clearInterval(interval);
    }, [analysisId]);

    if (loading && !analysis) {
        return (
            <div className="flex items-center justify-center h-screen bg-dark-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="min-h-screen bg-dark-bg p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Analysis</h2>
                        <p className="text-gray-400">{error || 'Analysis not found'}</p>
                        <button
                            onClick={() => navigate('/repositories')}
                            className="mt-4 px-4 py-2 bg-lime-500 text-black rounded-lg hover:bg-lime-400"
                        >
                            Back to Repositories
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const progress = analysis.totalFiles > 0
        ? (analysis.filesAnalyzed / analysis.totalFiles) * 100
        : 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'analyzing': return 'text-yellow-400';
            case 'failed': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-6 h-6" />;
            case 'analyzing': return <Loader className="w-6 h-6 animate-spin" />;
            case 'failed': return <XCircle className="w-6 h-6" />;
            default: return <Clock className="w-6 h-6" />;
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    const toggleIssueSelection = (index: number) => {
        const newSelection = new Set(selectedIssueIndices);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelectedIssueIndices(newSelection);
    };

    const handleDebugSelected = async () => {
        if (!analysis || !analysis.issues || selectedIssueIndices.size === 0) {
            alert('Please select at least one issue to debug');
            return;
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🐛 [DEBUG] Debug Selected Issues Button Clicked');
        console.log('Selected Issues Count:', selectedIssueIndices.size);
        console.log('Analysis ID:', analysisId);

        const selectedIssuesArray = Array.from(selectedIssueIndices).map(idx => analysis.issues![idx]);
        setSelectedIssues(selectedIssuesArray);

        // Fetch repository info from Convex using the analysis data
        try {
            console.log('📡 [API] Fetching repository info from analysis...');
            const response = await fetch(`http://localhost:3000/api/analysis/${analysisId}/repository`);

            if (response.ok) {
                const repoData = await response.json();
                console.log('✅ [API] Repository data retrieved:', repoData);

                setRepositoryInfo({
                    owner: repoData.owner,
                    repo: repoData.name,
                    branch: repoData.defaultBranch || 'main'
                });
            } else {
                console.warn('⚠️ [API] Failed to fetch repository info, using defaults');
                // Fallback to placeholder if API fails
                setRepositoryInfo({
                    owner: 'owner',
                    repo: 'repo',
                    branch: 'main'
                });
            }
        } catch (error) {
            console.error('❌ [ERROR] Failed to fetch repository info:', error);
            // Fallback to placeholder if error occurs
            setRepositoryInfo({
                owner: 'owner',
                repo: 'repo',
                branch: 'main'
            });
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        navigate('/debug');
    };

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/repositories')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Repositories
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Repository Analysis</h1>
                            <p className="text-gray-400">
                                AI Provider: <span className="text-lime-400 font-medium">{analysis.aiProvider.toUpperCase()}</span>
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 ${getStatusColor(analysis.status)}`}>
                            {getStatusIcon(analysis.status)}
                            <span className="text-lg font-semibold capitalize">{analysis.status}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar (if analyzing) */}
                {analysis.status === 'analyzing' && (
                    <div className="bg-dark-card rounded-lg border border-dark-border p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Analysis in Progress</h3>
                                <p className="text-sm text-gray-400">
                                    {analysis.filesAnalyzed} of {analysis.totalFiles} files analyzed
                                </p>
                            </div>
                            {estimatedTime !== null && (
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Estimated time remaining</p>
                                    <p className="text-2xl font-bold text-lime-400">{formatTime(estimatedTime)}</p>
                                </div>
                            )}
                        </div>
                        <div className="w-full bg-dark-bg rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-lime-500 h-full transition-all duration-500 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-2">{Math.round(progress)}% Complete</p>
                    </div>
                )}

                {/* Failed State */}
                {analysis.status === 'failed' && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <XCircle className="w-6 h-6 text-red-500" />
                            <h3 className="text-lg font-semibold text-red-500">Analysis Failed</h3>
                        </div>
                        <p className="text-gray-400">{analysis.failureReason || 'Unknown error occurred'}</p>
                    </div>
                )}

                {/* Results (if completed) */}
                {analysis.status === 'completed' && (
                    <>
                        {/* Overall Score */}
                        <div className="bg-dark-card rounded-lg border border-dark-border p-8 mb-6 text-center">
                            <p className="text-sm text-gray-400 mb-2">Overall Code Quality Score</p>
                            <p className={`text-6xl font-bold ${getScoreColor(analysis.overallScore || 0)}`}>
                                {analysis.overallScore || 0}
                            </p>
                            <p className="text-gray-400 mt-2">out of 100</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <FileCode className="w-8 h-8 text-lime-400" />
                                    <span className="text-3xl font-bold text-white">{analysis.filesAnalyzed}</span>
                                </div>
                                <p className="text-sm text-gray-400">Files Analyzed</p>
                            </div>

                            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                                    <span className="text-3xl font-bold text-white">{analysis.totalIssues}</span>
                                </div>
                                <p className="text-sm text-gray-400">Total Issues</p>
                            </div>

                            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <AlertTriangle className="w-8 h-8 text-red-400" />
                                    <span className="text-3xl font-bold text-white">{analysis.criticalIssues}</span>
                                </div>
                                <p className="text-sm text-gray-400">Critical Issues</p>
                            </div>

                            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="w-8 h-8 text-blue-400" />
                                    <span className="text-3xl font-bold text-white">
                                        {analysis.analyzedAt
                                            ? formatTime(Math.round((analysis.analyzedAt - analysis._creationTime) / 1000))
                                            : 'N/A'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400">Analysis Time</p>
                            </div>
                        </div>

                        {/* Issues by Severity */}
                        <div className="bg-dark-card rounded-lg border border-dark-border p-6 mb-6">
                            <h3 className="text-xl font-semibold text-white mb-4">Issues by Severity</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-gray-300">Critical</span>
                                    </div>
                                    <span className="text-white font-semibold">{analysis.criticalIssues}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                        <span className="text-gray-300">High</span>
                                    </div>
                                    <span className="text-white font-semibold">{analysis.highIssues}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <span className="text-gray-300">Medium</span>
                                    </div>
                                    <span className="text-white font-semibold">{analysis.mediumIssues}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-gray-300">Low</span>
                                    </div>
                                    <span className="text-white font-semibold">{analysis.lowIssues}</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        {analysis.summary && (
                            <div className="bg-dark-card rounded-lg border border-dark-border p-6 mb-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Summary</h3>
                                <p className="text-gray-300">{analysis.summary}</p>
                            </div>
                        )}

                        {/* Recommendations */}
                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                            <div className="bg-dark-card rounded-lg border border-dark-border p-6 mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-6 h-6 text-lime-400" />
                                    <h3 className="text-xl font-semibold text-white">Recommendations</h3>
                                </div>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-gray-300">
                                            <TrendingUp className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Detailed Issues */}
                        {analysis.issues && analysis.issues.length > 0 && (
                            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-white">Detailed Issues</h3>
                                    {selectedIssueIndices.size > 0 && (
                                        <button
                                            onClick={handleDebugSelected}
                                            className="flex items-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded-lg transition-colors"
                                        >
                                            <Bug className="w-5 h-5" />
                                            Debug {selectedIssueIndices.size} Selected Issue{selectedIssueIndices.size > 1 ? 's' : ''}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {analysis.issues.map((issue, idx) => (
                                        <div
                                            key={idx}
                                            className={`bg-dark-bg rounded-lg border ${selectedIssueIndices.has(idx) ? 'border-lime-500/50' : 'border-dark-border'} p-4 cursor-pointer transition-all`}
                                            onClick={() => toggleIssueSelection(idx)}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIssueIndices.has(idx)}
                                                        onChange={() => toggleIssueSelection(idx)}
                                                        className="w-5 h-5 rounded border-gray-600 text-lime-500 focus:ring-lime-500 focus:ring-offset-0 bg-dark-bg"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-semibold ${issue.severity === 'CRITICAL'
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : issue.severity === 'HIGH'
                                                                    ? 'bg-orange-500/20 text-orange-400'
                                                                    : issue.severity === 'MEDIUM'
                                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                                        : 'bg-blue-500/20 text-blue-400'
                                                                }`}
                                                        >
                                                            {issue.severity}
                                                        </span>
                                                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                                                            {issue.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-white font-medium mb-1">{issue.description}</p>
                                            <p className="text-sm text-gray-400 mb-2">
                                                {issue.file}
                                                {issue.line && ` (line ${issue.line})`}
                                            </p>
                                            {issue.suggestion && (
                                                <div className="mt-3 p-3 bg-lime-500/10 border border-lime-500/30 rounded">
                                                    <p className="text-sm text-lime-400 font-medium mb-1">💡 Suggestion:</p>
                                                    <p className="text-sm text-gray-300">{issue.suggestion}</p>
                                                </div>
                                            )}
                                            {issue.codeExample && (
                                                <div className="mt-3">
                                                    <p className="text-sm text-gray-400 mb-1">Example:</p>
                                                    <pre className="bg-dark-bg p-3 rounded border border-dark-border overflow-x-auto">
                                                        <code className="text-sm text-gray-300">{issue.codeExample}</code>
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
