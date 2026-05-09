import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface QueryErrorFallbackProps {
  title?: string;
  message?: string;
  queryKey?: unknown[];
  onRetry?: () => void;
}

export function QueryErrorFallback({
  title = 'Failed to load data',
  message = 'Something went wrong while fetching this content.',
  queryKey,
  onRetry,
}: QueryErrorFallbackProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (queryKey) {
      queryClient.invalidateQueries({ queryKey });
    }
  };

  return (
    <div className="sc-card p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center bg-red-50">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>

      <h3 className="font-semibold text-navy mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-5 max-w-xs mx-auto">
        {message}
      </p>

      <button
        onClick={handleRetry}
        className="btn-amber inline-flex items-center gap-2 text-sm"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
