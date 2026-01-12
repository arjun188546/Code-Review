import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const reviewsApi = {
  getReviews: (params?: { limit?: number; status?: string; repositoryId?: string }) =>
    api.get('/reviews', { params }),
  
  getReview: (id: string) =>
    api.get(`/reviews/${id}`),
  
  getStats: () =>
    api.get('/stats'),
  
  getRepositories: () =>
    api.get('/repositories'),
};
