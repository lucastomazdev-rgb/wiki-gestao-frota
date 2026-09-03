import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, 
  LogOut, 
  X, 
  ArrowLeft,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('gestao_solar_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gestao_solar_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleTabClick = (tabKey) => {
    setCurrentSolarTab(tabKey);
    if (setMobileOpen) setMobileOpen(false);
  };

  const navItems = [
    { key: 'veiculos', label: 'Veículos & Frota', icon: Truck },
    { key: 'retiradas', label: 'Retiradas & Baixas', icon: LogOut },
    { key: 'tutoriais', label: 'Conhecimentos Gerais', icon: BookOpen },
  ];

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] select-none ${
      isCollapsed ? 'w-[72px]' : 'w-64'
    }`}>
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between h-[73px] shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 p-2.5 rounded-xl font-bold shadow-md shadow-teal-950/20 shrink-0">
            <Truck size={20} strokeWidth={2.2} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isCollapsed ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none' : 'opacity-100 max-w-[160px] translate-x-0'
          }`}>
            <span className="font-sans font-black text-white text-base block leading-none tracking-tight whitespace-nowrap">
              Gestão Solar
            </span>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mt-1 whitespace-nowrap">
              Frota Coca-Cola
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {setMobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar menu lateral"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Switcher Button: Back to Wiki */}
      <div className="p-3 pb-1 shrink-0">
        <button
          onClick={onBackToWiki}
          className={`w-full flex items-center justify-center gap-2.5 p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs group cursor-pointer relative ${
            isCollapsed ? 'px-0' : 'px-3.5'
          }`}
          title={isCollapsed ? 'Voltar para a Wiki' : undefined}
        >
          <ArrowLeft size={16} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
          <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-[140px] opacity-100'
          }`}>
            Voltar para a Wiki
          </span>

          {/* Tooltip when collapsed */}
          {isCollapsed && (
            <div className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-amber-300 text-xs font-bold rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-[200] transition-all duration-200 border border-slate-700 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
              Voltar para a Wiki
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
            </div>
          )}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
        <div className={`overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-8 px-2 py-1.5'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
            Módulos Operacionais
          </span>
        </div>

        {isCollapsed && <div className="h-px bg-white/10 my-2 mx-1" />}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSolarTab === item.key;
          return (
            <div key={item.key} className="relative group">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleTabClick(item.key)}
                className={`w-full flex items-center p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative overflow-hidden ${
                  isActive 
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-xs' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                  <Icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className={`font-sans whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-full opacity-100 truncate'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {!isCollapsed && isActive && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0 ml-2" />
                )}
              </motion.button>

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-[200] transition-all duration-200 border border-slate-700 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
                </div>
              )}
            </div>
          );
        })}

        {/* Informative card about upcoming modules (expanded only) */}
        {!isCollapsed && (
          <div className="mt-8 p-3.5 bg-slate-800/40 border border-white/5 rounded-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
              <ShieldCheck size={14} className="text-teal-400" />
              <span>Módulo Ativo</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Painel operacional exclusivo para gestão e monitoramento da frota Coca-Cola Solar.
            </p>
          </div>
        )}
      </div>

      {/* Footer: Toggle Collapse + User Profile */}
      <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
        {/* Toggle Collapse Button (Desktop) */}
        <button
          onClick={toggleCollapse}
          className={`hidden md:flex items-center w-full p-2 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-teal-300 transition-all duration-300 overflow-hidden group relative cursor-pointer ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          <div className="p-1 rounded-lg shrink-0 group-hover:bg-white/5 transition-colors">
            {isCollapsed ? (
              <PanelLeftOpen size={18} className="text-teal-400 group-hover:scale-110 transition-transform" />
            ) : (
              <PanelLeftClose size={18} className="text-slate-400 group-hover:text-teal-300 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ml-2 ${
            isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-[120px] opacity-100'
          }`}>
            Recolher Barra
          </span>

          {isCollapsed && (
            <div className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-teal-300 text-xs font-bold rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-[200] transition-all duration-200 border border-slate-700 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
              Expandir Barra Lateral
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
            </div>
          )}
        </button>

        {/* User Profile Card */}
        {user && (
          <div className={`flex items-center bg-slate-800/50 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300 ${
            isCollapsed ? 'p-1.5 flex-col gap-2' : 'p-3 justify-between gap-3'
          }`}>
            {isCollapsed ? (
              <>
                <div 
                  className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xs uppercase"
                  title={`${user.name} (${user.role === 'ADMIN' ? 'Supervisor' : 'Técnico'})`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer relative group"
                  title="Sair da Conta"
                  aria-label="Sair da Conta"
                >
                  <LogOut size={16} />
                  <div className="hidden md:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-rose-300 text-[11px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-[200] opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 border border-slate-700">
                    Sair da Conta
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
                  </div>
                </button>
              </>
            ) : (
              <>
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
                  aria-label="Sair da Conta"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen shrink-0 z-30 bg-slate-900 border-r border-slate-800 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}>
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
