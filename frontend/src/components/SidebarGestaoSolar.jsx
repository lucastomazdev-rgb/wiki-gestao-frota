import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, 
  BookOpen, 
  LogOut, 
  X, 
  ArrowLeft,
  Building2,
  Calendar,
  AlertTriangle,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SidebarGestaoSolar({ 
  currentSolarTab, 
  setCurrentSolarTab, 
  onBackToWiki,
  mobileOpen, 
  setMobileOpen 
}) {
  const { user, logout } = useAuth();

  const handleTabClick = (tabKey) => {
    setCurrentSolarTab(tabKey);
    if (setMobileOpen) setMobileOpen(false);
  };

  const navItems = [
    { key: 'veiculos', label: 'Veículos & Frota', icon: Truck, active: true },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 p-2.5 rounded-xl font-bold shadow-md shadow-teal-950/20">
            <Truck size={20} strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-sans font-black text-white text-base block leading-none tracking-tight">
              Gestão Solar
            </span>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mt-1">
              Frota Coca-Cola
            </span>
          </div>
        </div>

        {setMobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Switcher Button: Back to Wiki */}
      <div className="p-3 pb-1">
        <button
          onClick={onBackToWiki}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs group cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para a Wiki</span>
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Módulos Operacionais
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSolarTab === item.key;
          return (
            <motion.button
              key={item.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTabClick(item.key)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-teal-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </motion.button>
          );
        })}

        {/* Informative card about upcoming modules */}
        <div className="mt-8 p-3.5 bg-slate-800/40 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
            <ShieldCheck size={14} className="text-teal-400" />
            <span>Módulo Ativo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Painel operacional exclusivo para gestão e monitoramento da frota Coca-Cola Solar.
          </p>
        </div>
      </div>

      {/* User Profile Footer Card */}
      {user && (
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-800/50 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] bg-teal-500/15 text-teal-400 border border-teal-500/30 px-2 py-0.2 rounded-full font-medium">
                  {user.role === 'ADMIN' ? 'Supervisor' : 'Técnico'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Sair da Conta"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 shrink-0 z-30 bg-slate-900 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 h-full"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
