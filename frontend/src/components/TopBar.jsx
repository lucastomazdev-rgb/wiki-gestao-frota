import React from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ 
  onToggleMobileSidebar, 
  currentTab, 
  breadcrumbTitle
}) {
  const { user } = useAuth();

  const getTabLabel = () => {
    switch (currentTab) {
      case 'home':
        return 'Wiki';
      case 'search':
        return 'Buscar';
      case 'downloads':
        return 'Arquivos';
      case 'admin':
        return 'Painel Administrativo';
      case 'article-detail':
        return 'Tutorial';
      default:
        return 'Wiki';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-900/60 backdrop-blur-md border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-slate-300 hover:text-red-400 bg-white/5 border border-white/10 rounded-xl transition-colors"
          title="Abrir Menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono truncate">
          <span className="text-red-400 font-bold hidden sm:inline uppercase tracking-wider bg-red-950/30 border border-red-500/20 px-2 py-0.5 rounded-md">
            SOLAR WIKI
          </span>
          <ChevronRight size={14} className="hidden sm:inline shrink-0 text-slate-500" />
          <span className="uppercase tracking-wider font-semibold text-white">
            {getTabLabel()}
          </span>
          {breadcrumbTitle && (
            <>
              <ChevronRight size={14} className="shrink-0 text-slate-500" />
              <span className="text-cyan-400 truncate font-medium max-w-[200px] sm:max-w-[350px]">
                {breadcrumbTitle}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-3 shrink-0">
        {/* System indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-950/30 border border-emerald-500/20 rounded-full text-[10px] font-mono text-emerald-400 font-semibold shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FROTA ONLINE</span>
        </div>
      </div>
    </header>
  );
}
