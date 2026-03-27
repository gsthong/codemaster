'use client';

/**
 * context.tsx — CodeContext shared across the practice IDE.
 * Provides: code, language, problem, testResults without prop-drilling.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Problem, TestCase } from './types';
import { CODE_TEMPLATES } from './constants';

type Language = 'python' | 'cpp' | 'java' | 'javascript';

interface CodeContextValue {
  code: string;
  setCode: (code: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  problem: Problem | null;
  setProblem: (p: Problem | null) => void;
  testResults: TestCase[];
  setTestResults: (results: TestCase[]) => void;
  handleLanguageChange: (lang: Language) => void;
}

const CodeContext = createContext<CodeContextValue | null>(null);

export function CodeProvider({ children, initialProblem }: { children: ReactNode; initialProblem?: Problem }) {
  const [problem, setProblem] = useState<Problem | null>(initialProblem ?? null);
  const [language, setLanguage] = useState<Language>('python');
  
  // Initialize code from problem boilerplate if available
  const [code, setCode] = useState<string>(() => {
    if (initialProblem?.boilerplate?.python) return initialProblem.boilerplate.python;
    return CODE_TEMPLATES.python;
  });
  
  const [testResults, setTestResults] = useState<TestCase[]>([]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    if (problem?.boilerplate?.[lang]) {
      setCode(problem.boilerplate[lang]);
    } else {
      setCode(CODE_TEMPLATES[lang] ?? '');
    }
  }, [problem]);

  return (
    <CodeContext.Provider
      value={{
        code,
        setCode,
        language,
        setLanguage,
        problem,
        setProblem,
        testResults,
        setTestResults,
        handleLanguageChange,
      }}
    >
      {children}
    </CodeContext.Provider>
  );
}

export function useCode(): CodeContextValue {
  const ctx = useContext(CodeContext);
  if (!ctx) throw new Error('useCode must be used inside <CodeProvider>');
  return ctx;
}
