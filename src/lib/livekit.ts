import { supabase } from '@/lib/supabase';

interface GetLiveKitTokenInput {
  roomId: string;
  displayName: string;
}

interface LiveKitTokenResponse {
  token?: string;
  wsUrl?: string;
  error?: string;
}

/**
 * Fetch a short-lived LiveKit access token from the app backend.
 * Defaults to the co-located Vercel function at /api/livekit-token.
 */
export async function getLiveKitCredentials(input: GetLiveKitTokenInput): Promise<{ token: string; wsUrl: string }> {
  const tokenEndpoint = (import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT || '/api/livekit-token').trim();
  const configuredWsUrl = (import.meta.env.VITE_LIVEKIT_WS_URL || '').trim();

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token?.trim();
  if (!accessToken) {
    throw new Error('You must be signed in to join voice rooms.');
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      roomId: input.roomId,
      displayName: input.displayName,
    }),
  });

  let payload: LiveKitTokenResponse = {};
  try {
    payload = (await response.json()) as LiveKitTokenResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to fetch voice-room token');
  }

  const token = payload.token?.trim() || '';
  const wsUrl = payload.wsUrl?.trim() || configuredWsUrl;

  if (!token) {
    throw new Error('Voice token endpoint did not return a token.');
  }
  if (!wsUrl) {
    throw new Error('Missing LiveKit websocket URL. Set VITE_LIVEKIT_WS_URL or return wsUrl from token endpoint.');
  }

  return { token, wsUrl };
}
