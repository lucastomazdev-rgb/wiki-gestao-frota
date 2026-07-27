import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, BookOpen, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div 
        onClick={() => setCurrentTab('home')} 
        className="flex items-center gap-3 cursor-pointer select-none group"
      >
        <div className="bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 p-2 rounded-xl font-bold shadow-md shadow-amber-950/20 group-hover:scale-105 transition-all">
          <BookOpen size={19} strokeWidth={2.2} />
        </div>
        <div>
          <span className="font-sans font-bold text-white text-base block leading-none tracking-tight">
            Solar
          </span>
          <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
            Frota Wiki
          </span>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-right hidden sm:block">
            <span className="text-xs font-semibold text-white block">{user.name}</span>
            <div className="flex justify-end items-center gap-1">
              {user.role === 'ADMIN' ? (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 font-medium rounded-full">
                  Administrador
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-white/10 px-2 py-0.5 font-medium rounded-full">
                  Técnico
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentTab(currentTab === 'admin' ? 'home' : 'admin')}
                className={`p-2 rounded-xl border transition-colors ${
                  currentTab === 'admin' 
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold' 
                    : 'bg-slate-800/80 text-slate-200 border-white/10 hover:text-amber-400 hover:border-amber-500/30'
                }`}
                title="Painel Administrativo"
              >
                <Shield size={16} />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-2 rounded-xl border border-white/10 bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
              title="Sair do Sistema"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>
      )}
    </header>
  );
}
