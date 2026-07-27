import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, api } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import AdminDashboard from './pages/AdminDashboard';
import { Download, FileText, ExternalLink, ShieldAlert, AlertCircle, RefreshCw, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

function AppContent() {
  const { user, loading } = useAuth();
  
  // Navigation State: 'home' | 'search' | 'downloads' | 'admin' | 'article-detail'
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState(null);
  const [selectedArticleTitle, setSelectedArticleTitle] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [forceSearchMode, setForceSearchMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchCategories = () => {
    if (user) {
      api.get('/categories')
        .then(res => setCategories(res.data.data.categories || []))
        .catch(() => {});
    }
  };

  // Fetch categories globally for the Sidebar category tree
  useEffect(() => {
    fetchCategories();
  }, [user]);

  // Technical PDF manuals data for downloads tab
  const technicalFiles = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-3 border-brand-border border-t-brand-lime rounded-full animate-spin" />
        <span className="text-xs font-mono text-brand-muted uppercase tracking-widest">Iniciando Sistema Solar...</span>
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    return <Login />;
  }

  // Handle article selection from home or search
  const handleSelectArticle = (art) => {
    setSelectedArticleSlug(art.slug);
    setSelectedArticleTitle(art.title);
    setCurrentTab('article-detail');
  };

  // Custom tab changer that resets article selection
  const handleTabChange = (tab) => {
    if (tab === 'search') {
      setForceSearchMode(true);
      setCurrentTab('home');
      setSelectedArticleSlug(null);
      setSelectedArticleTitle(null);
    } else {
      setCurrentTab(tab);
      setSelectedArticleSlug(null);
      setSelectedArticleTitle(null);
    }
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    setSelectedArticleSlug(null);
    setSelectedArticleTitle(null);
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-row relative overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-brand-bg">
        <TopBar
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          currentTab={currentTab}
          breadcrumbTitle={selectedArticleTitle}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
          {currentTab === 'home' && (
            <Home 
              onSelectArticle={handleSelectArticle} 
              forceSearchMode={forceSearchMode}
              setForceSearchMode={setForceSearchMode}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              categories={categories}
              setCategories={setCategories}
            />
          )}

          {currentTab === 'article-detail' && selectedArticleSlug && (
            <ArticleDetail 
              articleSlug={selectedArticleSlug} 
              onBack={() => handleTabChange('home')} 
            />
          )}

          {currentTab === 'admin' && user.role === 'ADMIN' && (
            <AdminDashboard 
              onSelectArticle={handleSelectArticle} 
              onBack={() => handleTabChange('home')} 
              onCategoriesUpdated={fetchCategories}
            />
          )}

          {currentTab === 'admin' && user.role !== 'ADMIN' && (
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <ShieldAlert size={56} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white uppercase font-display">Acesso Restrito</h3>
              <p className="text-sm text-brand-muted mt-2">Área restrita a administradores do sistema.</p>
              <button
                onClick={() => handleTabChange('home')}
                className="mt-6 bg-brand-surface border border-brand-border px-5 py-2.5 text-xs font-mono text-brand-lime hover:border-brand-lime rounded-xs transition-colors"
              >
                Voltar para a Wiki
              </button>
            </div>
          )}

          {currentTab === 'downloads' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-brand-border pb-4">
                <h1 className="text-white font-display text-2xl font-black tracking-wide uppercase">
                  Repositório de Arquivos Técnicos
                </h1>
                <p className="text-xs text-brand-muted font-mono uppercase tracking-wider mt-1">
                  Esquemas elétricos, diagramas de fiação e manuais em PDF para download
                </p>
              </div>

              {technicalFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {technicalFiles.map((file, idx) => (
                    <motion.a
                      key={idx}
                      whileHover={{ scale: 1.01, borderColor: 'var(--color-brand-lime)' }}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-brand-surface border border-brand-border rounded-xs flex flex-col justify-between group transition-all h-full"
                    >
                      <div>
                        <span className="text-[9px] font-mono bg-brand-surface-light border border-brand-border text-brand-lime px-2 py-0.5 rounded-xs uppercase tracking-wider font-semibold">
                          {file.type}
                        </span>
                        <h3 className="text-sm font-semibold text-white mt-3 group-hover:text-brand-lime transition-colors leading-snug">
                          {file.title}
                        </h3>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-brand-border/40 flex items-center justify-between text-xs font-mono text-brand-muted group-hover:text-brand-lime">
                        <span>Download PDF</span>
                        <Download size={16} className="shrink-0 transition-transform group-hover:translate-y-0.5" />
                      </div>
                    </motion.a>
                  ))}
                </div>
              ) : (
                <div className="py-16 px-4 text-center border border-dashed border-brand-border rounded-xs bg-brand-surface/40 my-8">
                  <FolderOpen size={48} className="mx-auto text-brand-muted mb-3 opacity-60" />
                  <h3 className="text-base font-semibold text-white font-display">Ainda não temos dados por aqui...</h3>
                  <p className="text-xs text-brand-muted mt-1 font-mono">
                    Nenhum arquivo ou documento técnico foi disponibilizado no momento.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (only on small mobile screens) */}
      <Footer currentTab={currentTab === 'article-detail' ? 'home' : currentTab} setCurrentTab={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
