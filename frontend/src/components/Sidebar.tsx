import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSearch, 
  BarChart3, 
  Settings, 
  Github,
  Activity,
  FolderGit2,
  Zap,
  Bug,
  LogOut
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/reviews', icon: FileSearch, label: 'Reviews' },
    { path: '/debug', icon: Bug, label: 'Debug' },
    { path: '/repositories', icon: FolderGit2, label: 'Repositories' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/activity', icon: Activity, label: 'Activity' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-0 top-0 w-20 h-screen bg-[#0a0a0a] border-r border-zinc-800 flex flex-col items-center py-6 z-40">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
          <Github className="w-7 h-7 text-black" />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-2 w-full px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center justify-center w-full h-14 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/30'
                  : 'text-gray-500 hover:bg-zinc-900 hover:text-gray-300'
              }`}
              title={item.label}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-black' : ''}`} />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-zinc-700">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status Indicator at Bottom */}
      <div className="mt-auto pt-4 border-t border-zinc-800 w-full px-3 space-y-2">
        {/* Logout Button */}
        <Link
          to="/logout"
          className="group relative flex items-center justify-center w-full h-14 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
          
          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-zinc-700">
            Logout
          </div>
        </Link>

        {/* Status Indicator */}
        <div className="flex items-center justify-center w-full h-14 rounded-xl bg-zinc-900 group cursor-pointer relative">
          <div className="w-3 h-3 bg-lime-500 rounded-full animate-pulse shadow-lg shadow-lime-500/50"></div>
          
          {/* Status Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-zinc-700">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-lime-500" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
