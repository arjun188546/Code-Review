import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Stats } from '../types';

interface AnalyticsChartProps {
  title: string;
  data: Stats;
  type: 'severity' | 'type';
}

export function AnalyticsChart({ title, data, type }: AnalyticsChartProps) {
  const renderChart = () => {
    if (type === 'severity' && 'issuesBySeverity' in data) {
      const chartData = [
        { name: 'Critical', value: data.issuesBySeverity.CRITICAL, value2: data.issuesBySeverity.CRITICAL * 0.7 },
        { name: 'High', value: data.issuesBySeverity.HIGH, value2: data.issuesBySeverity.HIGH * 0.8 },
        { name: 'Medium', value: data.issuesBySeverity.MEDIUM, value2: data.issuesBySeverity.MEDIUM * 0.6 },
        { name: 'Low', value: data.issuesBySeverity.LOW, value2: data.issuesBySeverity.LOW * 0.75 },
      ];

      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#404040"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={{ stroke: '#1a1a1a' }}
            />
            <YAxis
              stroke="#404040"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={{ stroke: '#1a1a1a' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              cursor={{ fill: 'rgba(132, 204, 22, 0.05)' }}
            />
            <Bar dataKey="value2" fill="#6b7c15" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="value" fill="#84cc16" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'type' && 'issuesByType' in data) {
      const chartData = [
        { name: 'Bug', value: data.issuesByType.bug, value2: data.issuesByType.bug * 0.65 },
        { name: 'Security', value: data.issuesByType.security, value2: data.issuesByType.security * 0.8 },
        { name: 'Performance', value: data.issuesByType.performance, value2: data.issuesByType.performance * 0.7 },
        { name: 'Quality', value: data.issuesByType.quality, value2: data.issuesByType.quality * 0.75 },
        { name: 'Style', value: data.issuesByType.style, value2: data.issuesByType.style * 0.6 },
      ];

      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#404040"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={{ stroke: '#1a1a1a' }}
            />
            <YAxis
              stroke="#404040"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={{ stroke: '#1a1a1a' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              cursor={{ fill: 'rgba(132, 204, 22, 0.05)' }}
            />
            <Bar dataKey="value2" fill="#6b7c15" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="value" fill="#84cc16" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-white">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-lime-500 rounded"></div>
            <span>With transition</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#6b7c15] rounded"></div>
            <span>Without transition</span>
          </div>
        </div>
      </div>
      {renderChart()}
    </div>
  );
}
