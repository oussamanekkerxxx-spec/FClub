import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { usePwaUpdate } from '@/hooks/usePwaUpdate';

const SESSION_DISMISS_KEY = 'fc-update-dismissed';

export function UpdateBanner() {
  const { needRefresh, updateServiceWorker } = usePwaUpdate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissal on mount if a new update is pending
    if (needRefresh) {
      const wasDismissed = sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true';
      setDismissed(wasDismissed);
    }
  }, [needRefresh]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
    setDismissed(true);
  };

  const handleUpdate = () => {
    updateServiceWorker();
  };

  if (!needRefresh || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl text-sm text-white shadow-floating animate-in slide-in-from-bottom-4"
      style={{ background: 'var(--color-navy)', maxWidth: 'calc(100vw - 2rem)' }}
    >
      <RefreshCw className="w-4 h-4 flex-shrink-0 text-amber-300" />
      <span className="font-medium whitespace-nowrap">
        A new version is available
      </span>
      <button
        onClick={handleUpdate}
        className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-sc text-white hover:bg-amber-500 transition-colors flex-shrink-0"
      >
        Update Now
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
        aria-label="Dismiss update notice"
      >
        <X className="w-3.5 h-3.5 text-white/60" />
      </button>
    </div>
  );
}
