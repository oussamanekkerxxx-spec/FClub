/**
 * ClubSettingsModal
 *
 * Available to: Admin only.
 * Evaluation: [authenticated] + [admin] -> Edit club settings or delete club
 */
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, Loader2, Trash2, AlertTriangle, Globe, Lock } from 'lucide-react';
import type { Club } from '@/types/fightclub';

interface Props {
  club: Club;
  onClose: () => void;
  onUpdated: (club: Club) => void;
  onDeleted: () => void;
}

export default function ClubSettingsModal({ club, onClose, onUpdated, onDeleted }: Props) {
  const [name, setName]               = useState(club.name);
  const [description, setDescription] = useState(club.description ?? '');
  const [isPrivate, setIsPrivate]     = useState(club.is_private);
  const [city, setCity]               = useState(club.city ?? '');
  const [tagsInput, setTagsInput]     = useState(club.tags.join(', '));
  const [rulesInput, setRulesInput]   = useState(club.rules.join('\n'));
  const [saving, setSaving]           = useState(false);
  const [showDanger, setShowDanger]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting]       = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const tags  = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const rules = rulesInput.split('\n').map(r => r.trim()).filter(Boolean);

    const { data, error } = await supabase
      .from('clubs')
      .update({ name: name.trim(), description: description.trim() || null, is_private: isPrivate, city: city.trim() || null, tags, rules })
      .eq('id', club.id)
      .select('*')
      .single();

    if (error) {
      toast.error('Could not save settings.');
    } else {
      toast.success('Club settings updated.');
      onUpdated(data);
      onClose();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== club.name) return;
    setDeleting(true);
    const { error } = await supabase.from('clubs').delete().eq('id', club.id);
    if (error) {
      toast.error('Could not delete club.');
      setDeleting(false);
    } else {
      toast('Club deleted.');
      onDeleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: 'var(--color-navy)' }}>
          <h2 className="font-heading font-semibold text-white">Club Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Club Name <span className="text-red-400">*</span>
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="input-sc w-full" maxLength={80} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="input-sc w-full resize-none min-h-[80px] text-sm" maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">City</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              className="input-sc w-full" maxLength={60} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Tags (comma-separated)</label>
            <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
              className="input-sc w-full" placeholder="guitar, beginner, weekly" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Rules (one per line)</label>
            <textarea value={rulesInput} onChange={e => setRulesInput(e.target.value)}
              className="input-sc w-full resize-none min-h-[80px] text-sm" placeholder="Be respectful&#10;English only" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: 'Public', icon: Globe, desc: 'Anyone can join' },
                { value: true,  label: 'Private', icon: Lock,  desc: 'Invite / request only' },
              ].map(opt => (
                <button key={String(opt.value)} type="button"
                  onClick={() => setIsPrivate(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    isPrivate === opt.value
                      ? 'border-[var(--color-navy)] bg-[var(--color-navy)]/5'
                      : 'border-[var(--color-border)] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-navy">
                    <opt.icon className="w-4 h-4" /> {opt.label}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
              style={{ background: 'var(--color-navy)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="border border-red-200 rounded-xl overflow-hidden mt-4">
            <button type="button" onClick={() => setShowDanger(v => !v)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</span>
              <span className="text-xs text-red-400">{showDanger ? 'Hide' : 'Show'}</span>
            </button>
            {showDanger && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Deleting this club is permanent. All posts, quests, and memberships will be removed.
                  Type <strong>{club.name}</strong> to confirm.
                </p>
                <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={`Type "${club.name}" to confirm`}
                  className="input-sc w-full text-sm" />
                <button type="button" onClick={handleDelete}
                  disabled={deleteConfirm !== club.name || deleting}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                  style={{ background: '#EF4444' }}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete Club</>}
                </button>
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
