import { describe, expect, it } from 'vitest';
import {
  COMPLETE_FIXTURE_EXPECTATIONS,
  COMPLETE_FIXTURE_IDS,
  COMPLETE_TEST_ACCOUNT,
  buildClubTabUrl,
} from '@/test/fixtures/completeAccountFixture';

function flatten(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(flatten);
  }
  return [];
}

describe('complete account fixture', () => {
  it('pins the requested QA login account', () => {
    expect(COMPLETE_TEST_ACCOUNT.email).toBe('oussama.nekker.xxx@gmail.com');
    expect(COMPLETE_TEST_ACCOUNT.password).toBe('skillclub2025');
  });

  it('keeps all ids unique for deterministic seeding', () => {
    const ids = flatten(COMPLETE_FIXTURE_IDS);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('covers all planned event styles and request types', () => {
    expect(COMPLETE_FIXTURE_EXPECTATIONS.eventStyles).toEqual(['workshop', 'sprint', 'showcase']);
    expect(COMPLETE_FIXTURE_EXPECTATIONS.requestTypes).toEqual(['room', 'project_help', 'event_help']);
  });

  it('includes the core stack poll options used in chat', () => {
    expect(COMPLETE_FIXTURE_EXPECTATIONS.pollOptions).toEqual(['Python', 'React', 'Vite', 'SQL']);
  });

  it('builds stable tab deep links for QA checks', () => {
    const url = buildClubTabUrl(COMPLETE_FIXTURE_IDS.clubId, 'events', {
      event: COMPLETE_FIXTURE_IDS.events.workshop,
    });
    expect(url).toContain(`/app/club/${COMPLETE_FIXTURE_IDS.clubId}`);
    expect(url).toContain('tab=events');
    expect(url).toContain(`event=${COMPLETE_FIXTURE_IDS.events.workshop}`);
  });
});
