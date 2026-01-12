import React, { useState, useEffect } from 'react';
import { Github, LogIn } from 'lucide-react';

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('github_token');
    if (token) {
      window.location.href = '/repositories';
    }
  }, []);

  useEffect(() => {
    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Smooth follow animation with delay
    const animateGlow = () => {
      setGlowPosition(prev => ({
        x: prev.x + (mousePosition.x - prev.x) * 0.1,
        y: prev.y + (mousePosition.y - prev.y) * 0.1,
      }));
    };

    const animationFrame = requestAnimationFrame(animateGlow);
    return () => cancelAnimationFrame(animationFrame);
  }, [mousePosition, glowPosition]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/login');
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main cursor glow */}
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl transition-colors duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(190, 255, 0, 0.3) 0%, transparent 70%)',
            left: `${glowPosition.x - 192}px`,
            top: `${glowPosition.y - 192}px`,
            transform: 'translate3d(0, 0, 0)',
          }}
        />
        
        {/* Secondary glow with delay */}
        <div
          className="absolute w-64 h-64 rounded-full opacity-30 blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(190, 255, 0, 0.2) 0%, transparent 70%)',
            left: `${glowPosition.x - 128}px`,
            top: `${glowPosition.y - 128}px`,
            transform: 'translate3d(0, 0, 0)',
            transition: 'left 0.3s ease-out, top 0.3s ease-out',
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => {
          const offset = i * 18;
          const distance = 50 + (i % 5) * 30;
          return (
            <div
              key={i}
              className="absolute w-2 h-2 bg-lime-500/30 rounded-full blur-sm"
              style={{
                left: `${glowPosition.x + Math.cos((offset + glowPosition.x) * 0.01) * distance}px`,
                top: `${glowPosition.y + Math.sin((offset + glowPosition.y) * 0.01) * distance}px`,
                transform: 'translate3d(0, 0, 0)',
                transition: 'all 0.2s ease-out',
                animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          );
        })}

        {/* Grid overlay effect */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(190, 255, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(190, 255, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full relative z-10">
        <div 
          className="bg-zinc-900/80 backdrop-blur-xl rounded-xl border border-zinc-800/50 p-8 text-center shadow-2xl"
          style={{
            transform: `perspective(1000px) rotateX(${(mousePosition.y - window.innerHeight / 2) * -0.01}deg) rotateY(${(mousePosition.x - window.innerWidth / 2) * 0.01}deg)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <div className="mb-6">
            <div className="inline-flex p-4 bg-lime-500/10 rounded-full mb-4">
              <Github className="w-12 h-12 text-lime-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              CodeReview AI Agent
            </h1>
            <p className="text-gray-400">
              Sign in with GitHub to manage your code reviews
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in with GitHub
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-sm text-gray-500">
              By signing in, you'll be able to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-400 text-left">
              <li className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                View all your repositories
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                Enable AI code reviews
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                Manage webhooks automatically
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSS Animation for floating effect */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
