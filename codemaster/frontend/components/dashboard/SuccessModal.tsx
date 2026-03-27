'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp, Trophy } from 'lucide-react';

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemTitle?: string;
  userComplexity?: { time: string; space: string };
  optimalComplexity?: { time: string; space: string };
}

export function SuccessModal({
  open,
  onOpenChange,
  problemTitle = 'Two Sum',
  userComplexity = { time: 'O(n)', space: 'O(n)' },
  optimalComplexity = { time: 'O(n)', space: 'O(n)' }
}: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Problem Solved!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Celebration */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="text-6xl">🎉</div>
            </div>
            <h3 className="text-xl font-bold text-foreground">{problemTitle}</h3>
            <p className="text-sm text-foreground/60">Accepted! Your solution was correct.</p>
          </div>

          {/* Complexity Comparison */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-sm">Time & Space Complexity</h4>

            {/* Your Solution */}
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">Your Solution</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-foreground/80">Time: <span className="font-mono font-bold">{userComplexity.time}</span></p>
                    <p className="text-xs text-foreground/80">Space: <span className="font-mono font-bold">{userComplexity.space}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimal Solution */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Optimal Solution</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-foreground/80">Time: <span className="font-mono font-bold">{optimalComplexity.time}</span></p>
                    <p className="text-xs text-foreground/80">Space: <span className="font-mono font-bold">{optimalComplexity.space}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 py-3 bg-background/50 rounded border border-border/50 p-3">
            <div className="text-center">
              <p className="text-xs text-foreground/60 mb-1">Runtime</p>
              <p className="font-bold text-sm text-foreground">32ms</p>
            </div>
            <div className="text-center border-l border-r border-border/50">
              <p className="text-xs text-foreground/60 mb-1">Memory</p>
              <p className="font-bold text-sm text-foreground">12.8MB</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-foreground/60 mb-1">Percentile</p>
              <p className="font-bold text-sm text-foreground">92%</p>
            </div>
          </div>

          {/* Optimization Suggestion */}
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-xs font-medium text-foreground mb-1">💡 Perfect Solution!</p>
            <p className="text-xs text-foreground/70">Your complexity matches the optimal solution. Great work!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-border"
            onClick={() => onOpenChange(false)}
          >
            Next Problem
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            Back to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
