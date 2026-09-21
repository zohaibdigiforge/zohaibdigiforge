import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  MessageCircle, 
  Users, 
  Target, 
  Eye, 
  HeartHandshake, 
  GraduationCap, 
  Code2
} from 'lucide-react';

interface AboutPageProps {
  onNavigateHome: () => void;
  onNavigateResources: (catSlug?: string) => void;
  onNavigateMembership?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigateHome,
  onNavigateResources,
  onNavigateMembership
}) => {
  const timelineSteps = [
    {
      step: '01',
      period: '2023',
      title: 'The Struggle',
      description: "While studying, I hit a wall. Free content wasn't enough, and paid courses cost more than a middle-class student could afford. Quality knowledge shouldn't be locked behind an impossible paywall."
    },
    {
      step: '02',
      period: 'Late 2023',
      title: 'The Breakthrough',
      description: "I invested in myself, found a mentor, and learned directly from top creators. That struggle taught me that if this was hard for me, it was hard for thousands of others across Pakistan."
    },
    {
      step: '03',
      period: '2024',
      title: 'Building DigiForge',
      description: "Starting in programming, expanding to design and development—I built DigiForge to give students and professionals the premium toolkits I once couldn't find, at a price that actually makes sense."
    },
    {
      step: '04',
      period: 'The Horizon',
      title: 'What\'s Next',
      description: "DigiForge is evolving into a full digital agency. We are moving beyond just providing resources to executing complete digital solutions and transforming careers."
    }
  ];

  const differentiators = [
    {
      title: 'Built for Accessibility',
      desc: 'Pricing engineered for middle-class students. No inflated foreign fees, no hidden subscription traps.',
      icon: GraduationCap,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20'
    },
    {
      title: 'Strictly Curated',
      desc: 'Every single resource is vetted, tested, and verified for relevance before it ever enters our store.',
      icon: ShieldCheck,
      color: 'text-[#28B9FF]',
      bg: 'bg-[#28B9FF]/10',
      border: 'border-[#28B9FF]/20'
    },
    {
      title: 'Human Support',
      desc: 'Direct WhatsApp access with Zohaib and the team. No automated bots, no infinite ticketing queues.',
      icon: MessageCircle,
      color: 'text-[#22C55E]',
      bg: 'bg-[#22C55E]/10',
      border: 'border-[#22C55E]/20'
    },
    {
      title: 'Instant Delivery',
      desc: 'Zero waiting. You get instant Google Drive cloud link access right after payment verification.',
      icon: Zap,
      color: 'text-[#0D6EFD]',
      bg: 'bg-[#0D6EFD]/10',
      border: 'border-[#0D6EFD]/20'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white pb-24 font-sans selection:bg-[#0D6EFD] selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden border-b border-white/5">
        {/* Vibrant Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#0D6EFD]/25 via-[#28B9FF]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-80 h-80 bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D6EFD]/15 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-bold tracking-widest uppercase mb-8 shadow-md"
          >
            <Sparkles className="w-4 h-4 text-[#28B9FF]" />
            <span>The Story of DigiForge</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8"
          >
            We Built What We <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#28B9FF] via-[#0D6EFD] to-[#22C55E] bg-clip-text text-transparent">
              Wished We Had.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            DigiForge wasn't planned in a boardroom. It was forged from real struggles, late nights, and a promise to make premium digital knowledge accessible to everyone.
          </motion.p>
        </div>
      </section>

      {/* 2. THE FOUNDER'S LETTER */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
            
            {/* Left: Founder Image Portrait */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5 relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-slate-900 border-2 border-[#28B9FF]/30 relative z-10 group shadow-2xl shadow-[#0D6EFD]/20">
                <img
                  src="/Founder.png"
                  alt="Zohaib - Founder"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1D] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="text-2xl font-bold text-white mb-1">Zohaib</div>
                  <div className="text-sm font-semibold text-[#28B9FF] tracking-wide uppercase">Founder & Lead Curator</div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-[#0D6EFD]/20 to-[#22C55E]/20 rounded-[2.5rem] blur-xl -z-10 hidden sm:block opacity-70" />
            </motion.div>

            {/* Right: The Letter */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold uppercase tracking-wider">
                <span>Personal Note</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Hi, I'm Zohaib.
              </h2>
              
              <div className="space-y-6 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
                <p>
                  I remember spending nights searching for working templates, actionable code, and design assets that didn't cost a fortune. When you are a student or a budding creator in Pakistan, a $200 course or a $50 template isn't just expensive—it's often impossible.
                </p>
                <p>
                  I hit a wall where free YouTube tutorials were no longer enough, and premium content was locked behind massive paywalls. I had to invest heavily, find a mentor, and learn the hard way.
                </p>
                <p className="p-4 rounded-2xl bg-slate-900 border-l-4 border-[#28B9FF] text-white font-medium shadow-inner">
                  "DigiForge is my answer to that struggle. No inflated fees. No gatekeeping."
                </p>
                <p>
                  I started curating, building, and verifying resources so that the next generation of developers, designers, and marketers wouldn't have to start from zero. Every template, toolkit, and guide on this platform is something I personally use or have vetted.
                </p>
              </div>

              <div className="pt-8 border-t border-white/10 flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/30 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-[#28B9FF]" />
                  </div>
                  <div className="text-sm">
                    <div className="text-white font-bold">Full-Stack</div>
                    <div className="text-slate-400">Background</div>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <div className="text-sm">
                    <div className="text-white font-bold">1000+</div>
                    <div className="text-slate-400">Creators Helped</div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS (Bento Box Approach with Colors) */}
      <section className="py-24 bg-slate-950/70 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#0D6EFD]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              What Drives Us
            </h2>
            <p className="text-slate-400">Our core values that guide every resource we release.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Mission */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-slate-900/90 rounded-3xl p-8 border border-[#0D6EFD]/30 hover:border-[#0D6EFD]/60 relative overflow-hidden group shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#0D6EFD]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 flex items-center justify-center mb-6 text-[#28B9FF] group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
              <p className="text-slate-300 leading-relaxed font-normal text-sm sm:text-base">
                To empower students, professionals, and creators by providing high-quality, verified digital resources and tools that accelerate their growth without breaking the bank.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-slate-900/90 rounded-3xl p-8 border border-[#28B9FF]/30 hover:border-[#28B9FF]/60 relative overflow-hidden group shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#28B9FF]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-[#28B9FF]/20 border border-[#28B9FF]/40 flex items-center justify-center mb-6 text-[#28B9FF] group-hover:scale-110 transition-transform">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
              <p className="text-slate-300 leading-relaxed font-normal text-sm sm:text-base">
                To become the most trusted digital resource ecosystem in Pakistan and beyond, eventually evolving into a full-scale digital agency that transforms careers.
              </p>
            </motion.div>

            {/* Promise */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-slate-900/90 rounded-3xl p-8 border border-[#22C55E]/30 hover:border-[#22C55E]/60 relative overflow-hidden group shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#22C55E]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center mb-6 text-[#22C55E] group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Promise</h3>
              <p className="text-slate-300 leading-relaxed font-normal text-sm sm:text-base">
                No fluff. No broken links. Every toolkit, template, and guide is meticulously selected, tested, and guaranteed to deliver immediate value to your workflow.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. THE JOURNEY (Clean Vertical Timeline with Accent Dots) */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-bold uppercase tracking-wider mb-3">
              <span>Milestones</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              The Evolution
            </h2>
            <p className="text-slate-400">How we got here, and where we are heading.</p>
          </div>

          <div className="space-y-12 relative">
            {/* Vertical Line Gradient */}
            <div className="absolute left-4 md:left-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#0D6EFD] via-[#28B9FF] to-[#22C55E] -translate-x-1/2 hidden md:block" />
            
            {timelineSteps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <motion.div 
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6 }}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-0 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className={`md:w-5/12 ${isEven ? 'md:text-right' : 'md:text-left'} pl-12 md:pl-0 relative`}>
                    {/* Mobile Line & Dot */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0D6EFD] to-[#28B9FF] md:hidden" />
                    <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-[#28B9FF] shadow-[0_0_12px_#28B9FF] md:hidden" />
                    
                    <div className="text-xs font-extrabold text-[#28B9FF] tracking-widest uppercase mb-2">
                      {step.period}
                    </div>
                    <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">
                      {step.title}
                    </h4>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal bg-slate-900/60 p-4 rounded-2xl border border-white/5 shadow-md">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Center Dot (Desktop) */}
                  <div className="hidden md:flex w-2/12 justify-center relative z-10">
                    <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-[#28B9FF] shadow-[0_0_20px_rgba(40,185,255,0.6)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#0D6EFD]" />
                    </div>
                  </div>
                  
                  {/* Empty space for balance */}
                  <div className="hidden md:block md:w-5/12" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. WHY WE STAND APART */}
      <section className="py-24 bg-slate-900/40 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Why Creators Choose Us
            </h2>
            <p className="text-slate-400">Guaranteed standards on every single resource.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {differentiators.map((diff, idx) => {
              const Icon = diff.icon;
              return (
                <motion.div 
                  key={diff.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-[#28B9FF]/50 p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl group"
                >
                  <div>
                    <div className={`w-14 h-14 rounded-2xl ${diff.bg} border ${diff.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${diff.color}`} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-3 group-hover:text-[#28B9FF] transition-colors">{diff.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                      {diff.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full bg-[#22C55E]`} />
                    <span>Guaranteed standard</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. VIBRANT CTA */}
      <section className="py-24 relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-[#0A0F1D] to-slate-950">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0D6EFD]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#0D6EFD]/20 to-slate-900 border-2 border-[#0D6EFD]/40 p-10 sm:p-14 shadow-2xl relative overflow-hidden"
          >
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
              Ready to Upgrade Your Workflow?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-10 font-normal max-w-2xl mx-auto leading-relaxed">
              Stop overpaying for digital tools. Get exactly what you need to learn, build, and scale today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => onNavigateResources('all')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#1aa8ea] text-white font-bold text-sm shadow-xl shadow-[#0D6EFD]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Resources</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/923406070632?text=Hi%20Zohaib!%20I%20want%20to%20join%20the%20DigiForge%20Creator%20Community."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/15 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#22C55E]" />
                <span>Contact Zohaib</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};
