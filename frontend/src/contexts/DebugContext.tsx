import React, { createContext, useContext, useState, useEffect } from 'react';

interface DebugIssue {
  severity: string;
  type: string;
  file: string;
  line?: number;
  description: string;
  suggestion?: string;
  codeExample?: string;
}

interface RepositoryInfo {
  owner: string;
  repo: string;
  branch?: string;
}

interface DebugFix {
  issue: DebugIssue;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  error?: string;
}

interface DebugContextType {
  selectedIssues: DebugIssue[];
  setSelectedIssues: (issues: DebugIssue[]) => void;
  repositoryInfo: RepositoryInfo | null;
  setRepositoryInfo: (info: RepositoryInfo | null) => void;
  fixes: DebugFix[];
  addFix: (fix: DebugFix) => void;
  clearFixes: () => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

const STORAGE_KEY = 'debug_session_state';

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [selectedIssues, setSelectedIssuesState] = useState<DebugIssue[]>([]);
  const [repositoryInfo, setRepositoryInfoState] = useState<RepositoryInfo | null>(null);
  const [fixes, setFixes] = useState<DebugFix[]>([]);
  const [sessionId, setSessionIdState] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSelectedIssuesState(data.selectedIssues || []);
        setRepositoryInfoState(data.repositoryInfo || null);
        setFixes(data.fixes || []);
        setSessionIdState(data.sessionId || null);
      } catch (error) {
        console.error('Failed to load debug state:', error);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    const state = {
      selectedIssues,
      repositoryInfo,
      fixes,
      sessionId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [selectedIssues, repositoryInfo, fixes, sessionId]);

  const setSelectedIssues = (issues: DebugIssue[]) => {
    setSelectedIssuesState(issues);
  };

  const setRepositoryInfo = (info: RepositoryInfo | null) => {
    setRepositoryInfoState(info);
  };

  const addFix = (fix: DebugFix) => {
    setFixes((prev) => [...prev, fix]);
  };

  const clearFixes = () => {
    setFixes([]);
    setSelectedIssuesState([]);
    setRepositoryInfoState(null);
    setSessionIdState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const setSessionId = (id: string | null) => {
    setSessionIdState(id);
  };

  return (
    <DebugContext.Provider
      value={{
        selectedIssues,
        setSelectedIssues,
        repositoryInfo,
        setRepositoryInfo,
        fixes,
        addFix,
        clearFixes,
        sessionId,
        setSessionId,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}
