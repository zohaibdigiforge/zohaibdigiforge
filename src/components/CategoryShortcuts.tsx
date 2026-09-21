import React from 'react';
import { motion } from 'motion/react';
import { Category, Product } from '../types';
import { 
  GraduationCap, 
  Palette, 
  Layout, 
  Cpu, 
  BookOpen, 
  Wrench, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CategoryShortcutsProps {
  categories: Category[];
  products: Product[];
  onNavigateCategory: (slug: string) => void;
}

// Icon mapper for categories
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  GraduationCap,
  Palette,
  Layout,
  Cpu,
  BookOpen,
  Wrench,
};

export const CategoryShortcuts: React.FC<CategoryShortcutsProps> = ({
  categories,
  products,
  onNavigateCategory,
}) => {
  // Sort categories by their defined order
  const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section id="category-shortcuts" className="py-12 px-4 sm:px-6 lg:px-8 relative bg-slate-950/20 border-b border-slate-900/60">
      {/* Absolute Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[150px] bg-[#0D6EFD]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4"
        >
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[#28B9FF] text-[10px] font-bold tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#28B9FF] animate-pulse" />
              <span>Explore Your Passion</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Browse Digital Resource Shortcuts
            </h2>
            <p className="text-xs text-slate-400">
              Direct access to our premium collections. Pick a shortcut to explore.
            </p>
          </div>
          
          <button 
            onClick={() => onNavigateCategory('all')}
            className="group flex items-center gap-1 text-xs font-bold text-[#28B9FF] hover:text-[#0D6EFD] transition-colors self-start md:self-auto cursor-pointer"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Categories Shortcut Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {sortedCategories.map((category, idx) => {
            // Find matched icon or fallback
            const IconComponent = iconMap[category.icon] || GraduationCap;

            // Calculate precise item count for this category dynamically
            const categoryProducts = products.filter(
              (p) => p.categoryId === category.id || p.categoryId === category.slug
            );
            const count = categoryProducts.length;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                onClick={() => onNavigateCategory(category.slug)}
                className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/90 hover:-translate-y-1 transition-all duration-300 text-center w-full focus:outline-none focus:ring-2 focus:ring-[#28B9FF]/50"
              >
                {/* Background Subtle Radial Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.featuredColor || 'from-slate-800/20 to-slate-900/10'} opacity-0 group-hover:opacity-15 rounded-2xl transition-opacity duration-300 pointer-events-none`} />

                {/* Rounded Icon */}
                <div className="p-3 rounded-xl bg-slate-950/60 text-slate-300 border border-slate-800 group-hover:text-[#28B9FF] group-hover:border-[#28B9FF]/40 group-hover:scale-105 transition-all duration-300 mb-3">
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Category Name */}
                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-white transition-colors block leading-tight">
                  {category.name}
                </span>

                {/* Count Badge */}
                <span className="mt-1.5 text-[9px] sm:text-[10px] font-medium text-slate-400 group-hover:text-[#22C55E] transition-colors">
                  {count} {count === 1 ? 'Resource' : 'Resources'}
                </span>
              </motion.button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
