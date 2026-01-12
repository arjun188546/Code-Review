import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const userId = params.get('userId');

    if (token && userStr) {
      localStorage.setItem('github_token', token);
      localStorage.setItem('github_user', userStr);
      if (userId) {
        localStorage.setItem('userId', userId); // Store Convex user ID
      }
      navigate('/repositories');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
    </div>
  );
}
