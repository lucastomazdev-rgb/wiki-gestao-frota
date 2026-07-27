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
      className="p-5 bg-slate-900/50 backdrop-blur-md border border-white/10 hover:border-red-500/40 hover:bg-slate-800/60 rounded-2xl cursor-pointer transition-all select-none relative overflow-hidden group shadow-lg hover:shadow-red-950/20"
    >
      {/* Background glow gradient */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/15 transition-all pointer-events-none" />
      
      <div className="flex items-start gap-3.5 relative z-10">
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl group-hover:bg-gradient-to-tr group-hover:from-red-600 group-hover:to-red-500 group-hover:text-white transition-all duration-300 shadow-sm">
          <IconComponent size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-display font-bold text-base tracking-wide group-hover:text-red-400 transition-colors truncate">
            {category.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {category.description || 'Manuais de hardware e procedimentos de instalação.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3 text-[10px] font-mono text-slate-400 relative z-10">
        <span className="uppercase tracking-wider font-semibold">TÓPICO #{category.slug.toUpperCase()}</span>
        <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-red-400 font-mono font-semibold">
          {count} {count === 1 ? 'tutorial' : 'tutoriais'}
        </span>
      </div>
    </motion.div>
  );
}
