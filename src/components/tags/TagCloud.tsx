import type { Tag, TagRelationship } from '@/types/tags';

interface TagCloudProps {
  tags: { tag: Tag; relationship_type: TagRelationship }[];
  showRelationship?: boolean;
}

const relationshipLabels: Record<TagRelationship, string> = {
  teach: 'I can help with',
  learn: "I'm curious about",
  interest: 'My interests',
};

const relationshipColors: Record<TagRelationship, string> = {
  teach: 'bg-amber-50 text-amber-700 border-amber-200',
  learn: 'bg-purple-50 text-purple-700 border-purple-200',
  interest: 'bg-green-50 text-green-700 border-green-200',
};

export function TagCloud({ tags, showRelationship = true }: TagCloudProps) {
  if (tags.length === 0) return null;

  // Group by relationship
  const grouped = tags.reduce((acc, item) => {
    if (!acc[item.relationship_type]) acc[item.relationship_type] = [];
    acc[item.relationship_type].push(item.tag);
    return acc;
  }, {} as Record<TagRelationship, Tag[]>);

  return (
    <div className="space-y-4">
      {(Object.keys(grouped) as TagRelationship[]).map((rel) => (
        <div key={rel}>
          {showRelationship && (
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              {relationshipLabels[rel]}
            </h4>
          )}
          <div className="flex flex-wrap gap-2">
            {grouped[rel].map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${relationshipColors[rel]}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
