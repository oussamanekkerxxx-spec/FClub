import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { springs } from '@/lib/animation';
import type { Message } from '@/features/club-chat/workspace/types';

interface VideoPlayerModalProps {
  msg: Message | null;
  onClose: () => void;
}

const VideoPlayerModal = React.memo(function VideoPlayerModalInternal({
  msg,
  onClose,
}: VideoPlayerModalProps) {
  return (
    <AnimatePresence>
      {msg && msg.video_url && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springs.backdrop}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent shrink-0">
            <div className="flex flex-col">
              <span className="text-white font-medium text-[15px]">
                {msg.caption || 'Video'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={msg.video_url}
                download
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                title="Download"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={onClose}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors ml-2"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Video */}
          <div
            className="flex-1 overflow-hidden flex items-center justify-center p-4 cursor-zoom-out"
            onClick={onClose}
          >
            <motion.video
              src={msg.video_url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain drop-shadow-2xl select-none outline-none"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springs.image}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default VideoPlayerModal;
