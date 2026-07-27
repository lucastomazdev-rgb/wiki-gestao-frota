import React from 'react';
import { BookOpen, Download, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Footer({ currentTab, setCurrentTab }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-white/10 backdrop-blur-md px-6 py-2 flex items-center justify-around select-none">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setCurrentTab('home')}
        className={`flex flex-col items-center gap-0.5 py-1 ${
          currentTab === 'home' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <BookOpen size={20} />
        <span className="text-[11px] font-sans font-medium">Wiki</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setCurrentTab('downloads')}
        className={`flex flex-col items-center gap-0.5 py-1 ${
          currentTab === 'downloads' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Download size={20} />
        <span className="text-[11px] font-sans font-medium">Arquivos</span>
      </motion.button>

      {user.role === 'ADMIN' && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentTab('admin')}
          className={`flex flex-col items-center gap-0.5 py-1 ${
            currentTab === 'admin' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield size={20} />
          <span className="text-[11px] font-sans font-medium">Painel</span>
        </motion.button>
      )}
    </footer>
  );
}
