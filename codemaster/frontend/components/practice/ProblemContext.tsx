'use client';

import { Problem, SyllabusTopic } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Clock, BookOpen, ExternalLink, Hash, Info, ListChecks, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_SYLLABUS } from '@/lib/mock-data';
import { ESTIMATED_TIME } from '@/lib/constants';

interface ProblemContextProps {
  problem: Problem;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  hard: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

export function ProblemContext({ problem }: ProblemContextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyProblem = () => {
    const full = `${problem.title}\n\n${problem.description}\n\nConstraints:\n${problem.constraints ?? ''}\n\nExamples:\n${problem.examples.map((ex, i) => `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}`).join('\n\n')}`;
    navigator.clipboard.writeText(full).catch(() => {});
    setCopied(true);
    toast.success('Đã sao chép đề bài');
    setTimeout(() => setCopied(false), 2000);
  };

  const syllabusEntry = useMemo<SyllabusTopic | undefined>(
    () => MOCK_SYLLABUS.find(s => s.name === problem.syllabusTopic || s.id === problem.syllabusTopic),
    [problem.syllabusTopic]
  );

  const estTime = ESTIMATED_TIME[problem.difficulty] ?? 30;

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d0f] border-r border-white/5 overflow-hidden">
      <Tabs defaultValue="description" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="h-11 w-full rounded-none border-b border-white/5 bg-[#131316]/50 backdrop-blur-md justify-start px-2 gap-1">
          <TabsTrigger value="description" className="text-[10px] font-bold uppercase tracking-wider h-7 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <Info className="w-3 h-3 mr-1.5" />
            Mô tả
          </TabsTrigger>
          <TabsTrigger value="syllabus" className="text-[10px] font-bold uppercase tracking-wider h-7 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <BookOpen className="w-3 h-3 mr-1.5" />
            Lộ trình
          </TabsTrigger>
          <TabsTrigger value="samples" className="text-[10px] font-bold uppercase tracking-wider h-7 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <ListChecks className="w-3 h-3 mr-1.5" />
            Ví dụ
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* ── Description Tab ── */}
          <TabsContent value="description" className="p-6 space-y-6 mt-0 animate-in fade-in duration-300">
            <header className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-xl font-bold text-white tracking-tight leading-tight">{problem.title}</h1>
                <Badge className={`border text-[10px] font-bold px-2 py-0.5 whitespace-nowrap ${DIFFICULTY_COLOR[problem.difficulty]}`}>
                  {problem.difficulty.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{estTime} phút</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5 text-xs text-emerald-400/60 font-medium">
                  <CheckCircle2 size={14} className="opacity-50" />
                  <span>{problem.acceptance}% Hoàn thành</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {problem.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-semibold text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary/80">
                <Hash className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Nội dung đề bài</h3>
              </div>
              <div className="text-sm text-white/70 leading-relaxed font-sans whitespace-pre-wrap selection:bg-primary/30">
                {problem.description}
              </div>
            </section>

            {problem.constraints && (
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Ràng buộc</h3>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg font-mono text-[11px] text-white/60 leading-relaxed">
                  {problem.constraints}
                </div>
              </section>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 bg-white/5 border-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all gap-2 text-xs"
              onClick={handleCopyProblem}
            >
              <Copy size={14} className={copied ? 'text-emerald-400' : ''} />
              {copied ? 'Đã sao chép!' : 'Sao chép đề bài'}
            </Button>
          </TabsContent>

          {/* ── Syllabus Tab ── */}
          <TabsContent value="syllabus" className="p-6 space-y-6 mt-0 animate-in fade-in duration-300">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Tương quan lộ trình</h3>
              {syllabusEntry ? (
                <div className="space-y-6">
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-tighter">Chủ đề HIỆN TẠI</p>
                      <h4 className="text-base font-bold text-white leading-tight">{syllabusEntry.name}</h4>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase">
                        <span>Tiến độ chủ đề</span>
                        <span className="text-primary">{syllabusEntry.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all duration-1000"
                          style={{ width: `${syllabusEntry.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-white/50 leading-relaxed italic">
                      "Hãy tập trung hoàn thành bài này để tăng độ phủ lý thuyết cho phần {syllabusEntry.name}."
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Kiến thức liên quan</h5>
                    <div className="flex flex-wrap gap-2">
                      {syllabusEntry.subtopics?.map(sub => (
                        <div key={sub} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-medium text-white/60">
                          {sub}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="ghost" className="w-full text-xs text-primary/60 hover:text-primary hover:bg-primary/5 gap-2 group">
                    Xem tất cả bài tập chủ đề này
                    <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3 opacity-30">
                  <BookOpen className="w-12 h-12 mx-auto" />
                  <p className="text-sm font-medium">Chưa có dữ liệu lộ trình cho bài tập này</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Test Cases Tab ── */}
          <TabsContent value="samples" className="p-6 space-y-4 mt-0 animate-in fade-in duration-300">
             <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Các bộ lọc đầu vào mẫu</h3>
             <div className="space-y-4">
               {problem.examples.map((ex, i) => (
                 <div key={i} className="group space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-white/20">Ví dụ {i+1}</span>
                  </div>
                  <div className="space-y-3 font-mono text-[11px]">
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Đầu vào:</span>
                      <div className="p-2.5 bg-black/40 rounded border border-white/5 text-emerald-400/80">
                        {ex.input}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Đầu ra mong đợi:</span>
                      <div className="p-2.5 bg-black/40 rounded border border-white/5 text-amber-400/80">
                        {ex.output}
                      </div>
                    </div>
                    {ex.explanation && (
                      <div className="pt-2 text-[10px] text-white/50 leading-relaxed italic border-t border-white/5">
                        <span className="font-bold text-white/30 mr-1.5 uppercase tracking-tighter">Giải thích:</span>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                 </div>
               ))}
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
