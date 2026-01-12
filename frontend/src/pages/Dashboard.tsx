import React from 'react';
import { useReviews, useStats } from '../hooks/useReviews';
import { ReviewCard } from '../components/ReviewCard';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { TrendingUp, AlertCircle, Clock, FileCheck, Search, Calendar, User } from 'lucide-react';

export function Dashboard() {
  const { data: reviews = [], isLoading: reviewsLoading } = useReviews({ limit: 10 });
  const { data: stats, isLoading: statsLoading } = useStats();

  if (reviewsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A1A1A]"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#BFFF00] absolute top-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#0A0A0A] border-b border-[#1A1A1A] sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search project, analytics, etc..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#BFFF00] transition-colors"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <button className="bg-[#BFFF00] text-black font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-[#A8E600] transition-colors">
                Monthly
              </button>
              <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BFFF00] to-[#8B9F00] flex items-center justify-center">
                  <User className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm text-white font-medium">Developer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Code Review Analytics</h1>
          <p className="text-gray-400 text-lg">Comprehensive overview of your repository analysis</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Reviews - Lime Green */}
            <div className="group relative bg-gradient-to-br from-[#BFFF00] to-[#8B9F00] rounded-2xl p-6 overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-black bg-opacity-20 p-3 rounded-xl">
                    <FileCheck className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-xs font-semibold text-black bg-black bg-opacity-10 px-3 py-1 rounded-full">
                    +12% this week
                  </span>
                </div>
                <div className="text-5xl font-bold text-black mb-1">{stats.totalReviews}</div>
                <div className="text-sm font-medium text-black opacity-80 uppercase tracking-wide">Total Reviews</div>
              </div>
            </div>

            {/* Avg Complexity - Olive Green */}
            <div className="group relative bg-gradient-to-br from-[#8B9F00] to-[#6B7F00] rounded-2xl p-6 overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white bg-opacity-10 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-5xl font-bold text-white mb-1">{stats.avgComplexity || 'N/A'}<span className="text-2xl opacity-60">/10</span></div>
                <div className="text-sm font-medium text-white opacity-80 uppercase tracking-wide">Avg Complexity</div>
              </div>
            </div>

            {/* Critical Issues - Dark with Red Accent */}
            <div className={`group relative rounded-2xl p-6 overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer ${stats.criticalIssues > 0
                ? 'bg-gradient-to-br from-red-600 to-red-800'
                : 'bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A]'
              }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stats.criticalIssues > 0 ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-5'}`}>
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  {stats.criticalIssues > 0 && (
                    <span className="text-xs font-semibold text-white bg-white bg-opacity-20 px-3 py-1 rounded-full animate-pulse">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="text-5xl font-bold text-white mb-1">{stats.criticalIssues}</div>
                <div className="text-sm font-medium text-white opacity-80 uppercase tracking-wide">Critical Issues</div>
              </div>
            </div>

            {/* Avg Analysis Time - Gold Gradient */}
            <div className="group relative bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-2xl p-6 overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-black bg-opacity-20 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-black" />
                  </div>
                </div>
                <div className="text-5xl font-bold text-black mb-1">{(stats.avgAnalysisTime / 1000).toFixed(1)}<span className="text-2xl opacity-60">s</span></div>
                <div className="text-sm font-medium text-black opacity-80 uppercase tracking-wide">Avg Analysis Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AnalyticsChart title="Issues by Severity" data={stats} type="severity" />
            <AnalyticsChart title="Issues by Type" data={stats} type="type" />
          </div>
        )}

        {/* Recent Reviews */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Recent Reviews</h2>
            <a
              href="/reviews"
              className="text-[#BFFF00] hover:text-[#A8E600] text-sm font-semibold flex items-center gap-2 group"
            >
              <span>View all</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-16 text-center">
                <div className="w-16 h-16 bg-[#BFFF00] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-8 h-8 text-[#BFFF00]" />
                </div>
                <p className="text-gray-400 text-lg mb-2">No reviews yet</p>
                <p className="text-gray-500 text-sm">Connect a repository to get started with AI-powered code analysis!</p>
              </div>
            ) : (
              reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
