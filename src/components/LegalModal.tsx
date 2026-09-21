import React from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Lock, ExternalLink, ArrowRight } from 'lucide-react';
import { LegalDocId } from '../types';
import { DEFAULT_LEGAL_DATA } from '../data/legalData';

interface LegalModalProps {
  docType: 'Privacy Policy' | 'Terms & Conditions' | 'Refund Policy' | null;
  onClose: () => void;
  onOpenFullPage?: (docId: LegalDocId) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ docType, onClose, onOpenFullPage }) => {
  if (!docType) return null;

  const docId: LegalDocId = 
    docType === 'Privacy Policy' ? 'privacy' :
    docType === 'Terms & Conditions' ? 'terms' : 'refund';

  const fullData = DEFAULT_LEGAL_DATA[docId];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-white">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#0D6EFD]/20 text-[#28B9FF] border border-[#0D6EFD]/30">
              DigiForge Legal Protection
            </span>
            <span className="text-[11px] text-slate-400">
              Last updated: {fullData?.lastUpdated || 'August 2026'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">{docType}</h2>
          <p className="text-xs text-slate-300 mt-1">{fullData?.intro}</p>
        </div>

        {/* Body content with sections */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
          {fullData?.sections.map((section) => (
            <div key={section.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#28B9FF]" />
                <span>{section.title}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {section.content}
              </p>
              {section.bullets && (
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1 pt-1">
                  {section.bullets.slice(0, 3).map((b, i) => (
                    <li key={i} className="leading-normal">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          {onOpenFullPage ? (
            <button
              onClick={() => {
                onClose();
                onOpenFullPage(docId);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#28B9FF] hover:underline"
            >
              <span>Read Full Dedicated Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-[11px] text-slate-400">
              For specific legal advice, consult a qualified professional.
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-blue-600 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            I Understand &amp; Close
          </button>
        </div>

      </div>
    </div>
  );
};
