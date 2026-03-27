'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RootLayout } from '@/components/layout/RootLayout';
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart';
import { ProblemStatsChart } from '@/components/dashboard/ProblemStatsChart';
import { WecodeSync } from '@/components/dashboard/WecodeSync';
import { ExamReadinessIndicator } from '@/components/dashboard/ExamReadinessIndicator';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/constants';
import { MOCK_SKILL_DATA, MOCK_PROBLEM_STATS } from '@/lib/mock-data';
import { DashboardReport, RecommendedProblem, ProblemStat } from '@/lib/types';

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <Card className="p-4 bg-card border border-border">
      <p className="text-sm text-foreground/60 mb-1">{label}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-xs text-foreground/40 mt-2">{sub}</p>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card className="p-4 bg-card border border-border space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </Card>
  );
}

import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
  const router = useRouter();
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getDashboardReport();
      setReport(data);
    } catch {
      // Graceful fallback to mock data for development
      setReport({
        summary: { total_solved: 0, streak: 0, avg_time_min: 0, success_rate: 0 },
        skill_scores: MOCK_SKILL_DATA,
        weak_topics: [],
        recommendations: [],
        exam_readiness: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const data = await apiClient.getRecommendations();
      setRecommendations(data);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchRecommendations();
  }, [fetchDashboard, fetchRecommendations]);

  const stats = report?.summary;
  const skillData = report?.skill_scores ?? MOCK_SKILL_DATA;
  const solvedProblems = stats?.total_solved ?? 0;
  const totalProblems = 50;
  const readiness = report?.exam_readiness ?? 0;

  const problemStats: ProblemStat[] = MOCK_PROBLEM_STATS;

  return (
    <RootLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Bảng điều khiển</h1>
          <p className="text-foreground/60">Theo dõi tiến độ học tập và khám phá tiềm năng của bạn</p>
        </div>

        {/* Row 1: Skills radar (col-span-2) + Wecode sync (col-span-1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 p-6 bg-card border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Kỹ năng của bạn</h2>
            {loading
              ? <Skeleton className="h-64 w-full rounded" />
              : <SkillRadarChart data={skillData} />
            }
          </Card>

          <Card className="col-span-1 p-6 bg-card border border-border flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground mb-1">Đồng bộ Wecode</h3>
              <p className="text-sm text-foreground/60">Kết nối tài khoản Wecode để theo dõi tất cả bài làm của bạn tại một nơi duy nhất.</p>
            </div>
            <WecodeSync />
          </Card>
        </div>

        {/* Row 2: Exam Readiness + Stats chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Mức độ sẵn sàng cho kỳ thi</h3>
            {loading
              ? <Skeleton className="h-32 w-full rounded" />
              : <ExamReadinessIndicator solvedProblems={solvedProblems} totalProblems={totalProblems} readinessPercentage={readiness} />
            }
          </Card>

          <Card className="p-6 bg-card border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Thống kê bài tập</h2>
            {loading
              ? <Skeleton className="h-48 w-full rounded" />
              : <ProblemStatsChart data={problemStats} />
            }
          </Card>
        </div>

        {/* Row 3: 4 stat cards (col-span-2 nested grid) + Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stat cards — take 2 of 3 columns */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            ) : (
              <>
                <StatCard label="Bài đã giải" value={stats?.total_solved ?? 0} sub="Thêm 0 bài tuần này" />
                <StatCard label="Chuỗi ngày" value={<>{stats?.streak ?? 0} 🔥</>} sub="Hãy duy trì phong độ!" />
                <StatCard label="Thời gian TB (phút)" value={stats?.avg_time_min ?? 0} sub="Tốc độ đang cải thiện" />
                <StatCard
                  label="Tỷ lệ thành công"
                  value={<span className="text-green-500">{stats?.success_rate ?? 0}%</span>}
                  sub="Làm rất tốt!"
                />
              </>
            )}
          </div>

          {/* Recent Activity — 1 column */}
          <Card className="col-span-1 p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Hoạt động gần đây</h3>
            <RecentActivityFeed />
          </Card>
        </div>

        {/* Row 4: Recommended Next Problems */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Bài tập gợi ý tiếp theo</h2>
          {recLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 bg-card border border-border min-w-56 shrink-0">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20 mb-3" />
                  <Skeleton className="h-8 w-full rounded" />
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommendations.map(rec => (
                <Card key={rec.id} className="p-4 bg-card border border-border min-w-56 shrink-0 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{rec.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={`border text-xs ${DIFFICULTY_COLOR[rec.difficulty]}`}>
                      {rec.difficulty === 'easy' ? 'Dễ' : rec.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                    </Badge>
                    <span className="text-xs text-foreground/50 truncate">{rec.topic}</span>
                  </div>
                  {rec.reason && <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">{rec.reason}</p>}
                  <Button
                    size="sm"
                    className="mt-auto text-xs"
                    onClick={() => router.push(`/practice?problem_id=${rec.id}`)}
                  >
                    Luyện tập ngay
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/50">Chưa có gợi ý nào. Hãy tiếp tục giải bài để AI thấu hiểu bạn hơn!</p>
          )}
        </div>
      </div>
    </RootLayout>
  );
}
