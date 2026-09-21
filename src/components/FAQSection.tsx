import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, MessageCircle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { FAQ, FAQCategory } from '../types';
import { getFAQsFromDb } from '../services/firestoreService';
import { DEFAULT_GLOBAL_FAQS } from '../data/faqData';

export { DEFAULT_GLOBAL_FAQS };

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  category?: FAQCategory | 'All';
  limit?: number;
  className?: string;
  onNavigateFAQ?: () => void;
  onNavigateContact?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  title = "Frequently Asked Questions",
  subtitle = "Instant Support & FAQs",
  description = "Find quick answers to common questions regarding downloads, payments, licenses, and verified toolkits.",
  category = 'All',
  limit = 6,
  className = "",
  onNavigateFAQ,
  onNavigateContact
}) => {
  const [faqs, setFaqs] = useState<FAQ[]>(DEFAULT_GLOBAL_FAQS);
  const [openId, setOpenId] = useState<string | null>('faq-1');

  useEffect(() => {
    let isMounted = true;
    const fetchFaqs = async () => {
      try {
        const data = await getFAQsFromDb();
        if (isMounted) {
          if (data && data.length > 0) {
            setFaqs(data as FAQ[]);
            setOpenId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching FAQs from Firebase:', err);
      }
    };
    fetchFaqs();
    return () => { isMounted = false; };
  }, []);

  const activeFaqs = faqs.filter(f => f.isActive !== false);
  const filteredCategoryFaqs = activeFaqs.filter(f => category === 'All' || f.category === category);
  const categoryFaqs = filteredCategoryFaqs.length > 0 ? filteredCategoryFaqs : activeFaqs;
  const displayedFaqs = categoryFaqs.slice(0, limit);

  const toggleFaq = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section className={`py-12 sm:py-16 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D6EFD]/10 border border-[#0D6EFD]/25 text-[#28B9FF] text-[11px] font-bold tracking-wider uppercase mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>{subtitle}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h2>

          {description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </motion.div>

        {/* Accordion List */}
        <div className="space-y-3">
          {displayedFaqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-slate-900/90 border-[#28B9FF]/40 shadow-lg shadow-black/20'
                    : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-white leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#28B9FF]' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3.5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Navigation Bar for FAQs */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            <span>Still have questions or need personal assistance?</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/923406070632?text=Hi%20Zohaib!%20I%20have%20a%20question%20about%20your%20digital%20products."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-[#22C55E] text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>WhatsApp Support</span>
            </a>

            {onNavigateContact && (
              <button
                type="button"
                onClick={onNavigateContact}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0D6EFD]/10 hover:bg-[#0D6EFD]/20 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Contact Page</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
