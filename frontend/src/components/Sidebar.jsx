import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Download, 
  Shield, 
  LogOut, 
  ChevronRight, 
  FolderOpen, 
  X,
  Truck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  categories = [], 
  selectedCategoryId, 
  onSelectCategory,
  mobileOpen, 
  setMobileOpen,
  onSwitchToSolar
}) {
  const { user, logout } = useAuth();
  const canAccessSolar = user?.role === 'ADMIN' || Boolean(user?.can_access_gestao_solar);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('wiki_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('wiki_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleTabClick = (tabKey) => {
    setCurrentTab(tabKey);
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleCategoryClick = (catId) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    setCurrentTab('home');
    if (setMobileOpen) setMobileOpen(false);
  };

  const navItems = [
    { key: 'home', label: 'Wiki', icon: BookOpen, badge: null },
    { key: 'downloads', label: 'Arquivos', icon: Download, badge: 'PDF' },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ key: 'admin', label: 'Painel Admin', icon: Shield, badge: 'Admin' });
  }

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/10 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] select-none ${
      isCollapsed ? 'w-[72px]' : 'w-64'
    }`}>
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between h-[73px] shrink-0 overflow-hidden">
        <div 
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 cursor-pointer group min-w-0 overflow-hidden"
        >
          <div className="bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 p-2.5 rounded-xl font-bold shadow-md shadow-amber-950/20 group-hover:scale-105 transition-all shrink-0">
            <BookOpen size={20} strokeWidth={2.2} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isCollapsed ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none' : 'opacity-100 max-w-[160px] translate-x-0'
          }`}>
            <span className="font-sans font-black text-white text-lg block leading-none tracking-tight whitespace-nowrap">
              Solar
            </span>
            <span className="text-[11px] text-amber-400 font-bold block mt-1 whitespace-nowrap">
              Frota Wiki
            </span>
          </div>
        </div>

        {/* Close button for mobile */}
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

      {/* Main Navigation Items */}
      <div className="p-3 space-y-1.5 shrink-0">
        <div className={`overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-8 px-2 py-1.5'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
            Navegação Principal
          </span>
        </div>

        {isCollapsed && <div className="h-px bg-white/10 my-2 mx-1" />}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key && (!selectedCategoryId || item.key !== 'home');
          return (
            <div key={item.key} className="relative group">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleTabClick(item.key)}
                className={`w-full flex items-center p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative overflow-hidden ${
                  isActive 
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                  <Icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className={`font-sans whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-full opacity-100 truncate'
                  }`}>
                    {item.label}
                  </span>
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}>
                    {item.badge}
                  </span>
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

        {/* Gestão Solar Client Platform Switcher */}
        {canAccessSolar && (
          <div className="pt-2 border-t border-white/10 relative group">
            <button
              onClick={() => {
                if (onSwitchToSolar) onSwitchToSolar();
                if (setMobileOpen) setMobileOpen(false);
              }}
              className={`w-full flex items-center p-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 border border-teal-500/30 hover:border-teal-500/50 text-teal-300 hover:text-teal-200 transition-all cursor-pointer shadow-xs ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                <Truck size={16} className="text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-full opacity-100 truncate'
                }`}>
                  Gestão Solar
                </span>
              </div>
              {!isCollapsed && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0 ml-2" />}
            </button>

            {/* Tooltip when collapsed */}
            {isCollapsed && (
              <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-teal-300 text-xs font-bold rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-[200] transition-all duration-200 border border-slate-700 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
                Acessar Gestão Solar
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Categories Tree Navigation */}
      <div className="flex-1 overflow-y-auto p-3 border-t border-white/5 space-y-2 custom-scrollbar">
        <div className={`overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-8 flex items-center justify-between px-2 text-xs font-bold text-slate-400 tracking-tight'
        }`}>
          <span>Tópicos & Categorias</span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {categories.length}
          </span>
        </div>

        {isCollapsed && <div className="h-px bg-white/10 my-2 mx-1" />}

        <div className="space-y-1">
          {categories.map((cat) => {
            const isCatSelected = currentTab === 'home' && selectedCategoryId === cat.id;
            return (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full flex items-center p-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                    isCatSelected
                      ? 'bg-slate-800/90 text-amber-400 font-bold border-l-2 border-amber-500 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'}`}
                >
                  <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center w-full' : 'pr-2'}`}>
                    <FolderOpen size={15} className={`shrink-0 ${isCatSelected ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                    <span className={`truncate whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-full opacity-100'
                    }`}>
                      {cat.name}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <ChevronRight size={13} className={`shrink-0 transition-transform ${isCatSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`} />
                  )}
                </button>

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-[200] transition-all duration-200 border border-slate-700 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
                    {cat.name}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Toggle Collapse + User Profile Card */}
      <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
        {/* Toggle Collapse Button (Desktop) */}
        <button
          onClick={toggleCollapse}
          className={`hidden md:flex items-center w-full p-2 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-amber-300 transition-all duration-300 overflow-hidden group relative cursor-pointer ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          <div className="p-1 rounded-lg shrink-0 group-hover:bg-white/5 transition-colors">
            {isCollapsed ? (
              <PanelLeftOpen size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
            ) : (
              <PanelLeftClose size={18} className="text-slate-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ml-2 ${
            isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-[120px] opacity-100'
          }`}>
            Recolher Barra
          </span>

          {isCollapsed && (
            <div className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-amber-300 text-xs font-bold rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-[200] transition-all duration-200 border border-slate-700 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
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
                  className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-xs uppercase"
                  title={`${user.name} (${user.role === 'ADMIN' ? 'Administrador' : 'Técnico'})`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer relative group"
                  title="Sair da Conta"
                  aria-label="Sair da Conta"
                >
                  <LogOut size={16} />
                  <div className="hidden md:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-amber-300 text-[11px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-[200] opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 border border-slate-700">
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
                    {user.role === 'ADMIN' ? (
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.2 rounded-full font-medium">
                        Administrador
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-700/50 text-slate-300 border border-white/10 px-2 py-0.2 rounded-full font-medium">
                        Técnico
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors shrink-0 cursor-pointer"
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
      <aside className={`hidden md:block sticky top-0 h-screen z-30 shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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
