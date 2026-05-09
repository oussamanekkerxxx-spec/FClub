import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import './index.css'
import App from './App.tsx'
import { OfflineBanner } from '@/components/errors'
import { I18nProvider } from '@/contexts/I18nProvider'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const msg = query.meta?.errorMessage as string | false | undefined;
      if (msg !== false) {
        toast.error(typeof msg === 'string' ? msg : (error as Error).message ?? 'Failed to load data');
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const msg = mutation.meta?.errorMessage as string | false | undefined;
      if (msg !== false) {
        toast.error(typeof msg === 'string' ? msg : (error as Error).message ?? 'Action failed');
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
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <OfflineBanner />
      </QueryClientProvider>
    </I18nProvider>
  </StrictMode>,
)
