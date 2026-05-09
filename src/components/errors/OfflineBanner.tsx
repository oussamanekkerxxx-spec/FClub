import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  // Auto-show when offline, auto-hide when online
  useEffect(() => {
    if (isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 px-4 py-2.5 text-sm text-white shadow-lg animate-in slide-in-from-top-full"
      style={{ background: 'var(--color-navy)' }}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0 text-amber-300" />
      <span className="font-medium">
        You're offline — some features are unavailable.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto p-1 rounded-md hover:bg-white/10 transition-colors"
        aria-label="Dismiss offline notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
