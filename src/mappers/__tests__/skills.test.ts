import { describe, it, expect } from 'vitest';
import { mapSkillRow, type SkillRow } from '../skills';

/** Minimal valid SkillRow — all optional fields absent */
const base: SkillRow = {
  id: 'skill-1',
  slug: null,
  teacher_id: 'teacher-1',
  title: 'Intro to Guitar',
  category: 'music',
  description: null,
  philosophy: null,
  who_for: null,
  what_session_looks_like: null,
  price_per_hour: 150,
  currency: 'MAD',
  format: null,
  location: null,
  neighborhood: null,
  languages: null,
  level: null,
  avg_rating: 0,
  reviews_count: 0,
  tags: null,
  cover_gradient: null,
  cover_image_url: null,
  is_free: false,
  is_group: false,
  max_headcount: null,
  current_headcount: null,
  availability_note: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  profiles: null,
};

describe('mapSkillRow', () => {
  it('uses id as slug when slug is null', () => {
    const skill = mapSkillRow(base);
    expect(skill.slug).toBe('skill-1');
  });

  it('uses provided slug when present', () => {
    const skill = mapSkillRow({ ...base, slug: 'intro-to-guitar' });
    expect(skill.slug).toBe('intro-to-guitar');
  });

  it('maps is_active=true → status "active"', () => {
    const skill = mapSkillRow({ ...base, is_active: true });
    expect(skill.status).toBe('active');
  });

  it('maps is_active=false → status "paused"', () => {
    const skill = mapSkillRow({ ...base, is_active: false });
    expect(skill.status).toBe('paused');
  });

  it('falls back empty string for nullable text fields', () => {
    const skill = mapSkillRow(base);
    expect(skill.description).toBe('');
    expect(skill.philosophy).toBe('');
    expect(skill.who_for).toBe('');
    expect(skill.location).toBe('');
    expect(skill.neighborhood).toBe('');
  });

  it('falls back to empty arrays for nullable array fields', () => {
    const skill = mapSkillRow(base);
    expect(skill.languages).toEqual([]);
    expect(skill.tags).toEqual([]);
  });

  it('falls back default gradient when cover_gradient is null', () => {
    const skill = mapSkillRow(base);
    expect(skill.cover_gradient).toBe('from-blue-500 to-purple-600');
  });

  it('preserves provided cover_gradient', () => {
    const skill = mapSkillRow({ ...base, cover_gradient: 'from-purple-500 to-pink-400' });
    expect(skill.cover_gradient).toBe('from-purple-500 to-pink-400');
  });

  it('passes cover_image_url through as-is (including null)', () => {
    expect(mapSkillRow(base).cover_image_url).toBeNull();
    const withImg = mapSkillRow({ ...base, cover_image_url: 'https://cdn.example.com/img.jpg' });
    expect(withImg.cover_image_url).toBe('https://cdn.example.com/img.jpg');
  });

  it('falls back "in-person" for null format', () => {
    expect(mapSkillRow(base).format).toBe('in-person');
  });

  it('falls back "all levels" for null level', () => {
    expect(mapSkillRow(base).level).toBe('all levels');
  });

  it('defaults current_headcount to 0 when null', () => {
    expect(mapSkillRow(base).current_headcount).toBe(0);
  });

  describe('teacher mapping with null profiles', () => {
    it('produces a safe teacher stub when profiles is null', () => {
      const { teacher } = mapSkillRow(base);
      expect(teacher.id).toBe('');
      expect(teacher.firstName).toBe('');
      expect(teacher.lastName).toBe('');
      expect(teacher.avatar).toBe('');
      expect(teacher.trust_tier).toBe(0);
      expect(teacher.trust_score).toBe(0);
      expect(teacher.sessions_completed).toBe(0);
      expect(teacher.reviews_count).toBe(0);
    });
  });

  describe('teacher mapping with a real profile', () => {
    const withProfile: SkillRow = {
      ...base,
      profiles: {
        id: 'teacher-1',
        first_name: 'Karim',
        last_name: 'Alami',
        avatar_url: 'https://cdn.example.com/karim.jpg',
        bio: 'Guitarist with 10 years experience.',
        neighborhood: 'Gauthier',
        city: 'Casablanca',
        trust_tier: 3,
        trust_score: 72,
        sessions_completed: 45,
        reviews_count: 12,
      },
    };

    it('maps name fields', () => {
      const { teacher } = mapSkillRow(withProfile);
      expect(teacher.firstName).toBe('Karim');
      expect(teacher.lastName).toBe('Alami');
    });

    it('composes location from city + neighborhood', () => {
      const { teacher } = mapSkillRow(withProfile);
      expect(teacher.location).toBe('Casablanca, Gauthier');
    });

    it('uses only city when neighborhood is null', () => {
      const row: SkillRow = {
        ...withProfile,
        profiles: { ...withProfile.profiles!, neighborhood: null },
      };
      expect(mapSkillRow(row).teacher.location).toBe('Casablanca');
    });

    it('uses only neighborhood when city is null', () => {
      const row: SkillRow = {
        ...withProfile,
        profiles: { ...withProfile.profiles!, city: null },
      };
      expect(mapSkillRow(row).teacher.location).toBe('Gauthier');
    });

    it('maps trust_tier and trust_score', () => {
      const { teacher } = mapSkillRow(withProfile);
      expect(teacher.trust_tier).toBe(3);
      expect(teacher.trust_score).toBe(72);
    });

    it('maps sessions_completed and reviews_count', () => {
      const { teacher } = mapSkillRow(withProfile);
      expect(teacher.sessions_completed).toBe(45);
      expect(teacher.reviews_count).toBe(12);
    });

    it('falls back sessions_completed to 0 when null', () => {
      const row: SkillRow = {
        ...withProfile,
        profiles: { ...withProfile.profiles!, sessions_completed: null },
      };
      expect(mapSkillRow(row).teacher.sessions_completed).toBe(0);
    });
  });
});
