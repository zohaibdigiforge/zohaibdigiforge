import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Lock, X } from 'lucide-react';

interface ContentProtectionProps {
  appName?: string;
}

export const ContentProtection: React.FC<ContentProtectionProps> = ({
  appName = 'Zohaib DigiForge'
}) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [warningType, setWarningType] = useState<'copy' | 'image' | 'shortcut' | 'general'>('general');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showWarning = useCallback((message: string, type: 'copy' | 'image' | 'shortcut' | 'general' = 'general') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setWarningMessage(message);
    setWarningType(type);

    timeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 2800);
  }, []);

  const dismissWarning = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setWarningMessage(null);
  }, []);

  useEffect(() => {
    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true;
      if (target.isContentEditable) return true;
      if (target.closest('input, textarea, [contenteditable="true"]')) return true;
      return false;
    };

    // 1. Block Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;

      // Allow right click ONLY inside input fields where pasting might be needed
      if (isInputElement(target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (target && (target.tagName === 'IMG' || target.closest('img, picture, svg, canvas'))) {
        showWarning('Image saving and right-clicking are disabled to protect copyright.', 'image');
      } else {
        showWarning('Right-click context menu is disabled on this website.', 'general');
      }
    };

    // 2. Block Copy and Cut events outside inputs
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (isInputElement(target)) {
        return; // Allow users to copy their own typed inputs
      }

      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.clearData();
      }
      showWarning('Text copying is protected and disabled on Zohaib DigiForge.', 'copy');
    };

    const handleCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (isInputElement(target)) {
        return;
      }
      e.preventDefault();
      showWarning('Cutting content is disabled.', 'copy');
    };

    // 3. Block Image & Element Dragging (prevents dragging images to desktop or new tabs)
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.closest('img, picture, svg, canvas, .protected-media'))) {
        e.preventDefault();
        showWarning('Dragging images to save is disabled.', 'image');
      }
    };

    // 4. Block Keyboard Shortcuts (Ctrl+C, Ctrl+X, Ctrl+U, Ctrl+S, Ctrl+P, F12, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput = isInputElement(target);
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Developer Tools / Inspect Element: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (isCtrlOrCmd && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Developer tools inspection is disabled.', 'shortcut');
        return;
      }

      // View Source: Ctrl+U
      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Viewing page source is disabled.', 'shortcut');
        return;
      }

      // Save Page: Ctrl+S
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Saving offline webpage copies is disabled.', 'shortcut');
        return;
      }

      // Print Page: Ctrl+P
      if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Printing page content is disabled.', 'shortcut');
        return;
      }

      // Copy / Cut outside inputs: Ctrl+C, Ctrl+X
      if (!inInput && isCtrlOrCmd && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Copying text is protected and disabled.', 'copy');
        return;
      }

      // Select all outside inputs: Ctrl+A
      if (!inInput && isCtrlOrCmd && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Selecting page text is disabled.', 'shortcut');
        return;
      }
    };

    // 5. Block Selection Start on non-input elements
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!isInputElement(target) && !target?.classList.contains('allow-select')) {
        // Selection is blocked via CSS, but this provides second layer of defense
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          selection.removeAllRanges();
        }
      }
    };

    // 6. Mobile Touch-Callout on Images (disable save image menu on hold)
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.closest('img, picture, svg'))) {
        target.style.setProperty('-webkit-touch-callout', 'none');
        target.style.setProperty('-webkit-user-select', 'none');
        target.style.setProperty('user-select', 'none');
      }
    };

    // Register all document listeners with capture phase for maximum reliability
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCut, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCut, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('touchstart', handleTouchStart, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showWarning]);

  return (
    <AnimatePresence>
      {warningMessage && (
        <motion.aside
          aria-label="Content Protection Alert"
          role="alert"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[999999] max-w-md w-[92%] sm:w-auto pointer-events-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-white shadow-2xl backdrop-blur-xl shadow-cyan-950/40">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
              {warningType === 'image' ? (
                <Lock className="w-5 h-5 animate-pulse" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {appName} Privacy Shield
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                {warningMessage}
              </p>
            </div>

            <button
              onClick={dismissWarning}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
