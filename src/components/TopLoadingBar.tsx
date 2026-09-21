import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TopLoadingBarProps {
  isNavigating: boolean;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ isNavigating }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    if (isNavigating) {
      setVisible(true);
      setProgress(25);

      timer1 = setTimeout(() => {
        setProgress(65);
      }, 150);

      timer2 = setTimeout(() => {
        setProgress(90);
      }, 350);
    } else {
      setProgress(100);
      timer3 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none h-[3px] bg-transparent">
      <motion.div
        className="h-full bg-gradient-to-r from-[#0D6EFD] via-[#28B9FF] to-[#22C55E] shadow-[0_0_10px_rgba(40,185,255,0.8)]"
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: 'easeOut', duration: 0.2 }}
      />
    </div>
  );
};
