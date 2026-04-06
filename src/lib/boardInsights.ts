import type { BoardMapPoint, BoardPost, BoardRankedPost, BoardScoreBreakdown, GeoPoint } from '@/types/board';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return earthRadiusKm * c;
}

function distanceScore(distanceKm: number | null): number {
  if (distanceKm === null) return 6;
  if (distanceKm <= 2) return 20;
  if (distanceKm <= 5) return 16;
  if (distanceKm <= 10) return 12;
  if (distanceKm <= 25) return 8;
  if (distanceKm <= 50) return 4;
  return 1;
}

function createReasons(post: BoardPost, score: BoardScoreBreakdown, distanceKm: number | null): string[] {
  const reasons: string[] = [];

  if (post.signals.sharedSkillCount > 0) {
    reasons.push(`${post.signals.sharedSkillCount} shared skill interest${post.signals.sharedSkillCount > 1 ? 's' : ''}`);
  }
  if (post.signals.hasDirectConversation) {
    reasons.push('Already in contact');
  }
  if (post.signals.sharedActivityCount > 0) {
    reasons.push(`${post.signals.sharedActivityCount} previous activity${post.signals.sharedActivityCount > 1 ? 'ies' : 'y'} together`);
  }
  if (distanceKm !== null) {
    reasons.push(`${distanceKm.toFixed(1)} km away`);
  }
  if ((post.author?.trust_tier ?? 0) >= 3) {
    reasons.push(`Trust tier ${post.author?.trust_tier}`);
  }
  if (score.total < 20) {
    reasons.push('Needs more context signals');
  }

  return reasons.slice(0, 3);
}

export function scoreBoardPosts(posts: BoardPost[], viewerLocation: GeoPoint | null): BoardRankedPost[] {
  const ranked = posts.map<BoardRankedPost>((post) => {
    const hasCoords = post.location_lat !== null && post.location_lng !== null;
    const distanceKm =
      hasCoords && viewerLocation
        ? haversineKm(viewerLocation, { lat: post.location_lat as number, lng: post.location_lng as number })
        : null;

    const skills = clamp(post.signals.sharedSkillCount * 10 + post.signals.sharedLanguageCount * 4, 0, 32);
    const contact = clamp((post.signals.hasDirectConversation ? 14 : 0) + post.signals.messagesExchanged * 0.8, 0, 24);
    const activity = clamp(post.signals.sharedActivityCount * 6, 0, 18);
    const trust = clamp((post.author?.trust_tier ?? 0) * 2, 0, 8);
    const actions = clamp((post.signals.trustSignalsCount + post.signals.boardActionSignalsCount) * 4, 0, 12);
    const distance = distanceScore(distanceKm);

    const total = clamp(skills + contact + activity + trust + actions + distance, 0, 100);
    const score: BoardScoreBreakdown = { skills, contact, activity, trust, actions, distance, total };

    return {
      ...post,
      distance_km: distanceKm,
      score,
      reasons: createReasons(post, score, distanceKm),
    };
  });

  ranked.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return ranked;
}

function hashToUnit(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function fallbackPosition(id: string): { x: number; y: number } {
  const a = hashToUnit(id);
  const b = hashToUnit(`${id}-y`);
  return {
    x: 12 + a * 76,
    y: 12 + b * 76,
  };
}

export function buildMapPoints(rankedPosts: BoardRankedPost[]): BoardMapPoint[] {
  const withCoords = rankedPosts.filter(
    (post) => post.location_lat !== null && post.location_lng !== null
  );

  let minLat = 0;
  let maxLat = 0;
  let minLng = 0;
  let maxLng = 0;

  if (withCoords.length > 0) {
    minLat = Math.min(...withCoords.map((p) => p.location_lat as number));
    maxLat = Math.max(...withCoords.map((p) => p.location_lat as number));
    minLng = Math.min(...withCoords.map((p) => p.location_lng as number));
    maxLng = Math.max(...withCoords.map((p) => p.location_lng as number));
  }

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  return rankedPosts.map((post) => {
    const hasCoords = post.location_lat !== null && post.location_lng !== null;

    if (!hasCoords || latSpan === 0 || lngSpan === 0) {
      const fallback = fallbackPosition(post.id);
      return { ...post, x: fallback.x, y: fallback.y };
    }

    const x = 8 + (((post.location_lng as number) - minLng) / lngSpan) * 84;
    const y = 8 + (1 - (((post.location_lat as number) - minLat) / latSpan)) * 84;
    return { ...post, x: clamp(x, 6, 94), y: clamp(y, 6, 94) };
  });
}
