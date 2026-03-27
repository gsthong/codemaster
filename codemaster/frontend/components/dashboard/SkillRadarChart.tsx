'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SkillData } from '@/lib/types';

interface SkillRadarChartProps {
  data: SkillData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      subject: string;
      A: number;
      problemsSolved: number;
      averageTime: number;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const avgMin = Math.round(d.averageTime / 60);
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-foreground mb-1">{d.subject}</p>
      <p className="text-foreground/70">Proficiency: <span className="text-foreground font-semibold">{d.A}%</span></p>
      <p className="text-foreground/70">Problems solved: <span className="text-foreground font-semibold">{d.problemsSolved}</span></p>
      <p className="text-foreground/70">Avg time: <span className="text-foreground font-semibold">{avgMin} min</span></p>
    </div>
  );
}

function getProficiencyColor(proficiency: number): { stroke: string; fill: string } {
  if (proficiency >= 75) return { stroke: '#22c55e', fill: '#22c55e' };
  if (proficiency >= 50) return { stroke: '#f59e0b', fill: '#f59e0b' };
  return { stroke: '#ef4444', fill: '#ef4444' };
}

export function SkillRadarChart({ data }: SkillRadarChartProps) {
  const avgProficiency = data.reduce((acc, s) => acc + s.proficiency, 0) / (data.length || 1);
  const { stroke, fill } = getProficiencyColor(avgProficiency);

  const chartData = data.map(skill => ({
    subject: skill.topic,
    A: skill.proficiency,
    problemsSolved: skill.problemsSolved,
    averageTime: skill.averageTime,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid
            stroke="currentColor"
            strokeOpacity={0.15}
            style={{ outline: 'none' }}
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
          />
          <PolarRadiusAxis
            stroke="currentColor"
            strokeOpacity={0.2}
            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
            domain={[0, 100]}
          />
          <Radar
            name="Proficiency"
            dataKey="A"
            stroke={stroke}
            fill={fill}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
