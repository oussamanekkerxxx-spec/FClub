import { Palette, Upload, X } from 'lucide-react';

interface CoverOption {
  label: string;
  value: string;
}

interface ProfileCoverPickerProps {
  open: boolean;
  currentCover?: string;
  currentTab: 'gradients' | 'photos';
  gradients: CoverOption[];
  photos: CoverOption[];
  onClose: () => void;
  onTabChange: (tab: 'gradients' | 'photos') => void;
  onChoose: (cover: string) => void;
  onUpload: () => void;
}

export default function ProfileCoverPicker({
  open,
  currentCover,
  currentTab,
  gradients,
  photos,
  onClose,
  onTabChange,
  onChoose,
  onUpload,
}: ProfileCoverPickerProps) {
  if (!open) return null;

  const options = currentTab === 'gradients' ? gradients : photos;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-cover-title"
    >
      <div
        className="w-full max-w-3xl rounded-[28px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[var(--color-amber)]" />
            <div>
              <h2 id="profile-cover-title" className="text-xl font-semibold text-[var(--color-navy)]">Profile background</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Choose a gradient, a photo, or upload your own cover image.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[var(--color-navy)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => onTabChange('gradients')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                currentTab === 'gradients'
                  ? 'bg-white text-[var(--color-navy)] shadow-sm'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Colors
            </button>
            <button
              onClick={() => onTabChange('photos')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                currentTab === 'photos'
                  ? 'bg-white text-[var(--color-navy)] shadow-sm'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Photos
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className={`grid gap-3 ${currentTab === 'gradients' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {options.map((option) => (
              <button
                key={option.label}
                onClick={() => onChoose(option.value)}
                className={`relative h-28 overflow-hidden rounded-3xl border-4 transition hover:scale-[1.01] ${
                  currentCover === option.value ? 'border-[var(--color-amber)]' : 'border-transparent'
                }`}
                style={
                  currentTab === 'gradients'
                    ? { background: option.value }
                    : {
                        backgroundImage: `url('${option.value}')`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                      }
                }
              >
                {currentTab === 'photos' ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                ) : null}
                <span className="absolute bottom-3 left-3 text-sm font-semibold text-white">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <button
            onClick={onUpload}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-[var(--color-navy)] transition hover:border-[var(--color-amber)] hover:bg-amber-50"
          >
            <Upload className="h-4 w-4" />
            Upload your own image
          </button>
        </div>
      </div>
    </div>
  );
}
