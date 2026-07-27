import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Plus, Edit2, Trash2, BookOpen, FileText, AlertCircle, Check, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard({ onSelectArticle, onBack, onCategoriesUpdated }) {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [activeSubTab, setActiveSubTab] = useState('articles'); // 'articles' | 'categories'
  
  // Article Form State
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCategory, setArticleCategory] = useState('');
  const [articleVideo, setArticleVideo] = useState('');
  const [articleDownload, setArticleDownload] = useState('');
  const [showArticleForm, setShowArticleForm] = useState(false);

  // Category Form State
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('BookOpen');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const availableIcons = ['BookOpen', 'Shield', 'Cpu', 'Wrench', 'FileText', 'AlertTriangle', 'TrendingUp', 'Download'];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catsRes, artsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/articles')
      ]);
      setCategories(catsRes.data.data.categories || []);
      setArticles(artsRes.data.data.articles || []);
    } catch (err) {
      setError('Erro ao carregar dados do painel administrativo. Conecte-se à internet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdateArticle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!articleTitle || !articleContent || !articleCategory) {
      setError('Por favor preencha todos os campos obrigatórios (*).');
      return;
    }

    try {
      const payload = {
        title: articleTitle,
        contentMarkdown: articleContent,
        categoryId: articleCategory,
        videoUrl: articleVideo || undefined,
        fileDownloadUrl: articleDownload || undefined
      };

      if (editingArticleId) {
        await api.put(`/articles/${editingArticleId}`, payload);
        setSuccess('Artigo atualizado com sucesso!');
      } else {
        await api.post('/articles', payload);
        setSuccess('Artigo criado com sucesso!');
      }

      resetArticleForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao salvar o artigo.');
    }
  };

  const handleEditArticle = (art) => {
    setEditingArticleId(art.id);
    setArticleTitle(art.title);
    setArticleContent(art.contentMarkdown);
    setArticleCategory(art.categoryId);
    setArticleVideo(art.videoUrl || '');
    setArticleDownload(art.fileDownloadUrl || '');
    setShowArticleForm(true);
    window.scrollTo(0, 0);
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este artigo?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/articles/${id}`);
      setSuccess('Artigo excluído.');
      fetchData();
    } catch (err) {
      setError('Falha ao excluir o artigo.');
    }
  };

  const resetArticleForm = () => {
    setEditingArticleId(null);
    setArticleTitle('');
    setArticleContent('');
    setArticleCategory('');
    setArticleVideo('');
    setArticleDownload('');
    setShowArticleForm(false);
  };

  const handleCreateOrUpdateCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!categoryName) {
      setError('Por favor insira o nome da categoria.');
      return;
    }

    try {
      const payload = {
        name: categoryName,
        description: categoryDesc || undefined,
        iconName: categoryIcon
      };

      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, payload);
        setSuccess('Categoria atualizada!');
      } else {
        await api.post('/categories', payload);
        setSuccess('Categoria criada!');
      }

      resetCategoryForm();
      fetchData();
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao salvar categoria.');
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setCategoryIcon(cat.iconName);
    setShowCategoryForm(true);
    window.scrollTo(0, 0);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Excluir esta categoria deletará todos os seus artigos vinculados. Deseja prosseguir?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/categories/${id}`);
      setSuccess('Categoria e artigos relacionados removidos.');
      fetchData();
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      setError('Falha ao deletar categoria.');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryDesc('');
    setCategoryIcon('BookOpen');
    setShowCategoryForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl text-white font-display font-black tracking-wide uppercase flex items-center gap-2.5">
            <Shield size={24} className="text-red-400" />
            Painel de Administração
          </h1>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">
            Gestão de tutoriais técnicos e categorias de equipamentos
          </p>
        </div>

        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs font-mono text-slate-300 hover:text-white hover:border-red-500/40 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>VOLTAR PARA WIKI</span>
        </motion.button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-2xl flex items-start gap-3 backdrop-blur-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl flex items-start gap-3 backdrop-blur-md">
          <Check size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Forms */}
      {showArticleForm && (
        <div className="p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl space-y-5 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-base font-mono text-red-400 font-bold uppercase">
              {editingArticleId ? 'Editar Tutorial' : 'Criar Novo Tutorial'}
            </h3>
            <button onClick={resetArticleForm} className="text-xs text-slate-400 hover:text-white font-mono uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreateOrUpdateArticle} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Título do Tutorial *
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Ex: Instalação física do Rastreador Maxtrack MXT-142"
                  className="w-full bg-slate-800/60 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-red-500 font-sans"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Categoria Vinculada *
                </label>
                <select
                  value={articleCategory}
                  onChange={(e) => setArticleCategory(e.target.value)}
                  className="w-full bg-slate-800/60 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-red-500 font-sans"
                  required
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                Conteúdo Markdown *
              </label>
              <textarea
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                placeholder="Insira as instruções em Markdown..."
                rows={10}
                className="w-full bg-slate-800/60 border border-white/10 text-white text-xs p-4 rounded-xl outline-none focus:border-red-500 font-mono leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  URL de Vídeo Demonstrativo (Opcional)
                </label>
                <input
                  type="url"
                  value={articleVideo}
                  onChange={(e) => setArticleVideo(e.target.value)}
                  placeholder="Ex: https://youtube.com/watch?v=..."
                  className="w-full bg-slate-800/60 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-red-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  URL para Download do Manual PDF (Opcional)
                </label>
                <input
                  type="url"
                  value={articleDownload}
                  onChange={(e) => setArticleDownload(e.target.value)}
                  placeholder="Ex: https://site.com/esquema.pdf"
                  className="w-full bg-slate-800/60 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-red-500 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-mono text-xs uppercase tracking-wider font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-red-950/30 cursor-pointer"
            >
              {editingArticleId ? 'Salvar Alterações' : 'Publicar Tutorial'}
            </button>
          </form>
        </div>
      )}

      {showCategoryForm && (
        <div className="p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl space-y-5 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-base font-mono text-red-400 font-bold uppercase">
              {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <button onClick={resetCategoryForm} className="text-xs text-slate-400 hover:text-white font-mono uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreateOrUpdateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Telemetria Avançada"
                  className="w-full bg-slate-800/60 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-red-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Ícone Representativo
                </label>
                <select
                  value={categoryIcon}
                  onChange={(e) => setCategoryIcon(e.target.value)}
                  className="w-full bg-slate-800/60 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-red-500 font-mono"
                >
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={categoryDesc}
                onChange={(e) => setCategoryDesc(e.target.value)}
                placeholder="Ex: Instruções para instalação física..."
                className="w-full bg-slate-800/60 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-red-500 font-sans"
              />
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-mono text-xs uppercase tracking-wider font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-red-950/30 cursor-pointer"
            >
              {editingCategoryId ? 'Salvar Categoria' : 'Criar Categoria'}
            </button>
          </form>
        </div>
      )}

      {/* Main Table Interface */}
      {!showArticleForm && !showCategoryForm && (
        <div className="space-y-6">
          <div className="flex border-b border-white/10 gap-4">
            <button
              onClick={() => setActiveSubTab('articles')}
              className={`py-3 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all ${
                activeSubTab === 'articles' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Gerenciar Tutoriais ({articles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`py-3 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all ${
                activeSubTab === 'categories' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Gerenciar Categorias ({categories.length})
            </button>
          </div>

          {activeSubTab === 'articles' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">LISTAGEM DE TUTORIAIS CADASTRADOS</span>
                <button
                  onClick={() => setShowArticleForm(true)}
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-red-950/30 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Novo Tutorial
                </button>
              </div>

              {loading ? (
                <div className="py-16 flex justify-center"><div className="h-6 w-6 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.map(art => (
                    <div key={art.id} className="p-5 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                      <div className="min-w-0 flex-1 pr-4">
                        <span className="text-[9px] font-mono text-red-400 bg-red-950/30 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase">
                          {art.category?.name}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-2 truncate group-hover:text-red-400 transition-colors">
                          {art.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditArticle(art)}
                          className="p-2 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-white rounded-xl bg-white/5 transition-colors"
                          title="Editar Artigo"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          className="p-2 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-xl bg-white/5 transition-colors"
                          title="Excluir Artigo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">LISTAGEM DE CATEGORIAS</span>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-red-950/30 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Nova Categoria
                </button>
              </div>

              {loading ? (
                <div className="py-16 flex justify-center"><div className="h-6 w-6 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-5 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between">
                      <div className="flex-1 truncate pr-4">
                        <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Ícone: {cat.iconName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="p-2 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-white rounded-xl bg-white/5 transition-colors"
                          title="Editar Categoria"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-xl bg-white/5 transition-colors"
                          title="Excluir Categoria"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
