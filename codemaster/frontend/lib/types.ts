// Problem and Practice Types
export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  acceptance: number;
  tags: string[];
  examples: Example[];
  syllabusTopic?: string;
  constraints?: string;
  boilerplate?: Record<string, string>;
  harness?: Record<string, string>;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status: 'pending' | 'passed' | 'failed' | 'runtime_error';
  notes?: string;
}

// AI Hint Types
export type HintLevel = 1 | 2 | 3;

export interface Hint {
  level: HintLevel;
  content: string;
  category: 'conceptual' | 'algorithm' | 'edge_case';
  unlocked: boolean;
}

// User and Progress Types
export interface UserStats {
  totalProblems: number;
  solvedProblems: number;
  streak: number;
  wecodeLastSync: Date | null;
  lastActive: Date;
}

export interface SkillData {
  topic: string;
  proficiency: number; // 0-100
  problemsSolved: number;
  averageTime: number; // in seconds
}

// Editor State
export interface EditorState {
  code: string;
  language: 'python' | 'cpp' | 'java' | 'javascript';
  theme: 'dark' | 'light';
}

// Submission Result
export interface SubmissionResult {
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error';
  testsPassed: number;
  totalTests: number;
  runtime?: number;
  memory?: number;
  userComplexity?: {
    time: string;
    space: string;
  };
  optimalComplexity?: {
    time: string;
    space: string;
  };
}

// Syllabus
export interface SyllabusTopic {
  id: string;
  name: string;
  description?: string;
  subtopics?: string[];
  relatedProblems?: string[];
  progress: number;
}

// Visualizer / Tracer
export interface TraceStep {
  line: number;
  vars: Record<string, unknown>;
  changed: string[];
}

export interface TraceResult {
  status: string;
  result: unknown;
  steps: TraceStep[];
  total_steps: number;
  flowchart_mermaid: string;
  complexity: { time: string; space?: string; note: string };
  error?: string;
}

// Bug Analysis
export interface BugReport {
  type: string;
  line: number;
  message: string;
  fix: string;
}

// Run / Judge result
export interface RunResult {
  status: 'OK' | 'CE' | 'RE' | 'TLE' | 'WA';
  output?: string;
  error?: string;
  runtime_ms: number;
}

// Dashboard
export interface DashboardSummary {
  total_solved: number;
  streak: number;
  avg_time_min: number;
  success_rate: number;
}

export interface DashboardReport {
  summary: DashboardSummary;
  skill_scores: SkillData[];
  weak_topics: string[];
  recommendations: RecommendedProblem[];
  exam_readiness: number;
  root_cause?: string;
}

export interface RecommendedProblem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reason?: string;
}

// Problem Stats
export interface ProblemStat {
  difficulty: string;
  solved: number;
  total: number;
}
