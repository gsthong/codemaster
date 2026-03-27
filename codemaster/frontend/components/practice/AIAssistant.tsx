'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  MessageSquare, 
  Activity, 
  GitBranch, 
  Lock, 
  ChevronRight,
  Info,
  Bug,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useCode } from '@/lib/context';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import VisualizePanel from './VisualizePanel';

interface AIAssistantProps {
  problemId: string;
}

export function AIAssistant({ problemId }: AIAssistantProps) {
  const { problem, code, language, testResults } = useCode();
  const [activeTab, setActiveTab] = useState('hint');
  const [hints, setHints] = useState<{level: number, content: string, unlocked: boolean}[]>([
    { level: 1, content: '', unlocked: true },
    { level: 2, content: '', unlocked: false },
    { level: 3, content: '', unlocked: false },
  ]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGetHint = async (level: number) => {
    if (isLoadingHint) return;
    setIsLoadingHint(true);
    try {
      const data = await apiClient.getHint(
        Number(problemId),
        code,
        level
      );
      
      setHints(prev => prev.map(h => 
        h.level === level ? { ...h, content: data.hint, unlocked: true } : 
        h.level === level + 1 ? { ...h, unlocked: true } : h
      ));
    } catch (error: any) {
      toast.error('Không thể lấy gợi ý', { description: error.message });
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await apiClient.analyzeBugs(
        code, 
        language, 
        Number(problemId)
      );
      setAnalysis(result);
      setActiveTab('analysis');
    } catch (error: any) {
      toast.error('Phân tích thất bại', { description: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d0f] border-l border-white/5 overflow-hidden font-sans">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="h-11 w-full rounded-none border-b border-white/5 bg-[#131316]/50 backdrop-blur-md justify-start px-2 gap-1 overflow-x-auto no-scrollbar">
          <TabsTrigger value="hint" className="text-[10px] font-bold uppercase tracking-wider h-7 data-[state=active]:bg-white/10 data-[state=active]:text-primary text-white/40">
            <Lightbulb className="w-3 h-3 mr-1.5 text-amber-400" />
            Gợi ý
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-[10px] font-bold uppercase tracking-wider h-7 data-[state=active]:bg-white/10 data-[state=active]:text-primary text-white/40">
            <Bug className="w-3 h-3 mr-1.5 text-rose-400" />
            Sửa lỗi
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="text-[10px] font-bold uppercase tracking-wider h-7 data-[state=active]:bg-white/10 data-[state=active]:text-primary text-white/40">
            <Activity className="w-3 h-3 mr-1.5 text-emerald-400" />
            Mô phỏng
          </TabsTrigger>
          <TabsTrigger value="complexity" className="text-[10px] font-bold uppercase tracking-wider h-7 data-[state=active]:bg-white/10 data-[state=active]:text-primary text-white/40">
            <GitBranch className="w-3 h-3 mr-1.5 text-blue-400" />
            Cấu trúc
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* ── Hints Tab ── */}
          <TabsContent value="hint" className="p-5 space-y-4 mt-0 animate-in fade-in duration-300">
            <header className="flex items-center gap-3 p-3 bg-amber-400/5 border border-amber-400/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-tight">AI Mentor</h3>
                <p className="text-[10px] text-white/40 leading-snug">Gợi ý theo từng cấp độ để bạn tự tìm ra lời giải.</p>
              </div>
            </header>

            <div className="space-y-3 pt-2">
              {hints.map((hint) => (
                <div 
                  key={hint.level} 
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    hint.content ? 'bg-white/[0.03] border-white/10' : 
                    hint.unlocked ? 'bg-amber-400/[0.02] border-amber-400/10 border-dashed' : 
                    'bg-black/20 border-white/5 opacity-50 select-none'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      hint.content ? 'text-amber-400' : 'text-white/20'
                    }`}>
                      Cấp độ {hint.level} {hint.level === 1 ? '• Ý tưởng' : hint.level === 2 ? '• Giải thuật' : '• Trường hợp đặc biệt'}
                    </span>
                    {!hint.unlocked && <Lock size={12} className="text-white/20" />}
                    {hint.content && <CheckCircle2 size={12} className="text-amber-400" />}
                  </div>

                  {hint.content ? (
                    <p className="text-xs text-white/70 leading-relaxed animate-in fade-in slide-in-from-left-2">{hint.content}</p>
                  ) : hint.unlocked ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isLoadingHint}
                      onClick={() => handleGetHint(hint.level)}
                      className="w-full text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 justify-between px-0"
                    >
                      {isLoadingHint ? 'Đang suy nghĩ...' : 'Nhấn để mở khóa gợi ý này'}
                      <ChevronRight size={14} />
                    </Button>
                  ) : (
                    <p className="text-[10px] text-white/20 font-medium italic">Hoàn thành cấp độ {hint.level - 1} để mở khóa</p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
               <div className="flex items-center gap-2 text-blue-400">
                  <Zap size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Phân tích lỗi chuyên sâu</span>
               </div>
               <p className="text-[10px] text-white/40 leading-relaxed">Nếu code chạy không ra kết quả như ý, hãy để AI giúp bạn tìm ra điểm mù.</p>
               <Button 
                onClick={handleRunAnalysis} 
                className="w-full h-8 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/20"
                disabled={isAnalyzing}
               >
                 {isAnalyzing ? "Đang phân tích..." : "PHÂN TÍCH LỖI HIỆN TẠI"}
               </Button>
            </div>
          </TabsContent>

          {/* ── Analysis Tab ── */}
          <TabsContent value="analysis" className="p-5 space-y-4 mt-0 animate-in fade-in duration-300">
             {analysis ? (
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-rose-400">Kết quả phân tích</h3>
                    <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)} className="h-6 text-[10px] text-white/30">Làm lại</Button>
                  </div>
                  
                  <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl italic text-xs text-white/70 leading-relaxed">
                     "{analysis.summary || "AI đã phân tích xong code của bạn. Xem chi tiết bên dưới."}"
                  </div>

                  <div className="space-y-3">
                    {analysis.bugs?.map((bug: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-tighter">
                            {bug.type?.replace('_', ' ') || 'LOGIC ERROR'}
                          </span>
                          {bug.line && <span className="text-[10px] text-white/30">Dòng {bug.line}</span>}
                        </div>
                        <p className="text-xs font-medium text-white/90 leading-relaxed">{bug.message}</p>
                        {bug.fix && (
                          <div className="p-2.5 bg-black/40 rounded-lg border border-emerald-500/10 flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Gợi ý cách sửa:</span>
                            <p className="text-[11px] text-white/60 leading-relaxed">{bug.fix}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!analysis.bugs || analysis.bugs.length === 0) && (
                      <div className="py-8 text-center opacity-30 italic text-xs">
                        Nếu không thấy lỗi rõ ràng, có thể thuật toán của bạn chưa tối ưu.
                      </div>
                    )}
                  </div>
               </div>
             ) : (
               <div className="h-[400px] flex flex-col items-center justify-center text-center px-8 space-y-5 opacity-40">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 rotate-3">
                    <Bug size={32} className="text-rose-400" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Chưa có dữ liệu phân tích</h4>
                    <p className="text-xs leading-relaxed">Hãy bấm nút "PHÂN TÍCH LỖI" trong tab Gợi ý hoặc sửa code và chạy thử để AI có thông tin xử lý.</p>
                  </div>
               </div>
             )}
          </TabsContent>

          {/* ── Visualizer Tab ── */}
          <TabsContent value="visualizer" className="h-full flex flex-col mt-0 animate-in fade-in duration-300">
             <VisualizePanel code={code} />
          </TabsContent>

          {/* ── Complexity Tab ── */}
          <TabsContent value="complexity" className="p-5 space-y-6 mt-0 animate-in fade-in duration-300">
             <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale italic">
                <Info size={40} className="mb-4" />
                <p className="text-sm">Tính năng đang phát triển</p>
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
