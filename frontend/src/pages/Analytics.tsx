import React from 'react';
import { useReviews, useStats } from '../hooks/useReviews';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { StatCard } from '../components/StatCard';
import { TrendingUp, Target, Zap, Shield } from 'lucide-react';

export function Analytics() {
  const { data: reviews = [] } = useReviews({ limit: 100 });
  const { data: stats } = useStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  const securityIssues = stats.issuesByType?.security || 0;
  const performanceIssues = stats.issuesByType?.performance || 0;
  const codeQualityScore = Math.max(0, 100 - (stats.avgComplexity || 0) * 10).toFixed(0);

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Deep insights into code quality and trends</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Code Quality Score"
            value={`${codeQualityScore}%`}
            icon={<Target className="w-5 h-5" />}
          />
          <StatCard
            title="Security Issues"
            value={securityIssues}
            icon={<Shield className="w-5 h-5" />}
            highlight={securityIssues > 5}
          />
          <StatCard
            title="Performance Issues"
            value={performanceIssues}
            icon={<Zap className="w-5 h-5" />}
            highlight={performanceIssues > 10}
          />
          <StatCard
            title="Code Efficiency"
            value={`${Math.max(0, 100 - performanceIssues * 5)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Detailed Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsChart title="Issues by Severity" data={stats} type="severity" />
          <AnalyticsChart title="Issues by Type" data={stats} type="type" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AnalyticsChart title="Review Trends Over Time" data={reviews} type="timeline" />
        </div>

        {/* Issue Breakdown */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-card rounded-lg border border-dark-border p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Severity Distribution</h3>
            <div className="space-y-3">
              {stats.issuesBySeverity && Object.entries(stats.issuesBySeverity).map(([severity, count]) => {
                const total = Object.values(stats.issuesBySeverity).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                const colors: Record<string, string> = {
                  CRITICAL: 'bg-red-500',
                  HIGH: 'bg-orange-500',
                  MEDIUM: 'bg-yellow-500',
                  LOW: 'bg-blue-500',
                };

                return (
                  <div key={severity}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">{severity}</span>
                      <span className="text-sm text-white">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-dark-bg rounded-full h-2">
                      <div
                        className={`${colors[severity]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {(!stats.issuesBySeverity || Object.keys(stats.issuesBySeverity).length === 0) && (
                <p className="text-gray-400 text-sm">No data available</p>
              )}
            </div>
          </div>

          <div className="bg-dark-card rounded-lg border border-dark-border p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Issue Type Distribution</h3>
            <div className="space-y-3">
              {stats.issuesByType && Object.entries(stats.issuesByType).map(([type, count]) => {
                const total = Object.values(stats.issuesByType).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400 capitalize">{type}</span>
                      <span className="text-sm text-white">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-dark-bg rounded-full h-2">
                      <div
                        className="bg-lime-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {(!stats.issuesByType || Object.keys(stats.issuesByType).length === 0) && (
                <p className="text-gray-400 text-sm">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
