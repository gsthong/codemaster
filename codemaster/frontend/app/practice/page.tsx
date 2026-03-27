"use client";

import { IDEWorkspace } from "@/components/practice/IDEWorkspace";
import { MOCK_PROBLEMS } from "@/lib/mock-data";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Problem } from "@/lib/types";

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const problemIdStr = searchParams.get("problem_id");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProblem() {
      try {
        setLoading(true);
        const pid = parseInt(problemIdStr || "1");
        const data = await apiClient.getProblem(pid);
        setProblem(data);
      } catch (err) {
        console.error("Failed to fetch problem:", err);
        // Fallback to first mock if API fails
        setProblem(MOCK_PROBLEMS[0] as unknown as Problem);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [problemIdStr]);

  if (loading) {
    return <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center text-white/50">Đang tải đề bài...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
      {/* Focused Navigation Bar */}
      <header className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-white gap-1 p-0 h-auto hover:bg-transparent"
            onClick={() => router.push('/dashboard')}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Dashboard</span>
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-sm font-semibold tracking-tight">Khu vực luyện tập</h1>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Add premium badges or user state here */}
        </div>
      </header>

      {/* Full-bleed Workspace */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {problem && <IDEWorkspace problem={problem} />}
      </main>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#09090b] flex items-center justify-center text-white/50">Khởi tạo môi trường lập trình...</div>}>
      <PracticeContent />
    </Suspense>
  );
}