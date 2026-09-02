import React from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ 
  onToggleMobileSidebar, 
  currentTab, 
  breadcrumbTitle,
  onSwitchToSolar,
  platformMode = 'wiki'
}) {
  const { user } = useAuth();
  const canAccessSolar = user?.role === 'ADMIN' || Boolean(user?.can_access_gestao_solar);

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
    <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-slate-300 hover:text-amber-400 bg-white/5 border border-white/10 rounded-xl transition-colors cursor-pointer"
          title="Abrir Menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-sans truncate">
          <span className="text-amber-400 font-semibold hidden sm:inline bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            Solar Wiki
          </span>
          <ChevronRight size={14} className="hidden sm:inline shrink-0 text-slate-500" />
          <span className="font-semibold text-white">
            {getTabLabel()}
          </span>
          {breadcrumbTitle && (
            <>
              <ChevronRight size={14} className="shrink-0 text-slate-500" />
              <span className="text-amber-300/90 truncate font-medium max-w-[200px] sm:max-w-[350px]">
                {breadcrumbTitle}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Switch to Gestão Solar Button */}
        {canAccessSolar && (
          <button
            onClick={onSwitchToSolar}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-teal-500/15 to-emerald-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 border border-teal-500/40 text-teal-300 hover:text-teal-200 rounded-xl text-xs font-sans font-black tracking-tight transition-all shadow-xs hover:shadow-teal-500/20 hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Alternar para a plataforma Gestão Solar"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Gestão Solar</span>
          </button>
        )}

        {/* System indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-sans text-emerald-400 font-medium shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Frota Online</span>
        </div>
      </div>
    </header>
  );
}
