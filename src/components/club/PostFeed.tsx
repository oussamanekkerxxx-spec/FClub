import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ClubPost } from '@/types/fightclub';
import { formatDistanceToNow } from 'date-fns';
import {
  Flame, MessageSquare, Pin, Trash2, FileText, ExternalLink,
} from 'lucide-react';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';

function PostCard({
  post, currentUserId, isMember, canModerate, onReact, onDelete, onPin,
}: {
  post: ClubPost;
  currentUserId: string | undefined;
  isMember: boolean;
  canModerate: boolean;
  onReact: (postId: string) => void;
  onDelete: (postId: string) => void;
  onPin: (postId: string, current: boolean) => void;
}) {
  const isOwn = post.author_id === currentUserId;
  const reacted = !!post.my_reaction;
  const safePdfUrl = normalizeHttpUrl(post.pdf_url);

  return (
    <div className={`sc-card p-5 ${post.is_pinned ? 'border-l-4 border-l-[var(--color-amber)]' : ''}`}>
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 text-[var(--color-amber)] text-xs font-semibold mb-3">
          <Pin className="w-3 h-3" /> Pinned
        </div>
      )}
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={post.author?.avatar_url ?? undefined} />
          <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '13px' }}>
            {post.author?.first_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-sm text-navy">
                {post.author?.first_name} {post.author?.last_name}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] ml-2">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {canModerate && (
                <button
                  onClick={() => onPin(post.id, post.is_pinned)}
                  title={post.is_pinned ? 'Unpin' : 'Pin post'}
                  className={`p-1.5 rounded-lg transition-colors ${post.is_pinned ? 'text-[var(--color-amber)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-amber)]'} hover:bg-amber-50`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              )}
              {(isOwn || canModerate) && (
                <button
                  onClick={() => onDelete(post.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="mt-3 rounded-xl max-h-64 object-cover w-full"
            />
          )}
          {post.video_url && (
            <video
              src={post.video_url}
              controls
              className="mt-3 rounded-xl w-full max-h-72 bg-black"
            />
          )}
          {safePdfUrl && (
            <a
              href={safePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors text-sm font-medium text-navy"
            >
              <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="truncate">{extractFileNameFromUrl(safePdfUrl, 'document.pdf')}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-[var(--color-text-muted)]" />
            </a>
          )}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border)]">
            <button
              disabled={!isMember}
              onClick={() => onReact(post.id)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                reacted ? 'text-[var(--color-amber)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-amber)]'
              } disabled:opacity-40`}
            >
              <Flame className="w-4 h-4" />
              {post.reaction_count}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <MessageSquare className="w-4 h-4" />
              {post.comment_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface PostFeedProps {
  posts: ClubPost[];
  currentUserId: string | undefined;
  isMember: boolean;
  canModerate: boolean;
  onReact: (postId: string) => void;
  onDelete: (postId: string) => void;
  onPin: (postId: string, current: boolean) => void;
}

export default function PostFeed({
  posts, currentUserId, isMember, canModerate, onReact, onDelete, onPin,
}: PostFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="sc-card p-10 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-secondary)] text-sm">No posts yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isMember={isMember}
          canModerate={canModerate}
          onReact={onReact}
          onDelete={onDelete}
          onPin={onPin}
        />
      ))}
    </>
  );
}
