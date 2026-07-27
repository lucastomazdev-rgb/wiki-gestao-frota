import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Search, 
  Download, 
  Shield, 
  LogOut, 
  ChevronRight, 
  FolderOpen, 
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  categories = [], 
  selectedCategoryId, 
  onSelectCategory,
  mobileOpen, 
  setMobileOpen 
}) {
  const { user, logout } = useAuth();

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
    { key: 'search', label: 'Buscar', icon: Search, badge: null },
    { key: 'downloads', label: 'Arquivos', icon: Download, badge: 'PDF' },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ key: 'admin', label: 'Painel', icon: Shield, badge: 'Admin' });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border-r border-white/10 w-64 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div 
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="bg-gradient-to-tr from-red-600 to-red-500 text-white p-2.5 rounded-xl font-black shadow-lg shadow-red-900/30 group-hover:scale-105 transition-all">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-black text-white tracking-wider text-base block leading-none">
              SOLAR
            </span>
            <span className="text-[10px] text-red-400 font-mono tracking-widest font-bold block mt-1 uppercase">
              Frota Wiki
            </span>
          </div>
        </div>

        {/* Close button for mobile */}
        {setMobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Navigation Items */}
      <div className="p-3 space-y-1.5">
        <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
          Navegação Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key && (!selectedCategoryId || item.key !== 'home');
          return (
            <motion.button
              key={item.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTabClick(item.key)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-md shadow-red-950/40' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="uppercase font-mono tracking-wide">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isActive 
                    ? 'bg-black/20 text-white border border-white/20' 
                    : 'bg-white/5 text-red-400 border border-red-500/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Categories Tree Navigation */}
      <div className="flex-1 overflow-y-auto p-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-between px-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
          <span>Tópicos & Categorias</span>
          <span className="text-red-400 font-mono bg-red-950/40 border border-red-500/20 px-1.5 py-0.2 rounded-full">{categories.length}</span>
        </div>

        <div className="space-y-1">
          {categories.map((cat) => {
            const isCatSelected = currentTab === 'home' && selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group text-left ${
                  isCatSelected
                    ? 'bg-slate-800/80 text-red-400 font-semibold border-l-2 border-red-500 pl-3 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <FolderOpen size={15} className={isCatSelected ? 'text-red-400 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-red-400'} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <ChevronRight size={13} className={`shrink-0 transition-transform ${isCatSelected ? 'text-red-400 translate-x-0.5' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* User Profile Footer Card */}
      {user && (
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-800/40 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.role === 'ADMIN' ? (
                  <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.2 font-mono uppercase rounded-full font-semibold">
                    Administrador
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-700/40 text-slate-300 border border-white/10 px-2 py-0.2 font-mono uppercase rounded-full">
                    Técnico
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
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
      <aside className="hidden md:block sticky top-0 h-screen z-30 shrink-0">
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
