import React from 'react';
import { Product, Category } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { GraduationCap, Palette, LayoutTemplate, Cpu, BookOpen, Wrench, ArrowUpRight } from 'lucide-react';

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  products?: Product[];
  categories?: Category[];
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  GraduationCap,
  Palette,
  LayoutTemplate,
  Cpu,
  BookOpen,
  Wrench,
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ 
  selectedCategory, 
  onSelectCategory,
  products = [],
  categories = []
}) => {
  const displayCategories = (categories && categories.length > 0) ? categories : INITIAL_CATEGORIES;

  return (
    <section id="categories" className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            Categories
          </h2>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCategories.map((cat) => {
            const IconComponent = iconMap[cat.iconName || ''] || GraduationCap;
            const isSelected = selectedCategory === cat.name;

            // Calculate exact number of products listed under this category
            const count = products.length > 0 
              ? products.filter(p => p.categoryId === cat.id || p.categoryId === cat.slug || p.categoryId === cat.name.toLowerCase().replace(/ /g, '-')).length
              : 0;
            const displayCount = `${count} ${count === 1 ? 'Resource' : 'Resources'}`;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.name);
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${
                  isSelected
                    ? 'bg-slate-900 border-[#28B9FF] shadow-lg shadow-[#0D6EFD]/30 -translate-y-1'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 hover:-translate-y-1.5 hover:shadow-xl'
                }`}
              >
                {/* Background Gradient Accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.featuredColor || 'from-blue-600/20 to-purple-600/20'} opacity-20 rounded-2xl transition-opacity group-hover:opacity-40 pointer-events-none`} />

                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  
                  {/* Top Bar: Icon + Count Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${
                      isSelected
                        ? 'bg-[#0D6EFD] text-white border-[#28B9FF]'
                        : 'bg-slate-800/80 text-[#28B9FF] border-slate-700 group-hover:bg-[#0D6EFD] group-hover:text-white transition-colors'
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80">
                      {displayCount}
                    </span>
                  </div>

                  {/* Body: Title + Description */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#28B9FF] transition-colors">
                        {cat.name}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#28B9FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  {/* Filter CTA indicator */}
                  <div className="pt-2 flex items-center text-xs font-semibold text-[#28B9FF] group-hover:underline">
                    <span>{isSelected ? 'Currently Viewing' : 'Explore Category'}</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
