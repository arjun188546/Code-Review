import React from 'react';
import { useReviews } from '../hooks/useReviews';
import { Activity as ActivityIcon, Clock, GitPullRequest, CheckCircle, XCircle, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Activity() {
  const { data: reviews = [], isLoading } = useReviews({ limit: 50 });

  const activities = reviews
    .flatMap((review) => [
      {
        id: `review-${review.id}`,
        type: 'review',
        title: `Analysis completed for PR #${review.prNumber}`,
        description: review.prTitle,
        timestamp: review.analyzedAt || review.createdAt,
        status: review.recommendation,
        url: review.prUrl,
      },
    ])
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Activity Feed</h1>
          <p className="text-gray-400">Real-time code review activity and events</p>
        </div>

        <div className="bg-dark-card rounded-lg border border-dark-border">
          <div className="p-6 border-b border-dark-border">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {reviews.slice(0, 20).map((review: any) => (
                <div
                  key={review.id}
                  className="flex items-start gap-4 pb-4 border-b border-dark-border last:border-0"
                >
                  <div className="p-2 bg-lime-500/10 rounded-lg">
                    <Target className="w-5 h-5 text-lime-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      Review completed for PR #{review.prNumber}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {review.repository.fullName} • {review.prTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
