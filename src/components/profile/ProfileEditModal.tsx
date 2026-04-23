import { Phone, X } from 'lucide-react';

interface ProfileEditValues {
  bio: string;
  city: string;
  region: string;
  phone: string;
  languages: string;
  teach: string;
  learn: string;
}

interface ProfileEditModalProps {
  open: boolean;
  values: ProfileEditValues;
  regions: string[];
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: <K extends keyof ProfileEditValues>(field: K, value: ProfileEditValues[K]) => void;
}

export type { ProfileEditValues };

export default function ProfileEditModal({
  open,
  values,
  regions,
  isSaving,
  onClose,
  onSave,
  onChange,
}: ProfileEditModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 id="profile-edit-title" className="text-2xl font-semibold text-[var(--color-navy)]">Edit profile</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Update your public profile without changing the current data flow.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[var(--color-navy)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-navy)]">Bio</span>
            <textarea
              value={values.bio}
              onChange={(e) => onChange('bio', e.target.value)}
              rows={4}
              placeholder="Tell people what you care about and what you bring to the community."
              className="input-sc min-h-[120px] resize-y"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-navy)]">City</span>
            <input
              type="text"
              value={values.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="Essaouira"
              className="input-sc"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-navy)]">Region</span>
            <select
              value={values.region}
              onChange={(e) => onChange('region', e.target.value)}
              className="input-sc"
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)]">
              <Phone className="h-4 w-4 text-[var(--color-amber)]" />
              Phone number
            </span>
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+212 6XX XXX XXX"
              className="input-sc"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-navy)]">
              Languages (comma separated)
            </span>
            <input
              type="text"
              value={values.languages}
              onChange={(e) => onChange('languages', e.target.value)}
              placeholder="Arabic, French, English"
              className="input-sc"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-navy)]">What I teach</span>
            <input
              type="text"
              value={values.teach}
              onChange={(e) => onChange('teach', e.target.value)}
              placeholder="React, TypeScript, UI Design"
              className="input-sc"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-navy)]">What I learn</span>
            <input
              type="text"
              value={values.learn}
              onChange={(e) => onChange('learn', e.target.value)}
              placeholder="Spanish, Surfing, Music"
              className="input-sc"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-amber)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
