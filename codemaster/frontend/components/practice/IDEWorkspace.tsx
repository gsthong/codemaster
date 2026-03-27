'use client';

import { useState, useCallback, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Problem } from '@/lib/types';
import { CodeProvider, useCode } from '@/lib/context';
import { ProblemContext } from './ProblemContext';
import { CodeEditor } from './CodeEditor';
import { AIAssistant } from './AIAssistant';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Clock, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ImportDialog } from './ImportDialog';

interface IDEWorkspaceProps {
  problem: Problem;
}

function useTimer(): string {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function IDEWorkspace({ problem: initialProblem }: IDEWorkspaceProps) {
  return (
    <CodeProvider initialProblem={initialProblem}>
      <IDEContent />
    </CodeProvider>
  );
}

function IDEContent() {
  const { problem } = useCode();
  const [showImport, setShowImport] = useState(false);
  const timer = useTimer();

  const handleWecodeSubmit = useCallback(() => {
    toast.info('Nộp bài cho Wecode', { description: 'Sử dụng nút Submit trong trình soạn thảo code (Ctrl+Shift+Enter).' });
  }, []);

  if (!problem) return null;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden text-foreground">
      {/* Top Toolbar */}
      <div className="h-11 flex items-center px-4 gap-3 border-b border-border bg-card flex-shrink-0">
        <h1 className="text-sm font-bold text-foreground truncate max-w-xs">
          {problem.title}
        </h1>
        <Badge className={`border text-xs shrink-0 ${DIFFICULTY_BADGE[problem.difficulty]}`}>
          {problem.difficulty === 'easy' ? 'Dễ' : problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
        </Badge>
        
        <div className="h-4 w-px bg-border mx-2" />
        
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          onClick={() => setShowImport(true)}
        >
          <Upload className="w-3.5 h-3.5" />
          Nhập đề bài (Ảnh/PDF)
        </Button>

        <div className="flex items-center gap-1 text-xs text-foreground/60 ml-auto shrink-0">
          <Clock className="w-3.5 h-3.5" aria-hidden />
          <span className="font-mono">Thời gian: {timer}</span>
        </div>
        
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-primary hover:bg-primary/90 shrink-0"
          onClick={handleWecodeSubmit}
        >
          <Send className="w-3 h-3" />
          Nộp bài Wecode
        </Button>
      </div>

      {/* Main 3-panel layout */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Left: Problem Description */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <ProblemContext problem={problem} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />

          {/* Middle: Code Editor */}
          <Panel defaultSize={50} minSize={25} maxSize={65}>
            <CodeEditor />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />

          {/* Right: AI Assistant */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <AIAssistant problemId={problem.id} />
          </Panel>
        </PanelGroup>
      </div>

      <ImportDialog open={showImport} onOpenChange={setShowImport} />
    </div>
  );
}
