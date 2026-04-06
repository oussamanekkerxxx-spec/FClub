/**
 * Contract tests for the queryKeys factory.
 *
 * These are NOT testing implementation — they pin the exact tuple shapes that
 * TanStack Query uses for cache invalidation. A hierarchy change (e.g. moving
 * 'members' to a different position) would silently break stale-while-revalidate
 * across the app. Failing tests here tell you to also update every invalidation
 * call site.
 */
import { describe, it, expect } from 'vitest';
import { queryKeys } from '@/lib/queryKeys';

const CLUB_ID = 'club-abc';
const USER_ID = 'user-xyz';
const SLUG = 'intro-to-guitar';
const CONV_ID = 'conv-123';

describe('queryKeys — clubs', () => {
  it('list', () => {
    expect(queryKeys.clubs.list()).toEqual(['clubs']);
  });

  it('detail', () => {
    expect(queryKeys.clubs.detail(CLUB_ID)).toEqual(['club', CLUB_ID]);
  });

  it('members', () => {
    expect(queryKeys.clubs.members(CLUB_ID)).toEqual(['club', CLUB_ID, 'members']);
  });

  it('quests', () => {
    expect(queryKeys.clubs.quests(CLUB_ID)).toEqual(['club', CLUB_ID, 'quests']);
  });

  it('requests', () => {
    expect(queryKeys.clubs.requests(CLUB_ID)).toEqual(['club', CLUB_ID, 'requests']);
  });

  it('resources', () => {
    expect(queryKeys.clubs.resources(CLUB_ID)).toEqual(['club', CLUB_ID, 'resources']);
  });

  it('rooms', () => {
    expect(queryKeys.clubs.rooms(CLUB_ID)).toEqual(['club', CLUB_ID, 'rooms']);
  });

  it('hasActiveRoom', () => {
    expect(queryKeys.clubs.hasActiveRoom(CLUB_ID)).toEqual(['club', CLUB_ID, 'has-active-room']);
  });

  it('pendingCount', () => {
    expect(queryKeys.clubs.pendingCount(CLUB_ID)).toEqual(['club', CLUB_ID, 'pending-count']);
  });

  it('pinnedPosts', () => {
    expect(queryKeys.clubs.pinnedPosts(CLUB_ID)).toEqual(['club', CLUB_ID, 'pinned-posts']);
  });

  it('upcomingEvents', () => {
    expect(queryKeys.clubs.upcomingEvents(CLUB_ID)).toEqual(['club', CLUB_ID, 'upcoming-events']);
  });
});

describe('queryKeys — memberships', () => {
  it('mine', () => {
    expect(queryKeys.memberships.mine(USER_ID)).toEqual(['club_memberships', 'mine', USER_ID]);
  });

  it('one', () => {
    expect(queryKeys.memberships.one(CLUB_ID, USER_ID)).toEqual(['club', CLUB_ID, 'membership', USER_ID]);
  });

  it('joinRequest', () => {
    expect(queryKeys.memberships.joinRequest(CLUB_ID, USER_ID)).toEqual(['club', CLUB_ID, 'join-request', USER_ID]);
  });
});

describe('queryKeys — skills', () => {
  it('active', () => {
    expect(queryKeys.skills.active()).toEqual(['skills', 'active']);
  });

  it('byTeacher', () => {
    expect(queryKeys.skills.byTeacher(USER_ID)).toEqual(['skills', 'teacher', USER_ID]);
  });

  it('detail', () => {
    expect(queryKeys.skills.detail(SLUG)).toEqual(['skills', 'detail', SLUG]);
  });

  it('reviews', () => {
    expect(queryKeys.skills.reviews('skill-1')).toEqual(['skills', 'skill-1', 'reviews']);
  });
});

describe('queryKeys — conversations', () => {
  it('list', () => {
    expect(queryKeys.conversations.list(USER_ID)).toEqual(['conversations', USER_ID]);
  });

  it('messages', () => {
    expect(queryKeys.conversations.messages(CONV_ID)).toEqual(['messages', CONV_ID]);
  });
});

describe('queryKeys — profiles', () => {
  it('one', () => {
    expect(queryKeys.profiles.one(USER_ID)).toEqual(['profile', USER_ID]);
  });
});

describe('queryKeys — prefix hierarchy (invalidation safety)', () => {
  // TanStack Query invalidation works by prefix matching. Verify that club-scoped
  // keys all share the same root so invalidating ['club', clubId] clears them all.
  it('all club sub-keys start with ["club", clubId]', () => {
    const subKeys = [
      queryKeys.clubs.members(CLUB_ID),
      queryKeys.clubs.quests(CLUB_ID),
      queryKeys.clubs.requests(CLUB_ID),
      queryKeys.clubs.resources(CLUB_ID),
      queryKeys.clubs.rooms(CLUB_ID),
      queryKeys.clubs.hasActiveRoom(CLUB_ID),
      queryKeys.clubs.pendingCount(CLUB_ID),
      queryKeys.clubs.pinnedPosts(CLUB_ID),
      queryKeys.clubs.upcomingEvents(CLUB_ID),
    ];
    for (const key of subKeys) {
      expect(key[0]).toBe('club');
      expect(key[1]).toBe(CLUB_ID);
    }
  });
});
