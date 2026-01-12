import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviews, useRepositories } from '../hooks/useReviews';
import { ReviewCard } from '../components/ReviewCard';
import { Search, FileCode } from 'lucide-react';

export function Reviews() {
  const [status, setStatus] = useState<string>('');
  const [repositoryId, setRepositoryId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: reviews = [], isLoading: reviewsLoading } = useReviews({
    status: status || undefined,
    repositoryId: repositoryId || undefined,
  });

  const { data: repositories = [] } = useRepositories();

  const filteredReviews = reviews.filter((review) =>
    review.prTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (reviewsLoading) {
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
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Code Analysis</h1>
          <p className="text-gray-400 text-lg">Browse PR reviews and repository analyses</p>
        </div>

        {/* Filters */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by repository..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#BFFF00] transition-colors"
              />
            </div>

            {/* Repository Filter */}
            <select
              value={repositoryId}
              onChange={(e) => setRepositoryId(e.target.value)}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BFFF00] transition-colors"
            >
              <option key="all-repos" value="">All Repositories</option>
              {repositories.map((repo: any) => (
                <option key={repo.id} value={repo.id}>
                  {repo.fullName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BFFF00] transition-colors"
            >
              <option key="all-status" value="">All Status</option>
              <option key="status-completed" value="completed">Completed</option>
              <option key="status-analyzing" value="analyzing">Analyzing</option>
              <option key="status-failed" value="failed">Failed</option>
              <option key="status-pending" value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              PR Reviews ({filteredReviews.length})
            </h2>
          </div>

          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-16 text-center">
                <div className="w-16 h-16 bg-[#BFFF00] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCode className="w-8 h-8 text-[#BFFF00]" />
                </div>
                <p className="text-gray-400 text-lg mb-2">No reviews found</p>
                <p className="text-gray-500 text-sm">
                  {searchTerm || status || repositoryId
                    ? 'Try adjusting your filters'
                    : 'Go to Repositories and analyze one!'}
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => <ReviewCard key={review.id} review={review} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
