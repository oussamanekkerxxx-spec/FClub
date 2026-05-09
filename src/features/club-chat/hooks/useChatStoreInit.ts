import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '@/features/club-chat/store/chatStore';

interface UseChatStoreInitProps {
  clubId?: string;
  clubCategory?: string;
}

export function useChatStoreInit({
  clubId: propClubId,
  clubCategory,
}: UseChatStoreInitProps) {
  const params = useParams<{ id: string }>();
  const resolvedClubId = propClubId || params.id || '';
  const initStore = useChatStore((s) => s.initStore);
  const prevClubId = useRef<string | null>(null);

  useEffect(() => {
    if (!resolvedClubId) return;
    if (prevClubId.current === resolvedClubId) return;
    prevClubId.current = resolvedClubId;
    initStore({ clubId: resolvedClubId, clubCategory });
  }, [resolvedClubId, clubCategory, initStore]);

  return { clubId: resolvedClubId };
}
