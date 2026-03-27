'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Send, Bug, CheckCircle2, XCircle, AlertCircle, Terminal, Command } from 'lucide-react';
import { toast } from 'sonner';
import { LANGUAGES } from '@/lib/constants';
import { apiClient } from '@/lib/api-client';
import { useCode } from '@/lib/context';
import { TestCase } from '@/lib/types';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Language = 'python' | 'cpp' | 'java' | 'javascript';

const LANGUAGE_MAP: Record<Language, string> = {
  python: 'python',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
};

function StatusIcon({ status }: { status: TestCase['status'] }) {
  if (status === 'passed') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === 'runtime_error') return <AlertCircle className="w-4 h-4 text-orange-400" />;
  return <div className="w-3 h-3 rounded-full bg-white/10 animate-pulse" />;
}

export function CodeEditor() {
  const { code, setCode, language, handleLanguageChange, problem, testResults, setTestResults } = useCode();
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<any>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, language, problem, isRunning, isSubmitting]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    const examples = problem?.examples ?? [];
    const pending: TestCase[] = examples.map((ex, i) => ({
      id: String(i + 1),
      input: ex.input,
      expectedOutput: ex.output,
      status: 'pending',
    }));
    setTestResults(pending);

    try {
      const data = await apiClient.runCode(
        language,
        code,
        Number(problem?.id),
        examples.map(ex => ({ input: ex.input, expected: ex.output }))
      );

      const updated: TestCase[] = examples.map((ex, i) => {
        const r = data.results?.[i];
        const passed = r?.status === 'OK';
        return {
          id: String(i + 1),
          input: ex.input,
          expectedOutput: ex.output,
          actualOutput: r?.output ?? r?.error ?? '',
          status: r?.status === 'RE' ? 'runtime_error' : passed ? 'passed' : 'failed',
        };
      });
      setTestResults(updated);
      
      const passCount = updated.filter(t => t.status === 'passed').length;
      if (passCount === updated.length) {
        toast.success(`Chạy thử thành công! ${passCount}/${updated.length} test case đạt.`);
      } else {
        toast.error(`Chạy thử thất bại: ${passCount}/${updated.length} test case đạt.`);
      }
    } catch (err: any) {
      toast.error('Lỗi hệ thống', { description: err.message });
      setTestResults(pending.map(t => ({ ...t, status: 'runtime_error' as const })));
    } finally {
      setIsRunning(false);
    }
  }, [code, language, problem, isRunning, setTestResults]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Đang chấm bài...');
    try {
      const data = await apiClient.submitCode(Number(problem?.id ?? 0), language, code);
      if (data.status === 'accepted') {
        toast.success('CHẤP NHẬN! Lời giải của bạn đã được ghi nhận 🎉', { id: toastId });
      } else {
        toast.error(`Kết quả: ${data.status?.toUpperCase()}`, { id: toastId, description: `${data.testsPassed}/${data.totalTests} test case đạt.` });
      }
    } catch (err: any) {
      toast.error('Gửi bài thất bại', { id: toastId, description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, problem, isSubmitting]);

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d0f] border-r border-white/5 overflow-hidden font-sans">
      {/* Editor Header */}
      <div className="h-11 px-4 border-b border-white/5 flex items-center justify-between bg-[#131316]/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">Trình soạn thảo</span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
            <SelectTrigger className="w-32 h-7 bg-white/5 border-white/10 text-[10px] font-medium text-white/90 hover:bg-white/10 transition-colors uppercase tracking-wider">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1e] border-white/10">
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value} className="text-white/80 text-xs hover:bg-white/10">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 min-h-0 relative group">
        <MonacoEditor
          language={LANGUAGE_MAP[language]}
          value={code}
          onChange={(val) => setCode(val ?? '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: 'Geist Mono, JetBrains Mono, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            renderLineHighlight: 'all',
            padding: { top: 16, bottom: 16 },
            cursorSmoothCaretAnimation: 'on',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'hidden',
              verticalScrollbarSize: 8,
            },
            backgroundColor: '#0d0d0f',
          }}
          onMount={(editor) => { editorRef.current = editor; }}
        />
        {/* Subtle glow effect */}
        <div className="absolute inset-0 pointer-events-none border border-primary/0 group-focus-within:border-primary/10 transition-all duration-500" />
      </div>

      {/* Feedback Panel (Console style) */}
      {testResults.length > 0 && (
        <div className="border-t border-white/5 bg-[#09090b] max-h-[35%] overflow-hidden flex flex-col flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="h-9 px-4 flex items-center justify-between bg-white/[0.02] border-b border-white/5 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Kết quả chạy thử</span>
            <button onClick={() => setTestResults([])} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Clear</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {testResults.map(tc => (
              <div key={tc.id} className={`rounded-lg border p-2.5 transition-all ${
                tc.status === 'passed' ? 'bg-emerald-500/5 border-emerald-500/10' : 
                tc.status === 'failed' ? 'bg-red-500/5 border-red-500/10' : 
                'bg-white/[0.02] border-white/5'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon status={tc.status} />
                  <span className="text-[11px] font-bold text-white/90">Test Case {tc.id}</span>
                  <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    tc.status === 'passed' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                  }`}>
                    {tc.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-[11px] font-mono">
                  <div className="bg-black/40 p-1.5 rounded border border-white/5">
                    <span className="text-white/30 mr-2">Input:</span>
                    <span className="text-white/70">{tc.input}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 p-1.5 rounded border border-white/5">
                      <span className="text-white/30 mr-2">Expect:</span>
                      <span className="text-emerald-400/80">{tc.expectedOutput}</span>
                    </div>
                    {tc.actualOutput !== undefined && (
                      <div className="flex-1 bg-black/40 p-1.5 rounded border border-white/5">
                        <span className="text-white/30 mr-2">Actual:</span>
                        <span className={tc.status === 'passed' ? 'text-emerald-400/80' : 'text-red-400/80'}>
                          {tc.actualOutput}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Footer */}
      <div className="p-4 border-t border-white/5 bg-[#131316]/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            variant="outline"
            className="flex-1 h-10 bg-white/5 hover:bg-white/10 bolder-white/10 text-white gap-2 transition-all active:scale-[0.98]"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span className="font-semibold text-xs tracking-wide">CHẠY THỬ</span>
            <div className="ml-auto flex items-center gap-0.5 text-[9px] text-white/20">
              <Command className="w-3 h-3" />
              <span>Enter</span>
            </div>
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex-1 h-10 bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Send className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
            <span className="font-bold text-xs tracking-widest">NỘP BÀI</span>
            <div className="ml-auto flex items-center gap-0.5 text-[9px] text-white/50">
              <Command className="w-3 h-3" />
              <span>⇧ Enter</span>
            </div>
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-white/20 tracking-tighter uppercase">
          <span>{code.split('\n').length} dòng mã · {code.length} ký tự</span>
          <span className="text-primary/40">CodeMaster IDE Pro v1.0</span>
        </div>
      </div>
    </div>
  );
}
