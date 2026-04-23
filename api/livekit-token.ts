import { createClient } from '@supabase/supabase-js';
import { AccessToken } from 'livekit-server-sdk';

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  setHeader: (name: string, value: string | string[]) => void;
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
}

interface TokenRequestBody {
  roomId?: string;
  displayName?: string;
}

function readEnv(name: string): string {
  return (process.env[name] || '').trim();
}

function parseBearerToken(rawHeader: string | string[] | undefined): string {
  const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!header) return '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || '';
}

function parseTokenRequestBody(rawBody: unknown): TokenRequestBody {
  if (!rawBody) return {};

  if (typeof rawBody === 'string') {
    try {
      const parsed = JSON.parse(rawBody) as TokenRequestBody;
      return parsed;
    } catch {
      return {};
    }
  }

  if (typeof rawBody === 'object') {
    return rawBody as TokenRequestBody;
  }

  return {};
}

function normalizeDisplayName(value: string | undefined, fallback: string): string {
  const candidate = (value || '').trim() || fallback.trim();
  return (candidate || 'Member').slice(0, 120);
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const accessToken = parseBearerToken(req.headers.authorization);
    if (!accessToken) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }

    const supabaseUrl = readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
    const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
    const livekitApiKey = readEnv('LIVEKIT_API_KEY');
    const livekitApiSecret = readEnv('LIVEKIT_API_SECRET');
    const livekitWsUrl = readEnv('LIVEKIT_WS_URL');

    if (!supabaseUrl || !serviceRoleKey) {
      res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
      return;
    }
    if (!livekitApiKey || !livekitApiSecret || !livekitWsUrl) {
      res.status(500).json({ error: 'Missing LIVEKIT_API_KEY, LIVEKIT_API_SECRET, or LIVEKIT_WS_URL' });
      return;
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    const user = authData.user;

    if (authError || !user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = parseTokenRequestBody(req.body);
    const roomId = (body.roomId || '').trim();
    if (!roomId) {
      res.status(400).json({ error: 'roomId is required' });
      return;
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('voice_rooms')
      .select('id, club_id, status')
      .eq('id', roomId)
      .maybeSingle();

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (room.status !== 'active') {
      res.status(409).json({ error: 'Room is not active' });
      return;
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('club_memberships')
      .select('status')
      .eq('club_id', room.club_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership || membership.status !== 'active') {
      res.status(403).json({ error: 'Only active club members can join this room' });
      return;
    }

    const displayName = normalizeDisplayName(
      body.displayName,
      (user.user_metadata?.full_name as string | undefined) || user.email || 'Member'
    );

    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: user.id,
      name: displayName,
      ttl: '10m',
    });

    token.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    res.status(200).json({
      token: await token.toJwt(),
      wsUrl: livekitWsUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(500).json({ error: message });
  }
}
