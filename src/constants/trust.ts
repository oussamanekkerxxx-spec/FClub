import type { TrustTier } from '@/contexts/AuthContext';

export const TIER_COLORS: Record<TrustTier, { bg: string; text: string; label: string }> = {
  0: { bg: '#EDF2FF', text: '#4C6EF5', label: 'Explorer' },
  1: { bg: '#E3F2FD', text: '#1976D2', label: 'Member' },
  2: { bg: '#E8F5EE', text: '#2D7A4F', label: 'Verified' },
  3: { bg: '#FFF3E0', text: '#C4873A', label: 'Teacher' },
  4: { bg: '#EDE8F7', text: '#5C3D8F', label: 'Connector' },
};
