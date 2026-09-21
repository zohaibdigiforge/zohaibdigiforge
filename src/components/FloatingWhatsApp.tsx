import React from 'react';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const whatsappUrl = `https://wa.me/923406070632?text=${encodeURIComponent(
    "Hi Zohaib DigiForge! I need help with digital resources / order support."
  )}`;

  return (
    <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 select-none">
      {/* Floating Action Circle Button */}
      <a
        id="floating-whatsapp-btn"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with Zohaib DigiForge Support Team"
        className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#22C55E] hover:bg-[#1fbd58] active:scale-90 text-slate-950 shadow-[0_6px_22px_rgba(34,197,94,0.5)] hover:shadow-[0_8px_28px_rgba(34,197,94,0.65)] hover:scale-105 sm:hover:scale-110 transition-all duration-200 cursor-pointer ring-2 sm:ring-4 ring-[#22C55E]/25"
        title="Chat on WhatsApp (03406070632)"
      >
        {/* Pulse Online Indicator Badge */}
        <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-400 border-2 border-slate-950" />
        </span>

        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950 text-[#22C55E] shrink-0" />
      </a>
    </div>
  );
};

