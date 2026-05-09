import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { springs } from './springs';

// ── AnimatedModal ──
// Wraps a modal overlay + content panel with spring enter/exit.
// Uses AnimatePresence internally for mount/unmount animations.

interface AnimatedModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  contentClassName?: string;
  spring?: keyof typeof springs;
}

export function AnimatedModal({
  children,
  isOpen,
  onClose,
  className = '',
  contentClassName = '',
  spring = 'modal',
}: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springs.backdrop}
          onClick={onClose}
        >
          <motion.div
            className={contentClassName}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={springs[spring]}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── AnimatedSidebar ──
// Slide-in from right with spring. For details panels, drawers, etc.

interface AnimatedSidebarProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function AnimatedSidebar({ children, isOpen, className = '' }: AnimatedSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={className}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={springs.sidebar}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── AnimatedFade ──
// Generic fade-in/out wrapper for elements that mount/unmount.

interface AnimatedFadeProps {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
  spring?: keyof typeof springs;
}

export function AnimatedFade({ children, isVisible, className = '', spring = 'fade' }: AnimatedFadeProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springs[spring]}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── AnimatedSlideUp ──
// Slide from bottom + fade. Good for bars, toasts, reply composers.

interface AnimatedSlideUpProps {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
  spring?: keyof typeof springs;
}

export function AnimatedSlideUp({
  children,
  isVisible,
  className = '',
  spring = 'composer',
}: AnimatedSlideUpProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={springs[spring]}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── AnimatedZoom ──
// Scale + fade. Good for image viewers, dropdowns, menus.

interface AnimatedZoomProps {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
  spring?: keyof typeof springs;
}

export function AnimatedZoom({ children, isVisible, className = '', spring = 'menu' }: AnimatedZoomProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={springs[spring]}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── AnimatedImageViewer ──
// Full-screen image overlay with zoom + fade spring.

interface AnimatedImageViewerProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
}

export function AnimatedImageViewer({ children, isOpen, onClose }: AnimatedImageViewerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springs.backdrop}
          onClick={onClose}
        >
          <motion.div
            className="flex-1 overflow-hidden flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springs.image}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
