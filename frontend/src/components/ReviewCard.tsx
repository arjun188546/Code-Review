import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Review } from '../types';
import { ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const navigate = useNavigate();

  const severityColors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const recommendationColors = {
    APPROVE: 'text-green-400',
    REQUEST_CHANGES: 'text-red-400',
    COMMENT: 'text-yellow-400',
  };

  const statusColors = {
    completed: 'bg-green-500/20 text-green-400',
    analyzing: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
    pending: 'bg-gray-500/20 text-gray-400',
  };

  const issueCounts = {
    CRITICAL: (review.issues || []).filter((i) => i.severity === 'CRITICAL').length,
    HIGH: (review.issues || []).filter((i) => i.severity === 'HIGH').length,
    MEDIUM: (review.issues || []).filter((i) => i.severity === 'MEDIUM').length,
    LOW: (review.issues || []).filter((i) => i.severity === 'LOW').length,
  };

  const handleClick = () => {
    // If prUrl starts with /analysis, it's a repository analysis - navigate to that page
    // Otherwise navigate to review details page
    if (review.prUrl.startsWith('/analysis')) {
      navigate(review.prUrl);
    } else {
      navigate(`/reviews/${review.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-dark-card rounded-lg border border-dark-border p-6 hover:border-lime-500/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <a
              href={review.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-2"
            >
              #{review.prNumber}: {review.prTitle}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {review.analyzedAt && !isNaN(Number(review.analyzedAt))
                ? formatDistanceToNow(new Date(Number(review.analyzedAt)), { addSuffix: true })
                : review.createdAt && !isNaN(Number(review.createdAt))
                  ? formatDistanceToNow(new Date(Number(review.createdAt)), { addSuffix: true })
                  : 'Recently'}
            </span>
            <span>•</span>
            <span>{review.repository?.fullName || 'Unknown'}</span>
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-3xl font-bold text-lime-400">
            {review.complexityScore || '-'}/10
          </div>
          <p className="text-xs text-gray-500">Complexity</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[review.status as keyof typeof statusColors]
            }`}
        >
          {review.status.toUpperCase()}
        </span>
        {review.recommendation && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${recommendationColors[review.recommendation as keyof typeof recommendationColors]
              }`}
          >
            {review.recommendation}
          </span>
        )}
      </div>

      {review.issues && review.issues.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(issueCounts).map(
            ([severity, count]) =>
              count > 0 && (
                <span
                  key={severity}
                  className={`px-2 py-1 rounded text-xs font-medium border ${severityColors[severity as keyof typeof severityColors]
                    }`}
                >
                  {severity}: {count}
                </span>
              )
          )}
        </div>
      )}

      {review.metrics && (
        <div className="mt-4 pt-4 border-t border-dark-border grid grid-cols-3 gap-4 text-xs text-gray-400">
          <div>
            <span className="text-gray-500">Files:</span>{' '}
            <span className="text-white">{review.metrics.filesChanged}</span>
          </div>
          <div>
            <span className="text-gray-500">+{review.metrics.linesAdded}</span> /{' '}
            <span className="text-gray-500">-{review.metrics.linesDeleted}</span>
          </div>
          <div>
            <span className="text-gray-500">Time:</span>{' '}
            <span className="text-white">{(review.metrics.analysisTimeMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      )}
    </div>
  );
}
