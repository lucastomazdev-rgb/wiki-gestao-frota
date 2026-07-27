import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, BookOpen, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-brand-border bg-brand-surface/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div 
        onClick={() => setCurrentTab('home')} 
        className="flex items-center gap-2 cursor-pointer select-none"
      >
        <div className="bg-brand-lime text-brand-bg p-1.5 rounded-xs font-black">
          <BookOpen size={18} strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-display font-black text-white tracking-wider text-sm block leading-none">
            SOLAR
          </span>
          <span className="text-[10px] text-brand-lime font-mono tracking-widest font-semibold block mt-0.5">
            FROTA WIKI
          </span>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-right hidden sm:block">
            <span className="text-xs font-semibold text-white block">{user.name}</span>
            <div className="flex justify-end items-center gap-1">
              {user.role === 'ADMIN' ? (
                <span className="text-[9px] bg-brand-lime/10 text-brand-lime border border-brand-lime/20 px-1 font-mono uppercase rounded-xs">
                  Administrador
                </span>
              ) : (
                <span className="text-[9px] bg-brand-muted/10 text-brand-muted border border-brand-muted/20 px-1 font-mono uppercase rounded-xs">
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
                className={`p-2 rounded-xs border transition-colors ${
                  currentTab === 'admin' 
                    ? 'bg-brand-lime text-brand-bg border-brand-lime' 
                    : 'bg-brand-surface-light text-brand-text border-brand-border hover:text-brand-lime hover:border-brand-lime'
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
              className="p-2 rounded-xs border border-brand-border bg-brand-surface-light text-brand-text hover:text-red-500 hover:border-red-500/30 transition-colors"
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
