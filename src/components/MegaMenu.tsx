import React from 'react';
import { 
  GraduationCap, 
  Palette, 
  Layout, 
  Cpu, 
  BookOpen, 
  Wrench, 
  ChevronRight, 
  ArrowRight, 
  FolderOpen,
  Sparkles,
  Zap
} from 'lucide-react';
import { Category, Subcategory } from '../types';

interface MegaMenuProps {
  categories: Category[];
  subcategories: Subcategory[];
  onSelectCategory: (catSlug: string) => void;
  onSelectSubcategory: (catSlug: string, subSlug: string) => void;
  onClose?: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  categories,
  onSelectCategory,
  onClose
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap': return <GraduationCap className="w-4 h-4 text-blue-400" />;
      case 'Palette': return <Palette className="w-4 h-4 text-purple-400" />;
      case 'Layout': return <Layout className="w-4 h-4 text-emerald-400" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-sky-400" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'Wrench': return <Wrench className="w-4 h-4 text-teal-400" />;
      default: return <FolderOpen className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCategorySubtitle = (slug: string, itemCount?: number) => {
    switch (slug) {
      case 'courses': return 'Web, AI Prompting & Coding';
      case 'graphics-assets': return '3D Icons, UI Kits & Graphics';
      case 'templates': return 'Notion, Framer & Pitch Decks';
      case 'softwares': return 'Pro Utilities & Workflows';
      case 'e-books': return 'Playbooks & Monetization';
      case 'pro-tools': return 'Instant Private Subscriptions';
      default: return `${itemCount || 5}+ Assets Available`;
    }
  };

  return (
    <div 
      id="desktop-resources-dropdown"
      className="absolute top-full left-0 mt-2 w-72 sm:w-80 z-50 rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-black/80 p-2 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* 1. All Resources Item */}
      <button
        onClick={() => {
          onSelectCategory('all');
          if (onClose) onClose();
        }}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-600/15 via-[#0D6EFD]/10 to-transparent hover:from-blue-600/25 hover:to-[#0D6EFD]/20 border border-blue-500/30 text-left group transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D6EFD] to-[#28B9FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <FolderOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white group-hover:text-[#28B9FF] transition-colors">
                All Resources & Tools
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#0D6EFD]/20 text-[#28B9FF] border border-[#0D6EFD]/30 font-bold">
                30+
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
              Browse complete library catalog
            </p>
          </div>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-[#28B9FF] group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      {/* Divider */}
      <div className="my-1.5 border-t border-slate-800/90" />

      {/* 2. Clean List of Categories */}
      <div className="space-y-0.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              onSelectCategory(cat.slug);
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-slate-800/80 group transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-[#28B9FF] group-hover:border-[#0D6EFD]/40 group-hover:bg-slate-800 transition-all shrink-0">
                {getCategoryIcon(cat.icon)}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {cat.name}
                </p>
                <p className="text-[10px] text-slate-400 font-normal">
                  {getCategorySubtitle(cat.slug, cat.itemCount)}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#28B9FF] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-1.5 pt-2 border-t border-slate-800/80 px-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-slate-400 text-[10px]">
          <Zap className="w-3 h-3 text-[#22C55E]" /> Instant Drive Links
        </span>
        <button
          onClick={() => {
            onSelectCategory('all');
            if (onClose) onClose();
          }}
          className="text-[10px] font-bold text-[#28B9FF] hover:underline cursor-pointer"
        >
          View Catalog →
        </button>
      </div>
    </div>
  );
};
