'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ProblemStat } from '@/lib/types';

interface ProblemStatsChartProps {
  data: ProblemStat[];
}

const SOLVED_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#eab308',
  Hard: '#ef4444',
};

const REMAINING_COLORS: Record<string, string> = {
  Easy: '#bbf7d0',
  Medium: '#fef08a',
  Hard: '#fecaca',
};

const REMAINING_DARK: Record<string, string> = {
  Easy: '#14532d',
  Medium: '#713f12',
  Hard: '#7f1d1d',
};

interface LabelPayload {
  value: string | number;
  dataKey: string;
  color: string;
}

function CustomLegend({ payload }: { payload?: LabelPayload[] }) {
  if (!payload) return null;
  return (
    <div className="flex gap-4 justify-center text-xs text-foreground/70 mt-2">
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
          {String(entry.value)}
        </div>
      ))}
    </div>
  );
}

export function ProblemStatsChart({ data }: ProblemStatsChartProps) {
  const chartData = data.map(d => ({
    name: d.difficulty,
    Solved: d.solved,
    Remaining: d.total - d.solved,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barSize={32}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.1}
            style={{ outline: 'none' }}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
            axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
            axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
              fontSize: '12px',
            }}
          />
          <Legend content={<CustomLegend />} />

          {/* Solved bar */}
          <Bar dataKey="Solved" radius={[4, 4, 0, 0]} stackId="a">
            {chartData.map(entry => (
              <Cell key={entry.name} fill={SOLVED_COLORS[entry.name] ?? '#6366f1'} />
            ))}
          </Bar>

          {/* Remaining bar (lighter) */}
          <Bar dataKey="Remaining" radius={[4, 4, 0, 0]} stackId="a">
            {chartData.map(entry => (
              <Cell
                key={entry.name}
                fill={REMAINING_DARK[entry.name] ?? '#4b5563'}
                fillOpacity={0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
