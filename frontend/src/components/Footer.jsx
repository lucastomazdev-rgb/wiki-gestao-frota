import React from 'react';
import { BookOpen, Search, Download, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Footer({ currentTab, setCurrentTab }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-surface/95 border-t border-brand-border backdrop-blur-md px-6 py-2 flex items-center justify-around select-none">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setCurrentTab('home')}
        className={`flex flex-col items-center gap-0.5 py-1 ${
          currentTab === 'home' ? 'text-brand-lime font-bold' : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        <BookOpen size={20} />
        <span className="text-[10px] font-mono uppercase tracking-wider">Wiki</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setCurrentTab('search')}
        className={`flex flex-col items-center gap-0.5 py-1 ${
          currentTab === 'search' ? 'text-brand-lime font-bold' : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        <Search size={20} />
        <span className="text-[10px] font-mono uppercase tracking-wider">Buscar</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setCurrentTab('downloads')}
        className={`flex flex-col items-center gap-0.5 py-1 ${
          currentTab === 'downloads' ? 'text-brand-lime font-bold' : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        <Download size={20} />
        <span className="text-[10px] font-mono uppercase tracking-wider">Arquivos</span>
      </motion.button>

      {user.role === 'ADMIN' && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentTab('admin')}
          className={`flex flex-col items-center gap-0.5 py-1 ${
            currentTab === 'admin' ? 'text-brand-lime font-bold' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Shield size={20} />
          <span className="text-[10px] font-mono uppercase tracking-wider">Painel</span>
        </motion.button>
      )}
    </footer>
  );
}
