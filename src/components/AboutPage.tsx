import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Users, 
  Target, 
  GraduationCap, 
  Compass,
  Rocket,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Terminal,
  Bot,
  Linkedin,
  Globe,
  ExternalLink
} from 'lucide-react';
import { CommunityCallout } from './CommunityCallout';
import { BRAND_FOUNDER } from '../lib/brandAssets';

interface AboutPageProps {
  onNavigateHome: () => void;
  onNavigateResources: (catSlug?: string) => void;
  onNavigateMembership?: () => void;
  onNavigateJoinUs?: () => void;
  onNavigateContact?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigateHome,
  onNavigateResources,
  onNavigateMembership,
  onNavigateJoinUs,
  onNavigateContact
}) => {
  const storySteps = [
    {
      period: '2024',
      title: 'The Problem',
      icon: GraduationCap,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/30',
      description: "While studying and learning new digital skills in 2024, I struggled to find quality courses and resources at prices a middle-class student could afford."
    },
    {
      period: 'The Turning Point',
      title: 'Finding the Way',
      icon: Compass,
      color: 'text-[#28B9FF]',
      bg: 'bg-[#28B9FF]/10',
      border: 'border-[#28B9FF]/30',
      description: "Instead of giving up, I started researching, investing in myself, learning from mentors, and working with experienced digital creators."
    },
    {
      period: '2026',
      title: 'Zohaib DigiForge Built',
      icon: Rocket,
      color: 'text-[#0D6EFD]',
      bg: 'bg-[#0D6EFD]/10',
      border: 'border-[#0D6EFD]/30',
      description: "After overcoming these challenges, Zohaib DigiForge was officially built in 2026 to ensure no student or creator faces these hurdles alone."
    },
    {
      period: 'Today',
      title: 'The Mission',
      icon: Target,
      color: 'text-[#22C55E]',
      bg: 'bg-[#22C55E]/10',
      border: 'border-[#22C55E]/30',
      description: "Today, Zohaib DigiForge aims to provide quality digital resources and tools at affordable prices for students, professionals, and creators."
    },
    {
      period: 'The Future',
      title: 'What\'s Next',
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      description: "Our vision goes beyond a digital store. InshaAllah, we aim to grow Zohaib DigiForge into a full-scale digital agency, offering complete digital solutions."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white pb-24 font-sans selection:bg-[#0D6EFD] selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#0D6EFD]/25 via-[#28B9FF]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-80 h-80 bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8"
          >
            Started with a problem. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#28B9FF] via-[#0D6EFD] to-[#22C55E] bg-clip-text text-transparent">
              Built with a purpose. Growing with a vision.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            The story behind Zohaib DigiForge and our relentless commitment to empowering creators.
          </motion.p>
        </div>
      </section>

      {/* 2. FOUNDER INTRO & EDITORIAL */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* Founder Portrait */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5 relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-slate-900 border-2 border-[#28B9FF]/30 relative z-10 group shadow-2xl shadow-[#0D6EFD]/20">
                <img
                  src={BRAND_FOUNDER}
                  alt="Muhammad Zohaib Shahzad - Founder"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/founder.webp') {
                      target.src = '/founder.webp';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1D] via-[#0A0F1D]/40 to-transparent opacity-90" />
                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <div className="text-2xl font-bold text-white tracking-tight">Muhammad Zohaib Shahzad</div>
                  <div className="text-xs font-semibold text-[#28B9FF] tracking-wider uppercase flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Founder &amp; Tech Lead</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#0D6EFD]/30 border border-[#28B9FF]/30 text-[11px] font-medium text-sky-200">
                      <ShieldCheck className="w-3 h-3 text-[#28B9FF]" />
                      Cybersecurity
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#22C55E]/20 border border-[#22C55E]/30 text-[11px] font-medium text-emerald-200">
                      <Bot className="w-3 h-3 text-[#22C55E]" />
                      AI &amp; Automation
                    </span>
                  </div>
                  {/* Founder Connect Links */}
                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href="https://www.linkedin.com/in/mzohaibshahzad-sec"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2]/20 hover:bg-[#0A66C2]/40 border border-[#0A66C2]/50 text-white text-xs font-semibold transition-all hover:scale-105 shadow-md shadow-[#0A66C2]/20"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] fill-current" />
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                    <a
                      href="http://muhammadzohaibshahzad.site/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#28B9FF]/20 hover:bg-[#28B9FF]/30 border border-[#28B9FF]/50 text-white text-xs font-semibold transition-all hover:scale-105 shadow-md shadow-[#28B9FF]/20"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#28B9FF]" />
                      <span>Portfolio</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-[#0D6EFD]/20 to-[#22C55E]/20 rounded-[2.5rem] blur-xl -z-10 hidden sm:block opacity-70" />
            </motion.div>

            {/* Narrative Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold uppercase tracking-wider">
                <span>Founder's Journey &amp; Mission</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                "Driven by Cybersecurity, AI Automation, and Affordable Tech for Everyone."
              </h2>
              
              <div className="space-y-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
                <p>
                  Hi, I'm <strong className="text-white">Muhammad Zohaib Shahzad</strong>. Currently diving deep into <strong className="text-[#28B9FF]">Cybersecurity</strong> and engineering intelligent <strong className="text-[#22C55E]">AI Automation systems</strong>, I've always believed that technical knowledge and modern tools should be accessible to anyone eager to learn.
                </p>
                <p>
                  While studying and building my tech foundation, I noticed how hard it was for students and freelancers to afford premium courses, verified development toolkits, and software licenses due to steep international pricing.
                </p>
                <p>
                  I created <strong className="text-white">Zohaib DigiForge</strong> to bridge that gap — combining secure digital architecture with curated, budget-friendly tech resources (flat Rs. 279 / $1) so the next generation of Pakistani developers and creators can level up without limits.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-sky-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cybersecurity</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">Secure Architecture</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Cpu className="w-4 h-4" />
                    <span>AI Automation</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">Workflow Automation</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Flat Rs. 279</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">Fair Price Access</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-400">
                    <Terminal className="w-4 h-4" />
                    <span>Direct Support</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">WhatsApp Help</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. THE 5-STAGE MILESTONE TIMELINE (VERTICAL ALTERNATING WITH ANIMATED LINE) */}
      <section className="py-24 bg-slate-950/80 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0D6EFD]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-xs font-bold tracking-widest uppercase text-[#28B9FF] bg-[#0D6EFD]/15 px-3.5 py-1 rounded-full border border-[#28B9FF]/30 mb-3 inline-block">
              Our Journey
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Our Evolution &amp; Milestone Timeline
            </h2>
            <p className="text-slate-400 text-base">From hitting walls to engineering solutions for creators.</p>
          </div>

          <div className="relative">
            {/* Center Animated Vertical Line */}
            <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-gradient-to-b from-[#28B9FF] via-[#0D6EFD] to-[#22C55E] rounded-full shadow-lg shadow-[#0D6EFD]/50 hidden md:block" />
            <div className="absolute left-4 top-4 bottom-4 w-1 -translate-x-1/2 bg-gradient-to-b from-[#28B9FF] via-[#0D6EFD] to-[#22C55E] rounded-full md:hidden" />

            <div className="space-y-12 md:space-y-20 relative">
              {storySteps.map((item, idx) => {
                const Icon = item.icon;
                const isEven = idx % 2 === 0;

                return (
                  <div key={item.title} className="relative flex flex-col md:flex-row items-center">
                    
                    {/* Left Card (for even indices on desktop) */}
                    <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? 'md:pr-16 md:text-right' : 'md:order-last md:pl-16 md:text-left'} group`}>
                      <motion.div 
                        initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="bg-slate-900/90 border border-slate-800 hover:border-[#28B9FF]/60 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl group-hover:shadow-[#0D6EFD]/20 group-hover:-translate-y-1"
                      >
                        {/* Subtle Glow */}
                        <div className={`absolute top-0 ${isEven ? 'right-0' : 'left-0'} w-32 h-32 bg-[#28B9FF]/10 rounded-full blur-2xl pointer-events-none`} />

                        <div className={`flex items-center gap-3 mb-3 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                          <span className="text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full bg-slate-950 border border-white/10 text-[#28B9FF]">
                            {item.period}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-[#28B9FF] transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                          {item.description}
                        </p>
                      </motion.div>
                    </div>

                    {/* Center Icon Node */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-slate-950 border-2 border-[#28B9FF] shadow-xl shadow-[#0D6EFD]/50 flex items-center justify-center z-20 group-hover:scale-110 transition-transform">
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>

                    {/* Empty Right space for alignment */}
                    <div className={`hidden md:block md:w-1/2 ${isEven ? 'md:order-last' : ''}`} />

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. MISSION & FUTURE VISION BENTO */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-slate-900/90 rounded-3xl p-8 sm:p-10 border border-[#22C55E]/30 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#22C55E]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center mb-6 text-[#22C55E]">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Today — The Mission</h3>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
                Today, Zohaib DigiForge aims to provide <strong className="text-white">quality digital resources and tools at affordable prices</strong> for students, professionals, and creators.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-slate-900/90 rounded-3xl p-8 sm:p-10 border border-[#0D6EFD]/30 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#0D6EFD]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 flex items-center justify-center mb-6 text-[#28B9FF]">
                <Rocket className="w-7 h-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">The Future</h3>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
                Our vision goes beyond a digital store. InshaAllah, we aim to grow <strong className="text-white">Zohaib DigiForge into a full-scale digital agency</strong>, offering complete digital solutions.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Community & Resources Callout */}
      <CommunityCallout
        onNavigateResources={onNavigateResources}
        onNavigateJoinUs={onNavigateJoinUs}
        title="Started with a problem. Built with a purpose."
        subtitle="Empowering Creators & Developers"
        description="Explore our complete library of high-impact digital tools or join our thriving creator circle for direct support, networking, and exclusive drops."
      />

    </div>
  );
};
