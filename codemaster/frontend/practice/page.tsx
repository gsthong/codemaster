"use client";

import { IDEWorkspace } from "@/components/practice/IDEWorkspace";
import { MOCK_PROBLEMS } from "@/lib/mock-data";

export default function PracticePage() {
  const problem = MOCK_PROBLEMS[0];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 border-b flex items-center px-4 font-semibold">
        Practice
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden">
        <IDEWorkspace problem={problem} />
      </div>
    </div>
  );
}