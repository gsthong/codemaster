'use client';

import { CheckCircle2, Circle } from 'lucide-react';

interface ExamReadinessProps {
  solvedProblems: number;
  totalProblems: number;
  readinessPercentage: number;
}

export function ExamReadinessIndicator({
  solvedProblems,
  totalProblems,
  readinessPercentage
}: ExamReadinessProps) {
  const isReady = readinessPercentage >= 70;

  return (
    <div className="space-y-6">
      {/* Main Progress */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h4 className="text-lg font-bold text-foreground">Overall Readiness</h4>
            <p className="text-sm text-foreground/60">{solvedProblems} of {totalProblems} problems mastered</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{readinessPercentage}%</p>
            {isReady && <p className="text-xs text-green-500 font-medium">Ready to Exam!</p>}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-linear-to-r from-accent to-primary transition-all duration-500"
            style={{ width: `${readinessPercentage}%` }}
          />
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-secondary/20 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-3 h-3 fill-green-500 text-green-500" />
            <span className="text-sm font-medium text-foreground">Easy</span>
          </div>
          <p className="text-2xl font-bold text-green-500">12/12</p>
          <p className="text-xs text-foreground/60">100% solved</p>
        </div>

        <div className="p-4 bg-secondary/20 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">Medium</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">10/15</p>
          <p className="text-xs text-foreground/60">67% solved</p>
        </div>

        <div className="p-4 bg-secondary/20 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-3 h-3 fill-red-500 text-red-500" />
            <span className="text-sm font-medium text-foreground">Hard</span>
          </div>
          <p className="text-2xl font-bold text-red-500">2/8</p>
          <p className="text-xs text-foreground/60">25% solved</p>
        </div>
      </div>

      {/* Badge */}
      {isReady && (
        <div className="p-4 bg-linear-to-r from-green-500/10 to-accent/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-500">You're Ready!</p>
            <p className="text-xs text-foreground/60">You have enough practice to ace your exam</p>
          </div>
        </div>
      )}
    </div>
  );
}
