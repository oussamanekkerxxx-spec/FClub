import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const msg = query.meta?.errorMessage as string | false | undefined;
      if (msg !== false) {
        toast.error(typeof msg === 'string' ? msg : (error as Error).message ?? 'Failed to load data');
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,   // data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,     // unused cache entries cleaned up after 10 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
