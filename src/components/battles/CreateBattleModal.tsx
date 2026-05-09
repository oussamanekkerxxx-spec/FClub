import { useState } from 'react';
import { X, Swords } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateBattle } from '@/hooks/useBattles';
import type { BattleFormat, JudgeType } from '@/types/battles';
import { toast } from 'sonner';

interface CreateBattleModalProps {
  clubId: string;
  open: boolean;
  onClose: () => void;
}

export function CreateBattleModal({ clubId, open, onClose }: CreateBattleModalProps) {
  const { user } = useAuth();
  const createBattle = useCreateBattle();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState<BattleFormat>('text');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !topic.trim()) return;

    createBattle.mutate(
      {
        club_id: clubId,
        title: title.trim(),
        description: '',
        topic: topic.trim(),
        format,
        challenger_id: user.id,
        opponent_id: null,
        challenger_club_id: clubId,
        opponent_club_id: null,
        judge_type: 'community_vote' as JudgeType,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      },
      {
        onSuccess: () => {
          toast.success('Battle created!');
          setTitle('');
          setTopic('');
          setDeadline('');
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-sc" />
            Start a Battle
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Best React Hook Explanation"
              required
            />
          </div>
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., React Hooks"
              required
            />
          </div>
          <div>
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as BattleFormat)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="text">Text</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="code">Code</option>
              <option value="audio">Audio</option>
            </select>
          </div>
          <div>
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBattle.isPending || !title.trim() || !topic.trim()}
              className="bg-navy text-white hover:bg-navy/90"
            >
              {createBattle.isPending ? 'Creating...' : 'Create Battle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
