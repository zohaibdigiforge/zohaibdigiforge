import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, MessageCircle, HelpCircle, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { FAQ, FAQCategory } from '../types';
import { getFAQsFromDb } from '../services/firestoreService';

interface FAQPageProps {
  onNavigateContact: () => void;
  siteSettings?: any;
}

const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'How do I receive my digital product or toolkit after purchase?',
    answer: 'Instant access! Once your payment is verified, your product download links, source code repositories, and license keys appear immediately on your Customer Dashboard and are sent securely to your registered email.',
    category: 'Delivery & Access',
    order: 1,
    isActive: true
  },
  {
    id: 'faq-2',
    question: 'Are your discount coupons and promotional deals 100% verified?',
    answer: 'Yes! Every single coupon deal, student discount, and software promo code listed on Zohaib DigiForge is manually tested and verified daily by our team to guarantee validity before publishing.',
    category: 'General',
    order: 2,
    isActive: true
  },
  {
    id: 'faq-3',
    question: 'What payment methods do you accept (PKR & USD)?',
    answer: 'We support multiple secure payment options including EasyPaisa, JazzCash, Direct Bank Transfer (HBL, Meezan Bank, etc.) for PKR currency, as well as International Credit and Debit cards for USD payments.',
    category: 'Orders & Payment',
    order: 3,
    isActive: true
  },
  {
    id: 'faq-4',
    question: 'How can I contact support if I face any issue with my download?',
    answer: 'We pride ourselves on lightning-fast customer support! You can message us directly on WhatsApp at +92 340 6070632 or reach out through our Contact Us page. We typically respond within 1-3 hours.',
    category: 'General',
    order: 4,
    isActive: true
  },
  {
    id: 'faq-5',
    question: 'Can I get a refund if a digital product has an issue?',
    answer: 'Yes, your satisfaction is our top priority. If you encounter unresolvable technical issues or corrupted download files with any purchased toolkit, our support team will assist you or provide a replacement.',
    category: 'Refunds',
    order: 5,
    isActive: true
  },
  {
    id: 'faq-6',
    question: 'Do you provide free resources and developer guides?',
    answer: 'Absolutely! Explore our "Free Resources" category and Journal section where we regularly publish free student guides, development hacks, and source code boilerplates at zero cost.',
    category: 'General',
    order: 6,
    isActive: true
  }
];

export const FAQPage: React.FC<FAQPageProps> = ({ onNavigateContact, siteSettings }) => {
  const [faqs, setFaqs] = useState<FAQ[]>(DEFAULT_FAQS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'All'>('All');
  const [openId, setOpenId] = useState<string | null>('faq-1');

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const data = await getFAQsFromDb();
        if (data && data.length > 0) {
          setFaqs(data as FAQ[]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadFaqs();
  }, []);

  // Filter only active FAQs
  const activeFaqs = useMemo(() => faqs.filter(f => f.isActive), [faqs]);

  // Determine available categories dynamically
  const categories: (FAQCategory | 'All')[] = [
    'All',
    'Delivery & Access',
    'Orders & Payment',
    'Pricing',
    'Account',
    'Refunds',
    'General'
  ];

  // Search and category filter
  const filteredFaqs = useMemo(() => {
    return activeFaqs.filter(faq => {
      const matchCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        faq.question.toLowerCase().includes(q) || 
        faq.answer.toLowerCase().includes(q);
      
      return matchCategory && matchSearch;
    });
  }, [activeFaqs, selectedCategory, searchQuery]);

  // SEO JSON-LD Schema
  useEffect(() => {
    if (activeFaqs.length === 0) return;
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": activeFaqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-structured-data';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('faq-structured-data');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [activeFaqs]);

  const whatsAppNumber = siteSettings?.whatsappNumber || '923406070632';

  return (
    <div className="min-w-full min-h-screen bg-[#0A0F1D] text-slate-100 font-sans pb-24 selection:bg-[#0D6EFD] selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#0A0F1D] overflow-hidden border-b border-slate-800/80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#0D6EFD]/25 via-[#28B9FF]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-12 w-80 h-80 bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D6EFD]/15 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-bold tracking-widest uppercase shadow-md">
            <Sparkles className="w-4 h-4 text-[#28B9FF]" />
            <span>Zohaib DigiForge Help Center</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Frequently Asked <span className="bg-gradient-to-r from-[#28B9FF] via-[#0D6EFD] to-[#22C55E] bg-clip-text text-transparent">Questions</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Got questions about our verified coupon deals, instant toolkit downloads, or payment methods? Find fast, honest answers below.
          </p>

          {/* Search Bar */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="relative group shadow-2xl rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-[#28B9FF] transition-all">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any question (e.g., instant delivery, WhatsApp, refund)..."
                className="w-full pl-12 pr-12 py-4 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#22C55E]" /> Instant Access After Payment</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#28B9FF]" /> 24/7 WhatsApp Support</span>
          </div>
        </div>
      </section>

      {/* CATEGORY TABS */}
      <section className="sticky top-[60px] sm:top-[72px] z-30 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-slate-800/80 py-4 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 justify-start sm:justify-center">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setOpenId(null);
                  }}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUESTION LIST */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 space-y-12">
        
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-20 px-6 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No answers found</h3>
            <p className="text-sm text-slate-400">
              We couldn't find any FAQs matching your search criteria. Feel free to ask us directly on WhatsApp!
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-6 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className={`border rounded-2xl transition-all duration-300 overflow-hidden shadow-lg ${
                    isOpen ? 'bg-slate-900/90 border-[#28B9FF]/50 shadow-[#28B9FF]/5' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-white text-base sm:text-lg pr-4 leading-snug">{faq.question}</span>
                    <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 ${isOpen ? 'bg-[#0D6EFD]/20 text-[#28B9FF] rotate-180 border border-[#0D6EFD]/40' : 'bg-slate-800 text-slate-400'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  <div 
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="text-slate-300 text-sm sm:text-base leading-relaxed border-t border-slate-800/80 pt-4 font-normal">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM IMPRESSIVE CTA */}
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-[#0D6EFD]/15 to-slate-900 border border-[#0D6EFD]/30 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D6EFD]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 flex items-center justify-center text-[#28B9FF] mx-auto shadow-md">
              <MessageCircle className="w-6 h-6" />
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Still have questions? We're here to help!</h3>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Whether you need help with an order, custom toolkit recommendation, or coupon activation, our team is ready on WhatsApp.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://wa.me/${whatsAppNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#22C55E] hover:bg-[#1faa52] text-slate-950 font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp Now</span>
              </a>
              
              <button
                onClick={onNavigateContact}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Visit Contact Page</span>
                <ArrowRight className="w-4 h-4 text-[#28B9FF]" />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
