import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  highlight?: boolean;
}

export function StatCard({ title, value, icon, trend, highlight = false }: StatCardProps) {
  return (
    <div
      className={`bg-dark-card rounded-lg border p-6 transition-all ${
        highlight
          ? 'border-red-500/50 shadow-lg shadow-red-500/20'
          : 'border-dark-border hover:border-lime-500/30'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-lime-500/10 rounded-lg text-lime-400">{icon}</div>
        {trend && (
          <span className="text-xs text-gray-400 px-2 py-1 bg-dark-bg rounded">
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
