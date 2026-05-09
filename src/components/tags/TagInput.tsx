import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useSearchTags, useCreateTag } from '@/hooks/useTags';
import type { Tag, TagRelationship } from '@/types/tags';

interface TagInputProps {
  selected: Tag[];
  onChange: (tags: Tag[]) => void;
  relationshipType: TagRelationship;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  selected,
  onChange,
  relationshipType,
  placeholder = 'Add a tag...',
  maxTags = 10,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults = [] } = useSearchTags(input);
  const createTag = useCreateTag();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tag: Tag) => {
    if (selected.find((t) => t.id === tag.id)) return;
    if (selected.length >= maxTags) return;
    onChange([...selected, tag]);
    setInput('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (tagId: string) => {
    onChange(selected.filter((t) => t.id !== tagId));
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const existing = searchResults.find(
        (t) => t.name.toLowerCase() === input.trim().toLowerCase()
      );
      if (existing) {
        handleSelect(existing);
      } else {
        // Create new tag
        try {
          const newTag = await createTag.mutateAsync(input.trim());
          handleSelect(newTag);
        } catch {
          // Tag might already exist (race condition), search again
          const retry = searchResults.find(
            (t) => t.name.toLowerCase() === input.trim().toLowerCase()
          );
          if (retry) handleSelect(retry);
        }
      }
    }
    if (e.key === 'Backspace' && !input && selected.length > 0) {
      handleRemove(selected[selected.length - 1].id);
    }
  };

  const relationshipColors: Record<TagRelationship, string> = {
    teach: 'bg-amber-50 text-amber-700 border-amber-200',
    learn: 'bg-plum-50 text-plum-700 border-plum-200',
    interest: 'bg-forest-50 text-forest-700 border-forest-200',
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-white min-h-[44px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((tag) => (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${relationshipColors[relationshipType]}`}
          >
            {tag.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tag.id);
              }}
              className="hover:opacity-70"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selected.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
          />
        )}
      </div>

      {open && input.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-[var(--color-border)] shadow-floating max-h-48 overflow-y-auto">
          {searchResults.length === 0 ? (
            <button
              onClick={() => handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-navy hover:bg-parchment/50 transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-sc" />
              Create "{input.trim()}"
            </button>
          ) : (
            searchResults.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleSelect(tag)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-navy hover:bg-parchment/50 transition-colors"
              >
                <span>{tag.name}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {tag.usage_count} uses
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
