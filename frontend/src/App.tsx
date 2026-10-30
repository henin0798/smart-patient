import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './router';
import { api } from './lib/api-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 minutes - keep tab and profile data cached for instant switching
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection time
    },
  },
});

export const App: React.FC = () => {
  useEffect(() => {
    // Proactively pre-warm backend service so user sign-in does not hit cold start delay
    api.get('/health').catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
