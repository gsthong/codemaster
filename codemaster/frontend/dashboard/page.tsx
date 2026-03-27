import { RootLayout } from '@/components/layout/RootLayout';
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart';
import { ProblemStatsChart } from '@/components/dashboard/ProblemStatsChart';
import { WecodeSync } from '@/components/dashboard/WecodeSync';
import { ExamReadinessIndicator } from '@/components/dashboard/ExamReadinessIndicator';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { Card } from '@/components/ui/card';
import { MOCK_SKILL_DATA, MOCK_PROBLEMS, MOCK_PROBLEM_STATS } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <RootLayout>
      <div className="bg-card/50 border border-border/60 shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-foreground/60">Track your learning progress and unlock your potential</p>
        </div>

        {/* Top Row: Skills & Sync */}
        <div className="bg-card/50 border border-border/60 shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
          {/* Skill Radar Chart */}
          <Card className="col-span-2 p-6 bg-card border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Your Skills</h2>
            <SkillRadarChart data={MOCK_SKILL_DATA} />
          </Card>

          {/* Wecode Sync */}
          <Card className="bg-card/50 border border-border/60 shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Wecode Integration</h3>
              <p className="text-sm text-foreground/60 mb-4">Sync your Wecode submissions to track all your work in one place</p>
            </div>
            <WecodeSync />
          </Card>
        </div>

        {/* Middle Row: Exam Readiness & Stats */}
        <div className="bg-card/50 border border-border/60 shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
          <Card className="p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Exam Readiness</h3>
            <ExamReadinessIndicator
              solvedProblems={24}
              totalProblems={MOCK_PROBLEMS.length}
              readinessPercentage={72}
            />
          </Card>

          <Card className="p-6 bg-card border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Problem Statistics</h2>
            <ProblemStatsChart data={MOCK_PROBLEM_STATS} />
          </Card>
        </div>

        {/* Bottom Row: Stats & Activity */}
        <div className="bg-card/50 border border-border/60 shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
          {/* Stats Grid */}
          <div className="col-span-2 grid grid-cols-4 gap-4">
            <Card className="p-4 bg-card border border-border">
              <p className="text-sm text-foreground/60 mb-1">Total Solved</p>
              <p className="text-3xl font-bold text-primary">24</p>
              <p className="text-xs text-foreground/40 mt-2">+3 this week</p>
            </Card>
            <Card className="p-4 bg-card border border-border">
              <p className="text-sm text-foreground/60 mb-1">Current Streak</p>
              <p className="text-3xl font-bold text-accent">7 🔥</p>
              <p className="text-xs text-foreground/40 mt-2">Keep it going!</p>
            </Card>
            <Card className="p-4 bg-card border border-border">
              <p className="text-sm text-foreground/60 mb-1">Avg. Time (min)</p>
              <p className="text-3xl font-bold text-primary">28</p>
              <p className="text-xs text-foreground/40 mt-2">Getting faster!</p>
            </Card>
            <Card className="p-4 bg-card border border-border">
              <p className="text-sm text-foreground/60 mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-green-500">94%</p>
              <p className="text-xs text-foreground/40 mt-2">Excellent work</p>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-card/50 border border-border/60 shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
            <h3 className="text-lg font-bold text-foreground mb-4">Recent Activity</h3>
            <RecentActivityFeed />
          </Card>
        </div>
      </div>
    </RootLayout>
  );
}
