import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle } from 'lucide-react';

export function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear all authentication and session data
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('userId');
    localStorage.removeItem('debug_session_state');
    
    // Redirect to login after a brief delay
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-lime-500/10 rounded-full flex items-center justify-center">
                <LogOut className="w-10 h-10 text-lime-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Logged Out Successfully
          </h1>
          <p className="text-gray-400 mb-6">
            You have been logged out of your account.
          </p>

          {/* Loading Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-lime-500"></div>
            <span>Redirecting to login...</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Thank you for using Code Review AI
          </p>
        </div>
      </div>
    </div>
  );
}
