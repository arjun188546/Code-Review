import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DebugProvider } from './contexts/DebugContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Logout } from './pages/Logout';
import { AuthSuccess } from './pages/AuthSuccess';
import { Dashboard } from './pages/Dashboard';
import { Reviews } from './pages/Reviews';
import { Debug } from './pages/Debug';
import { Repositories } from './pages/Repositories';
import { Analytics } from './pages/Analytics';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { AnalysisResults } from './pages/AnalysisResults';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DebugProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route
              path="/*"
              element={
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-20 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/reviews" element={<Reviews />} />
                      <Route path="/debug" element={<Debug />} />
                      <Route path="/repositories" element={<Repositories />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/activity" element={<Activity />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/analysis/:analysisId" element={<AnalysisResults />} />
                    </Routes>
                  </main>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </DebugProvider>
    </QueryClientProvider>
  );
}

export default App;
