import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-white font-sans text-xs font-semibold rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95 group"
          title="Voltar ao topo da página"
        >
          <ArrowUp className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
          <span>Voltar ao topo</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
