"use client";

/**
 * VisualizePanel.tsx
 * Gọi /visualize/trace → render flowchart (Mermaid) + step-by-step animation
 * KHÔNG dùng AI — backend dùng pure graph
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { apiClient } from "@/lib/api-client";

interface TraceStep {
  line: number;
  vars: Record<string, unknown>;
  changed: string[];
}

interface TraceResult {
  status: string;
  result: unknown;
  steps: TraceStep[];
  total_steps: number;
  flowchart_mermaid: string;
  complexity: { time: string; note: string };
  error?: string;
}

interface Props {
  code: string;
  inputArray?: number[];
}

export default function VisualizePanel({ code, inputArray = [1, -2, 3, 4, -1] }: Props) {
  const [result, setResult] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  // ── Run trace ────────────────────────────────
  const runTrace = async () => {
    setLoading(true);
    setCurrentStep(0);
    setPlaying(false);
    try {
      const data = await apiClient.traceCode(code, inputArray);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Mermaid render ───────────────────────────
  useEffect(() => {
    if (!result?.flowchart_mermaid || !mermaidRef.current) return;
    import("mermaid").then((m) => {
      m.default.initialize({ startOnLoad: false, theme: "neutral" });
      m.default
        .render("flowchart-svg", result.flowchart_mermaid)
        .then(({ svg }) => {
          if (mermaidRef.current) mermaidRef.current.innerHTML = svg;
        })
        .catch(() => {
          if (mermaidRef.current)
            mermaidRef.current.innerHTML = `<pre class="text-xs opacity-60">${result.flowchart_mermaid}</pre>`;
        });
    });
  }, [result?.flowchart_mermaid]);

  // ── Auto-play ────────────────────────────────
  useEffect(() => {
    if (!playing || !result) return;
    timerRef.current = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= result.steps.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, result]);

  const step = result?.steps[currentStep];

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Visualize Logic</h2>
        <Badge variant="outline" className="text-xs">Không dùng AI</Badge>
        <Button size="sm" onClick={runTrace} disabled={loading}>
          {loading ? "Đang chạy..." : "▶ Run Trace"}
        </Button>
      </div>

      {result && (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* LEFT: Flowchart */}
          <Card className="flex-1 p-3 overflow-auto">
            <div className="text-xs font-medium mb-2 opacity-60">Flowchart (Mermaid)</div>
            <div ref={mermaidRef} className="overflow-auto" />
          </Card>

          {/* RIGHT: Step tracer */}
          <div className="w-72 flex flex-col gap-3">
            {/* Complexity badge */}
            <Card className="p-3">
              <div className="text-xs opacity-60 mb-1">Độ phức tạp (ước tính)</div>
              <div className="font-mono font-bold text-blue-600">{result.complexity.time}</div>
              <div className="text-xs opacity-50">{result.complexity.note}</div>
            </Card>

            {/* Step controls */}
            <Card className="p-3 flex flex-col gap-2">
              <div className="text-xs opacity-60">
                Bước {currentStep + 1} / {result.total_steps}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                >◀</Button>
                <Button
                  size="sm"
                  variant={playing ? "destructive" : "default"}
                  onClick={() => setPlaying((p) => !p)}
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.min(result.steps.length - 1, s + 1))}
                  disabled={currentStep >= result.steps.length - 1}
                >▶</Button>
              </div>

              {/* Current step info */}
              {step && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">
                    Dòng <span className="text-blue-600 font-mono">{step.line}</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(step.vars).map(([k, v]) => (
                      <div
                        key={k}
                        className={`flex justify-between text-xs font-mono px-2 py-1 rounded
                          ${step.changed.includes(k) ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-muted/50"}`}
                      >
                        <span className="text-purple-600">{k}</span>
                        <span>{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Final result */}
            {result.status !== "OK" && (
              <Card className="p-3 border-red-200 bg-red-50 dark:bg-red-900/20">
                <div className="text-xs text-red-600 font-medium">
                  {result.status}: {result.error ?? String(result.result)}
                </div>
              </Card>
            )}
            {result.status === "OK" && (
              <Card className="p-3 border-green-200 bg-green-50 dark:bg-green-900/20">
                <div className="text-xs opacity-60">Kết quả</div>
                <div className="font-mono text-green-700">{JSON.stringify(result.result)}</div>
              </Card>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-sm opacity-40 text-center mt-8">
          Nhấn "Run Trace" để xem từng bước chạy của code + flowchart
        </div>
      )}
    </div>
  );
}
