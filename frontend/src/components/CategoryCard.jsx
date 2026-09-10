import React from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { ICON_MAP } from '../utils/iconMap';

export default function CategoryCard({ category, onClick, count = 0 }) {
  // Dynamically resolve icon from mapped dictionary with fallback
  const IconComponent = ICON_MAP[category.iconName] || BookOpen;
  
  // Custom brand identification for Coca-Cola
  const isCocaCola = 
    category.slug === 'processos-coca-cola' || 
    category.iconName === 'CocaCola' || 
    category.iconName === 'CocaColaBottle' || 
    category.iconName === 'SodaCan';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-5 bg-slate-900/60 backdrop-blur-md border rounded-2xl cursor-pointer transition-all select-none relative overflow-hidden group shadow-lg ${
        isCocaCola 
          ? 'border-white/10 hover:border-red-500/50 hover:bg-slate-800/80 hover:shadow-red-950/20' 
          : 'border-white/10 hover:border-amber-500/40 hover:bg-slate-800/70 hover:shadow-amber-950/10'
      }`}
    >
      {/* Background glow gradient */}
      <div 
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl transition-all pointer-events-none ${
          isCocaCola 
            ? 'bg-red-500/10 group-hover:bg-red-500/20' 
            : 'bg-amber-500/5 group-hover:bg-amber-500/10'
        }`} 
      />
      
      <div className="flex items-start gap-3.5 relative z-10">
        <div 
          className={`p-3 rounded-xl transition-all duration-300 shadow-sm ${
            isCocaCola
              ? 'bg-red-500/15 text-red-400 border border-red-500/30 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950'
          }`}
        >
          <IconComponent size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            className={`font-sans font-semibold text-base tracking-tight transition-colors truncate ${
              isCocaCola ? 'text-white group-hover:text-red-400' : 'text-white group-hover:text-amber-400'
            }`}
          >
            {category.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {category.description || 'Manuais e procedimentos operacionais.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3 text-xs font-sans text-slate-400 relative z-10">
        <span className="font-medium text-slate-400">Tópico #{category.slug}</span>
        <span 
          className={`px-2.5 py-0.5 rounded-full font-medium text-[11px] ${
            isCocaCola 
              ? 'bg-red-500/15 border border-red-500/25 text-red-400' 
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}
        >
          {count} {count === 1 ? 'tutorial' : 'tutoriais'}
        </span>
      </div>
    </motion.div>
  );
}

