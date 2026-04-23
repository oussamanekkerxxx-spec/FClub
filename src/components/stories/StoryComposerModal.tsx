import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Type, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoryComposer } from '@/hooks/useStoryComposer';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const GRADIENTS = [
  'linear-gradient(135deg, #1B2A4A 0%, #2A4073 100%)',   // Navy
  'linear-gradient(135deg, #C4873A 0%, #E16B3B 100%)',   // Amber
  'linear-gradient(135deg, #5C3D8F 0%, #8960C6 100%)',   // Plum
  'linear-gradient(135deg, #2D7A4F 0%, #4BA874 100%)',   // Forest
];

interface StoryComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId?: string; // Optional: prepopulate specific club if needed
}

export default function StoryComposerModal({ isOpen, onClose, clubId }: StoryComposerModalProps) {
  const { postStory, isUploading, uploadProgress } = useStoryComposer();
  
  const [activeTab, setActiveTab] = useState<'media' | 'text'>('media');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [text, setText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const objUrl = URL.createObjectURL(selected);
      setPreviewUrl(objUrl);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const handleSubmit = async () => {
    let success = false;

    if (activeTab === 'media' && file) {
      const isVideo = file.type.startsWith('video/');
      success = await postStory({
        mediaType: isVideo ? 'video' : 'image',
        file,
        caption: text.trim(),
        clubId,
      });
    } else if (activeTab === 'text' && text.trim()) {
      success = await postStory({
        mediaType: 'text',
        caption: text.trim(),
        backgroundGradient: selectedGradient,
        clubId,
      });
    }

    if (success) {
      clearFile();
      setText('');
      onClose();
    }
  };

  const isSubmitDisabled = isUploading || (activeTab === 'media' && !file) || (activeTab === 'text' && !text.trim());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isUploading && !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[var(--color-parchment)] border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.05)]">
          <h2 className="text-lg font-heading font-semibold text-[var(--color-navy)]">Create Story</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isUploading}>
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        <div className="flex bg-white/50 border-b border-[rgba(0,0,0,0.05)]">
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'media'
                ? 'border-[var(--color-amber)] text-[var(--color-navy)]'
                : 'border-transparent text-gray-500 hover:bg-black/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="w-4 h-4" /> Photo / Video
            </div>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-[var(--color-amber)] text-[var(--color-navy)]'
                : 'border-transparent text-gray-500 hover:bg-black/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Type className="w-4 h-4" /> Text
            </div>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'media' ? (
            <div className="space-y-4">
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-[rgba(0,0,0,0.15)] bg-white/50 rounded-2xl h-64 cursor-pointer hover:bg-white transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[rgba(196,135,58,0.1)] flex items-center justify-center mb-3 text-[var(--color-amber)]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-navy)]">Click or drag & drop</span>
                  <span className="text-xs text-gray-500 mt-1">Image or Video up to 50MB</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black/5 h-64 flex items-center justify-center">
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {file.type.startsWith('video/') ? (
                    <video src={previewUrl!} controls className="max-h-full max-w-full" />
                  ) : (
                    <img src={previewUrl!} alt="Preview" className="max-h-full max-w-full object-contain" />
                  )}
                </div>
              )}
              <input
                type="text"
                placeholder="Add a caption..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20 transition-all text-sm text-[var(--color-navy)] placeholder:text-gray-400"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="rounded-2xl h-64 flex flex-col items-center justify-center p-6 text-center text-white transition-all shadow-inner"
                style={{ background: selectedGradient }}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your story..."
                  className="w-full bg-transparent border-none outline-none resize-none text-2xl font-semibold text-center placeholder:text-white/60 focus:ring-0"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3 justify-center">
                {GRADIENTS.map((gradient, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedGradient(gradient)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      selectedGradient === gradient ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ background: gradient }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-[rgba(0,0,0,0.05)] bg-white/50">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full btn-amber text-white border-none py-6 flex items-center justify-center gap-2 text-base font-semibold"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Posting ({Math.round(uploadProgress)}%)
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Post Story
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
