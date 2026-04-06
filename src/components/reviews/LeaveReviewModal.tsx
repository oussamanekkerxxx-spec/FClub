import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Star, X, Loader2 } from 'lucide-react';
import type { Review } from '@/types/skills';

const REVIEW_TAGS = ['Prepared', 'Patient', 'Expert', 'Encouraging', 'Creative', 'Helpful'];

interface Props {
  skillId: string;
  skillTitle: string;
  onClose: () => void;
  onSubmitted: (review: Review) => void;
}

export default function LeaveReviewModal({ skillId, skillTitle, onClose, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    if (!user) { toast.error('Sign in to leave a review'); return; }
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    if (!content.trim()) { toast.error('Please write a short review'); return; }

    setSubmitting(true);
    const { data, error } = await supabase
      .from('reviews')
      .insert({ skill_id: skillId, reviewer_id: user.id, rating, content: content.trim(), tags: selectedTags })
      .select('*, profiles!reviews_reviewer_id_fkey(id, first_name, last_name, avatar_url, city)')
      .single();

    setSubmitting(false);

    if (error) {
      if (error.code === '23505') { toast.error('You already reviewed this skill.'); }
      else { toast.error('Could not submit review. Please try again.'); }
      return;
    }

    const mapped = {
      id: data.id,
      rating: data.rating,
      content: data.content,
      tags: data.tags || [],
      created_at: data.created_at,
      reviewer: {
        id: data.profiles?.id || user.id,
        firstName: data.profiles?.first_name || user.firstName,
        lastName: data.profiles?.last_name || user.lastName,
        avatar: data.profiles?.avatar_url || user.avatar || '',
        city: data.profiles?.city || user.city || '',
      },
    };

    toast.success('Review submitted!');
    onSubmitted(mapped);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="sc-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h3 className="font-heading text-navy" style={{ fontSize: '1.1rem' }}>Leave a Review</h3>
            <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{skillTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-parchment transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Star rating */}
          <div>
            <label className="block text-xs font-semibold font-body text-navy mb-2">Overall Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className="w-8 h-8 transition-colors"
                    style={
                      star <= (hovered || rating)
                        ? { fill: 'var(--color-amber)', color: 'var(--color-amber)' }
                        : { fill: 'none', color: 'var(--color-border)' }
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Written review */}
          <div>
            <label className="block text-xs font-semibold font-body text-navy mb-2">Your Review</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What was your experience like? Was the teacher helpful?"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border text-sm font-body resize-none focus:outline-none"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)', background: 'var(--color-bg)' }}
            />
            <div className="text-right text-[10px] font-body mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {content.length}/500
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold font-body text-navy mb-2">Highlights (optional)</label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="text-xs font-body px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    selectedTags.includes(tag)
                      ? { background: '#E8F5EE', borderColor: '#2D7A4F', color: '#2D7A4F' }
                      : { background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                  }
                >
                  {selectedTags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || !content.trim()}
            className="w-full btn-amber disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ padding: '0.875rem 1rem' }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
