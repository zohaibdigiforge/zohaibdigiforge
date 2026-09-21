import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const outerRingRef = useRef<HTMLDivElement>(null);
  const innerDotRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if the device has a fine pointer (mouse/trackpad, not mobile touch)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) {
      setIsDesktop(false);
      return;
    }
    setIsDesktop(true);

    let animationFrameId: number;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let isClickable = false;
    let isPressed = false;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (innerDotRef.current) {
        innerDotRef.current.style.transform = `translate3d(${targetX - 4}px, ${targetY - 4}px, 0) scale(${isPressed ? 1.4 : isClickable ? 1.3 : 1})`;
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        isClickable = Boolean(
          target.closest('a, button, input, textarea, select, [role="button"], .cursor-pointer, .interactive-hover')
        );
      }
    };

    const handlePointerDown = () => {
      isPressed = true;
      if (innerDotRef.current) {
        innerDotRef.current.style.transform = `translate3d(${targetX - 4}px, ${targetY - 4}px, 0) scale(1.5)`;
      }
    };

    const handlePointerUp = () => {
      isPressed = false;
      if (innerDotRef.current) {
        innerDotRef.current.style.transform = `translate3d(${targetX - 4}px, ${targetY - 4}px, 0) scale(1)`;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });

    // Smooth GPU-accelerated lerp animation via direct DOM transform (0 React re-renders)
    const render = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Only update DOM if moved more than 0.05px
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        currentX += dx * 0.25;
        currentY += dy * 0.25;

        if (outerRingRef.current) {
          const offset = isClickable ? 20 : 14;
          const scale = isClickable ? 1.3 : 1;
          outerRingRef.current.style.transform = `translate3d(${currentX - offset}px, ${currentY - offset}px, 0) scale(${scale})`;
          outerRingRef.current.style.borderColor = isClickable ? '#28B9FF' : 'rgba(40, 185, 255, 0.4)';
          outerRingRef.current.style.backgroundColor = isClickable ? 'rgba(40, 185, 255, 0.12)' : 'rgba(13, 110, 253, 0.03)';
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {/* Outer Glowing Trailing Ring (Direct DOM mutate, no React state) */}
      <div
        ref={outerRingRef}
        className="fixed top-0 left-0 w-7 h-7 rounded-full border border-[#28B9FF]/40 bg-[rgba(13,110,253,0.03)] shadow-[0_0_12px_rgba(40,185,255,0.3)] transition-all duration-150 ease-outwill-change-transform"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />

      {/* Inner Glowing Center Dot */}
      <div
        ref={innerDotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-gradient-to-r from-[#28B9FF] to-[#0D6EFD] shadow-[0_0_10px_#28B9FF] transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />
    </div>
  );
};
