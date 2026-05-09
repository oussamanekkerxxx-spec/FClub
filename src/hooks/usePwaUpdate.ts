import { useState, useEffect, useCallback } from 'react';

interface PwaUpdateState {
  needRefresh: boolean;
  updateServiceWorker: () => void;
}

export function usePwaUpdate(): PwaUpdateState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      // New service worker took control → reload the page
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for waiting service worker on mount
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setWaitingServiceWorker(registration.waiting);
        setNeedRefresh(true);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New worker installed and waiting
            setWaitingServiceWorker(newWorker);
            setNeedRefresh(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (waitingServiceWorker) {
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingServiceWorker]);

  return { needRefresh, updateServiceWorker };
}
