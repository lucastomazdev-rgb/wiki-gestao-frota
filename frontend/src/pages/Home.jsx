import React, { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';
import CategoryCard from '../components/CategoryCard';
import { Search, AlertCircle, FileText, ChevronRight, Eye, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export default function Home({ 
  onSelectArticle, 
  forceSearchMode, 
  setForceSearchMode,
  selectedCategoryId,
  setSelectedCategoryId,
  categories,
  setCategories
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const cardsRef = useRef([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catsRes, artsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/articles')
      ]);
      if (setCategories) {
        setCategories(catsRes.data.data.categories || []);
      }
      setArticles(artsRes.data.data.articles || []);
    } catch (err) {
      setError('Não foi possível conectar ao servidor. A Wiki requer conexão de internet ativa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // GSAP Entrance Stagger with null-check safeguard
  useEffect(() => {
    const validCards = (cardsRef.current || []).filter(el => el !== null && el !== undefined);
    if (!loading && validCards.length > 0 && !selectedCategoryId && !searchQuery) {
      gsap.fromTo(
        validCards,
        { opacity: 0, y: 15 },
        { 
          opacity: 1, 
          y: 0, 
          stagger: 0.06, 
          duration: 0.35, 
          ease: 'power2.out',
          overwrite: 'auto'
        }
      );
    }
  }, [loading, categories, selectedCategoryId, searchQuery]);

  // Handle external redirect from top search trigger
  useEffect(() => {
    if (forceSearchMode) {
      setSelectedCategoryId(null);
      setSearchQuery('');
      setForceSearchMode(false);
      const input = document.getElementById('global-search');
      if (input) input.focus();
    }
  }, [forceSearchMode]);

  const normalizeText = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const getSnippet = (contentMarkdown, query) => {
    if (!contentMarkdown || !query.trim()) return null;
    
    const plainText = contentMarkdown
      .replace(/[#*`_~>[\]()!]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedPlain = normalizeText(plainText);
    const queryTokens = normalizeText(query).split(/\s+/).filter(Boolean);

    if (queryTokens.length === 0) return null;

    let matchIndex = -1;
    for (const token of queryTokens) {
      const idx = normalizedPlain.indexOf(token);
      if (idx !== -1) {
        matchIndex = idx;
        break;
      }
    }

    if (matchIndex === -1) return null;

    const start = Math.max(0, matchIndex - 35);
    const end = Math.min(plainText.length, matchIndex + 90);
    
    let snippet = plainText.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < plainText.length) snippet = snippet + '...';

    return snippet;
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategoryId ? article.categoryId === selectedCategoryId : true;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;

    const normalizedQuery = normalizeText(searchQuery);
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const titleNorm = normalizeText(article.title);
    const catNorm = normalizeText(article.category?.name || '');
    const contentNorm = normalizeText(article.contentMarkdown || '');

    const fullTextNorm = `${titleNorm} ${catNorm} ${contentNorm}`;

    const exactMatch = fullTextNorm.includes(normalizedQuery);
    const allTokensMatch = queryTokens.length > 0 && queryTokens.every(token => fullTextNorm.includes(token));

    return exactMatch || allTokensMatch;
  });

  const getCategoryArticleCount = (catId) => {
    return articles.filter(art => art.categoryId === catId).length;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Glass Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        {/* Soft glowing orb accent */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-3 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold">
              PLATAFORMA ORGANIZACIONAL
            </span>
            <span className="text-xs text-slate-400 font-mono">• Solar Coca-Cola</span>
          </div>
          <h1 className="text-2xl lg:text-3xl text-white font-display font-black tracking-wide uppercase">
            Wiki de Frota
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
            Documentação técnica oficial, esquemas de fiação de rastreadores, procedimentos de segurança e manuais da frota operados no pátio.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 z-10">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-2xl font-black text-red-400 font-mono leading-none">
              {articles.length}
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1">
              Tutoriais Ativos
            </span>
          </div>
          <button
            onClick={fetchData}
            className="p-3 border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-white transition-all rounded-2xl bg-white/5 flex items-center gap-2 text-xs font-mono backdrop-blur-md shadow-xs"
            title="Sincronizar enciclopédia"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-red-400" : ""} />
            <span className="hidden md:inline uppercase font-bold">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Global Glass Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-slate-400">
            <Search size={18} />
          </span>
          <input
            id="global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tutoriais, manuais de operação ou procedimentos..."
            className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-white text-sm pl-12 pr-24 py-3.5 rounded-full outline-none focus:border-red-500/50 transition-all font-sans shadow-lg shadow-black/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 text-xs text-slate-400 hover:text-red-400 font-mono uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 text-red-300 text-xs rounded-2xl flex items-start gap-3 backdrop-blur-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold font-mono uppercase">Erro de Conectividade</p>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Sincronizando enciclopédia...</span>
        </div>
      ) : (
        <>
          {/* Categories Grid */}
          {!selectedCategoryId && !searchQuery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-sm font-mono text-red-400 uppercase tracking-widest font-bold flex items-center gap-2">
                  <Layers size={17} />
                  Categorias de Equipamentos
                </h2>
                <span className="text-xs text-slate-400 font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full">{categories.length} Categorias</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map((cat, idx) => (
                  <div key={cat.id} ref={el => cardsRef.current[idx] = el} className="opacity-0">
                    <CategoryCard
                      category={cat}
                      count={getCategoryArticleCount(cat.id)}
                      onClick={() => setSelectedCategoryId(cat.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles list section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={17} className="text-red-400" />
                <h2 className="text-sm font-mono text-red-400 uppercase tracking-widest font-bold">
                  {selectedCategoryId 
                    ? `Categoria: ${categories.find(c => c.id === selectedCategoryId)?.name || 'Categoria'}`
                    : searchQuery 
                      ? `Resultados para: "${searchQuery}"` 
                      : 'Tutoriais de Frota'}
                </h2>
              </div>

              {selectedCategoryId && (
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-xs text-slate-300 hover:text-red-400 font-mono uppercase tracking-wider flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1 rounded-full"
                >
                  <span>Ver todas as categorias</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            {filteredArticles.length === 0 ? (
              <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-12 rounded-3xl text-center space-y-2">
                <AlertCircle size={32} className="mx-auto text-slate-400 mb-2" />
                <h3 className="text-base font-semibold text-white">Nenhum tutorial localizado</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Não encontramos artigos correspondentes aos filtros selecionados. Tente buscar por outros termos técnicos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((art) => (
                  <motion.div
                    key={art.id}
                    whileHover={{ y: -2 }}
                    onClick={() => onSelectArticle(art)}
                    className="p-5 bg-slate-900/50 backdrop-blur-md border border-white/10 border-l-4 border-l-red-500 rounded-2xl cursor-pointer flex flex-col justify-between group transition-all shadow-md hover:shadow-red-950/20 hover:bg-slate-800/60"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono text-red-400 bg-red-950/30 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                          {art.category?.name || 'Wiki'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                          <Eye size={12} />
                          <span>{art.viewCount}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white mt-3 group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>

                      {searchQuery.trim() && getSnippet(art.contentMarkdown, searchQuery) && (
                        <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 font-sans bg-white/5 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                          <span className="text-red-400 font-mono font-bold text-[10px] uppercase block mb-0.5">Trecho encontrado:</span>
                          "{getSnippet(art.contentMarkdown, searchQuery)}"
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400 group-hover:text-white">
                      <span className="truncate">Ler tutorial completo</span>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-red-400 shrink-0 transition-transform group-hover:translate-x-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
