import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, api } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ui/ToastContainer';
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin" />
        <span className="text-xs font-sans text-slate-400">Iniciando Sistema Solar...</span>
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-row relative overflow-x-hidden">
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-900">
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
              <ShieldAlert size={56} className="mx-auto text-amber-500 mb-4" />
              <h3 className="text-xl font-bold text-white font-sans">Acesso Restrito</h3>
              <p className="text-sm text-slate-400 mt-2">Área restrita a administradores do sistema.</p>
              <button
                onClick={() => handleTabChange('home')}
                className="mt-6 bg-slate-800 border border-white/10 px-5 py-2.5 text-xs font-sans text-amber-400 hover:border-amber-500/40 rounded-full transition-colors cursor-pointer"
              >
                Voltar para a Wiki
              </button>
            </div>
          )}

          {currentTab === 'downloads' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-white font-sans text-2xl font-bold tracking-tight">
                  Repositório de Arquivos Técnicos
                </h1>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Esquemas elétricos, diagramas de fiação e manuais em PDF para download
                </p>
              </div>

              {technicalFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {technicalFiles.map((file, idx) => (
                    <motion.a
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl flex flex-col justify-between group transition-all h-full hover:border-amber-500/40"
                    >
                      <div>
                        <span className="text-[11px] font-sans bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-medium">
                          {file.type}
                        </span>
                        <h3 className="text-sm font-semibold text-white mt-3 group-hover:text-amber-400 transition-colors leading-snug">
                          {file.title}
                        </h3>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-sans text-slate-400 group-hover:text-amber-400">
                        <span>Download PDF</span>
                        <Download size={16} className="shrink-0 transition-transform group-hover:translate-y-0.5" />
                      </div>
                    </motion.a>
                  ))}
                </div>
              ) : (
                <div className="py-16 px-4 text-center border border-dashed border-white/10 rounded-3xl bg-slate-900/40 my-8">
                  <FolderOpen size={48} className="mx-auto text-slate-500 mb-3 opacity-60" />
                  <h3 className="text-base font-semibold text-white font-sans">Ainda não temos dados por aqui...</h3>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
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

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

