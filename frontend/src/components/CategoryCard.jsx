import React from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryCard({ category, onClick, count = 0 }) {
  // Dynamically resolve icon from name
  const IconComponent = Icons[category.iconName] || Icons.BookOpen;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-5 bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-amber-500/40 hover:bg-slate-800/70 rounded-2xl cursor-pointer transition-all select-none relative overflow-hidden group shadow-lg hover:shadow-amber-950/10"
    >
      {/* Background glow gradient */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
      
      <div className="flex items-start gap-3.5 relative z-10">
        <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-sm">
          <IconComponent size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-sans font-semibold text-base tracking-tight group-hover:text-amber-400 transition-colors truncate">
            {category.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {category.description || 'Manuais de hardware e procedimentos de instalação.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3 text-xs font-sans text-slate-400 relative z-10">
        <span className="font-medium text-slate-400">Tópico #{category.slug}</span>
        <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-amber-400 font-medium text-[11px]">
          {count} {count === 1 ? 'tutorial' : 'tutoriais'}
        </span>
      </div>
    </motion.div>
  );
}
