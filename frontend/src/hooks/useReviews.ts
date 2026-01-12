import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../api/client';
import { Review, Stats } from '../types';

export function useReviews(params?: { limit?: number; status?: string; repositoryId?: string }) {
  return useQuery<Review[]>({
    queryKey: ['reviews', params],
    queryFn: async () => {
      const { data } = await reviewsApi.getReviews(params);
      return data;
    },
  });
}

export function useReview(id: string) {
  return useQuery<Review>({
    queryKey: ['review', id],
    queryFn: async () => {
      const { data } = await reviewsApi.getReview(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await reviewsApi.getStats();
      return data;
    },
  });
}

export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const { data } = await reviewsApi.getRepositories();
      return data;
    },
  });
}

export function useAnalyses() {
  return useQuery({
    queryKey: ['analyses'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/analyses');
      if (!response.ok) throw new Error('Failed to fetch analyses');
      return response.json();
    },
  });
}
