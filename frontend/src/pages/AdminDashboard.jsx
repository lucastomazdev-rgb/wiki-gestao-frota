import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/ui/Skeleton';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Plus, Edit2, Trash2, BookOpen, FileText, AlertCircle, Check, ArrowLeft, Shield, HelpCircle, Sparkles, ChevronDown, ChevronUp, Book, Users, UserPlus, ShieldCheck, UserCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard({ onSelectArticle, onBack, onCategoriesUpdated }) {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Confirmation Modal State for Irreversible Deletion
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '', // 'article' | 'category' | 'user'
    id: null,
    title: '',
    loading: false,
  });
  
  const [activeSubTab, setActiveSubTab] = useState('articles'); // 'articles' | 'categories' | 'users' | 'guide'
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(true);



  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('USER');
  const [userCanAccessSolar, setUserCanAccessSolar] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.users || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const handleToggleGestaoSolar = async (userId, currentVal) => {
    try {
      const newVal = !currentVal;
      await api.patch(`/users/${userId}/gestao-solar`, { can_access_gestao_solar: newVal });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_access_gestao_solar: newVal } : u));
      toast.success('Permissão de Gestão Solar atualizada!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar permissão.');
    }
  };
  
  // Article Form State
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCategory, setArticleCategory] = useState('');
  const [articleVideo, setArticleVideo] = useState('');
  const [articleDownload, setArticleDownload] = useState('');
  const [showArticleForm, setShowArticleForm] = useState(false);

  const insertMarkdownSnippet = (snippet) => {
    setArticleContent((prev) => {
      if (!prev) return snippet;
      return `${prev}\n\n${snippet}`;
    });
    setShowArticleForm(true);
  };

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
    fetchUsers();
  }, []);

  const handleOpenNewUserModal = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('USER');
    setUserCanAccessSolar(false);
    setShowUserModal(true);
  };

  const handleEditUser = (u) => {
    setEditingUserId(u.id);
    setUserName(u.name || '');
    setUserEmail(u.email || '');
    setUserPassword('');
    setUserRole(u.role || 'USER');
    setUserCanAccessSolar(Boolean(u.can_access_gestao_solar));
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('USER');
    setUserCanAccessSolar(false);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('Preencha nome e e-mail.', 'Formulário Incompleto');
      return;
    }
    if (!editingUserId && !userPassword) {
      toast.error('Preencha a senha para cadastrar um novo usuário.', 'Formulário Incompleto');
      return;
    }

    setUserSubmitting(true);
    try {
      if (editingUserId) {
        const payload = {
          name: userName.trim(),
          email: userEmail.trim(),
          role: userRole,
          can_access_gestao_solar: userCanAccessSolar,
        };
        if (userPassword && userPassword.trim().length > 0) {
          payload.password = userPassword.trim();
        }

        await api.put(`/users/${editingUserId}`, payload);
        toast.success(`Cadastro do usuário "${userName}" atualizado com sucesso!`, 'Usuário Atualizado');
      } else {
        await api.post('/auth/register', {
          name: userName.trim(),
          email: userEmail.trim(),
          password: userPassword,
          role: userRole,
          can_access_gestao_solar: userCanAccessSolar
        });
        toast.success(`Usuário "${userName}" cadastrado com sucesso!`, 'Novo Usuário');
      }
      handleCloseUserModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao salvar usuário.', 'Erro');
    } finally {
      setUserSubmitting(false);
    }
  };

  const openDeleteModal = (type, id, title) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      title,
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: '', id: null, title: '', loading: false });
  };

  const executeConfirmDelete = async () => {
    const { type, id, title } = deleteModal;
    if (!id || !type) return;

    setDeleteModal((prev) => ({ ...prev, loading: true }));

    try {
      if (type === 'user') {
        await api.delete(`/users/${id}`);
        toast.success(`Usuário "${title}" foi removido com sucesso.`, 'Exclusão Concluída');
        fetchUsers();
      } else if (type === 'article') {
        await api.delete(`/articles/${id}`);
        toast.success(`Tutorial "${title}" excluído com sucesso.`, 'Exclusão Concluída');
        fetchData();
      } else if (type === 'category') {
        await api.delete(`/categories/${id}`);
        toast.success(`Categoria "${title}" e seus dados vinculados foram removidos.`, 'Exclusão Concluída');
        fetchData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      }
      closeDeleteModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao processar exclusão no servidor.', 'Erro na Exclusão');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteUser = (id, name) => {
    openDeleteModal('user', id, name);
  };

  const handleCreateOrUpdateArticle = async (e) => {
    e.preventDefault();
    
    if (!articleTitle || !articleContent || !articleCategory) {
      toast.error('Por favor preencha todos os campos obrigatórios (*).', 'Campos Pendentes');
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
        toast.update('Artigo atualizado com sucesso!', 'Edição Concluída');
      } else {
        await api.post('/articles', payload);
        toast.success('Artigo criado com sucesso!', 'Novo Artigo');
      }

      resetArticleForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao salvar o artigo.', 'Erro de Salvamento');
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

  const handleDeleteArticle = (id, title) => {
    openDeleteModal('article', id, title);
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

    if (!categoryName) {
      toast.error('Por favor insira o nome da categoria.', 'Campo Obrigatório');
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
        toast.update('Categoria atualizada com sucesso!', 'Categoria Editada');
      } else {
        await api.post('/categories', payload);
        toast.success('Categoria criada com sucesso!', 'Nova Categoria');
      }

      resetCategoryForm();
      fetchData();
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao salvar categoria.', 'Erro de Salvamento');
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

  const handleDeleteCategory = (id, name) => {
    openDeleteModal('category', id, name);
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
          <h1 className="text-2xl text-white font-sans font-bold tracking-tight flex items-center gap-2.5">
            <Shield size={24} className="text-amber-400" />
            Painel de Administração
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Gestão de tutoriais técnicos e categorias de equipamentos
          </p>
        </div>

        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs font-sans text-slate-300 hover:text-white hover:border-amber-500/40 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} />
          <span className="font-medium">Voltar para Wiki</span>
        </motion.button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-2xl flex items-start gap-3 backdrop-blur-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-400" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-2xl flex items-start gap-3 backdrop-blur-md">
          <Check size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Forms */}
      {showArticleForm && (
        <div className="p-6 sm:p-8 bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-base font-sans text-amber-400 font-bold">
              {editingArticleId ? 'Editar Tutorial' : 'Criar Novo Tutorial'}
            </h3>
            <button onClick={resetArticleForm} className="text-xs text-slate-400 hover:text-white font-sans bg-white/5 border border-white/10 px-3 py-1 rounded-full cursor-pointer transition-colors">
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreateOrUpdateArticle} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans text-slate-300 mb-1 font-medium">
                  Título do Tutorial *
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Ex: Guia de operação da frota e manutenção"
                  className="w-full bg-slate-800/70 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-sans text-slate-300 mb-1 font-medium">
                  Categoria Vinculada *
                </label>
                <select
                  value={articleCategory}
                  onChange={(e) => setArticleCategory(e.target.value)}
                  className="w-full bg-slate-800/70 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-amber-500/50 font-sans"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-sans text-slate-300 font-medium">
                  Conteúdo Markdown *
                </label>
                <button
                  type="button"
                  onClick={() => setShowMarkdownGuide(!showMarkdownGuide)}
                  className="text-xs font-sans text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full transition-all cursor-pointer font-medium"
                >
                  <Sparkles size={13} />
                  <span>{showMarkdownGuide ? 'Ocultar Guia de Formatação' : 'Ver Guia de Formatação (Markdown)'}</span>
                  {showMarkdownGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {showMarkdownGuide && (
                <div className="mb-4 p-4 bg-slate-800/90 border border-amber-500/20 rounded-2xl space-y-3 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-sans text-amber-400 font-semibold flex items-center gap-2">
                      <HelpCircle size={15} /> Como estruturar uma postagem bonita e profissional:
                    </span>
                    <span className="text-[11px] font-sans text-slate-400 hidden sm:inline">Clique nos exemplos abaixo para inserir no artigo</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {/* Item 1 */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-sans text-amber-400 font-semibold text-xs block">1. Títulos e Seções</span>
                        <p className="text-[11px] text-slate-300 mt-1">Use <code className="text-amber-300">##</code> para seções e <code className="text-amber-300">###</code> para sub-tópicos.</p>
                        <code className="block bg-black/50 p-2 rounded text-[11px] font-mono text-slate-300 mt-1.5">
                          ## 1. Visão Geral<br />
                          ### 1.1 Requisitos
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet('## 1. Visão Geral da Operação\n\nDescreva os detalhes principais aqui...\n\n### 1.1 Ferramentas Necessárias\n- Item 1\n- Item 2')}
                        className="text-[11px] font-sans text-amber-400 hover:underline text-left pt-1 cursor-pointer font-medium"
                      >
                        + Inserir Estrutura de Títulos
                      </button>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-sans text-amber-400 font-semibold text-xs block">2. Negrito & Destaques</span>
                        <p className="text-[11px] text-slate-300 mt-1">Use <code className="text-amber-300">**texto**</code> para destacar palavras-chave essenciais.</p>
                        <code className="block bg-black/50 p-2 rounded text-[11px] font-mono text-slate-300 mt-1.5">
                          **Passo Crítico:** Tensão de **12V**.
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet('**IMPORTANTE:** Certifique-se de que a **ignição** esteja desligada antes de iniciar.')}
                        className="text-[11px] font-sans text-amber-400 hover:underline text-left pt-1 cursor-pointer font-medium"
                      >
                        + Inserir Exemplo Negrito
                      </button>
                    </div>

                    {/* Item 3 */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-sans text-amber-400 font-semibold text-xs block">3. Listas e Passos</span>
                        <p className="text-[11px] text-slate-300 mt-1">Use numeração <code className="text-amber-300">1. 2. 3.</code> para instruções ordenadas.</p>
                        <code className="block bg-black/50 p-2 rounded text-[11px] font-mono text-slate-300 mt-1.5">
                          1. Desligar a bateria<br />
                          2. Conectar o rastreador
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet('### Passos de Instalação:\n1. Desligar a chave geral do veículo.\n2. Conectar o chicote de alimentação principal.\n3. Realizar o teste de sinal.')}
                        className="text-[11px] font-sans text-amber-400 hover:underline text-left pt-1 cursor-pointer font-medium"
                      >
                        + Inserir Passo a Passo
                      </button>
                    </div>

                    {/* Item 4 */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-sans text-amber-400 font-semibold text-xs block">4. Caixas de Aviso</span>
                        <p className="text-[11px] text-slate-300 mt-1">Use <code className="text-amber-300">&gt;</code> para criar blocos de alerta sobressalentes.</p>
                        <code className="block bg-black/50 p-2 rounded text-[11px] font-mono text-slate-300 mt-1.5">
                          &gt; ⚠️ **ATENÇÃO:** Perigo de curto!
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet('> ⚠️ **AVISO DE SEGURANÇA:**\n> Nunca efetue emendas sem utilizar fita termo retrátil ou isolante de alta fusão.')}
                        className="text-[11px] font-sans text-amber-400 hover:underline text-left pt-1 cursor-pointer font-medium"
                      >
                        + Inserir Caixa de Alerta
                      </button>
                    </div>

                    {/* Item 5 */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-sans text-amber-400 font-semibold text-xs block">5. Comandos & SMS</span>
                        <p className="text-[11px] text-slate-300 mt-1">Use <code className="text-amber-300">```</code> para comandos de configuração técnicos.</p>
                        <code className="block bg-black/50 p-2 rounded text-[11px] font-mono text-slate-300 mt-1.5">
                          ```<br />
                          SETIP 192.168.1.1 5000<br />
                          ```
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet('```\nComando SMS: SETIP 10.0.0.1 8080\nResposta Esperada: OK SETIP\n```')}
                        className="text-[11px] font-sans text-amber-400 hover:underline text-left pt-1 cursor-pointer font-medium"
                      >
                        + Inserir Bloco de Código
                      </button>
                    </div>

                    {/* Item 6 */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-sans text-amber-400 font-semibold text-xs block">6. Tabelas de Fiação</span>
                        <p className="text-[11px] text-slate-300 mt-1">Organize pinos e cores de fios em tabelas limpas.</p>
                        <code className="block bg-black/50 p-2 rounded text-[11px] font-mono text-slate-300 mt-1.5">
                          | Sinal | Cor | Volts |<br />
                          | --- | --- | --- |<br />
                          | Pós-Chave | Laranja | +12V |
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet('| Sinal | Cor do Fio | Tensão | Observação |\n| --- | --- | --- | --- |\n| Positivo (+) | Vermelho | 12V/24V | Direto da Bateria |\n| Pós-Chave (IGN) | Laranja | 12V | Ativo na Chave |\n| Linha Can (H) | Amarelo | 2.5V | Tráfego de Dados |')}
                        className="text-[11px] font-sans text-amber-400 hover:underline text-left pt-1 cursor-pointer font-medium"
                      >
                        + Inserir Tabela de Fiação
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <textarea
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                placeholder="Insira as instruções em Markdown... Ex: ## 1. Visão Geral da Operação..."
                rows={12}
                className="w-full bg-slate-800/70 border border-white/10 text-white text-xs p-4 rounded-xl outline-none focus:border-amber-500/50 font-mono leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans text-slate-300 mb-1 font-medium">
                  URL de Vídeo Demonstrativo (Opcional)
                </label>
                <input
                  type="url"
                  value={articleVideo}
                  onChange={(e) => setArticleVideo(e.target.value)}
                  placeholder="Ex: https://youtube.com/watch?v=..."
                  className="w-full bg-slate-800/70 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-300 mb-1 font-medium">
                  URL para Download do Manual PDF (Opcional)
                </label>
                <input
                  type="url"
                  value={articleDownload}
                  onChange={(e) => setArticleDownload(e.target.value)}
                  placeholder="Ex: https://site.com/esquema.pdf"
                  className="w-full bg-slate-800/70 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans text-xs font-semibold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-amber-950/20 cursor-pointer"
            >
              {editingArticleId ? 'Salvar Alterações' : 'Publicar Tutorial'}
            </button>
          </form>
        </div>
      )}

      {showCategoryForm && (
        <div className="p-6 sm:p-8 bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-base font-sans text-amber-400 font-bold">
              {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <button onClick={resetCategoryForm} className="text-xs text-slate-400 hover:text-white font-sans bg-white/5 border border-white/10 px-3 py-1 rounded-full cursor-pointer transition-colors">
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreateOrUpdateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans text-slate-300 mb-1 font-medium">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Telemetria Avançada"
                  className="w-full bg-slate-800/70 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-300 mb-1 font-medium">
                  Ícone Representativo
                </label>
                <select
                  value={categoryIcon}
                  onChange={(e) => setCategoryIcon(e.target.value)}
                  className="w-full bg-slate-800/70 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                >
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-slate-300 mb-1 font-medium">
                Descrição
              </label>
              <input
                type="text"
                value={categoryDesc}
                onChange={(e) => setCategoryDesc(e.target.value)}
                placeholder="Ex: Instruções para instalação física..."
                className="w-full bg-slate-800/70 border border-white/10 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-amber-500/50 font-sans"
              />
            </div>

            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans text-xs font-semibold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-amber-950/20 cursor-pointer"
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
              className={`py-3 font-sans text-xs border-b-2 font-medium transition-all cursor-pointer ${
                activeSubTab === 'articles' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Gerenciar Tutoriais ({articles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`py-3 font-sans text-xs border-b-2 font-medium transition-all cursor-pointer ${
                activeSubTab === 'categories' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Gerenciar Categorias ({categories.length})
            </button>
            <button
              onClick={() => setActiveSubTab('users')}
              className={`py-3 font-sans text-xs border-b-2 font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'users' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} /> Gerenciar Usuários ({users.length})
            </button>
            <button
              onClick={() => setActiveSubTab('guide')}
              className={`py-3 font-sans text-xs border-b-2 font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'guide' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} /> Guia de Formatação (Markdown)
            </button>
          </div>

          {activeSubTab === 'articles' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-slate-400 font-medium">Listagem de tutoriais cadastrados</span>
                <button
                  onClick={() => setShowArticleForm(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-sans font-semibold flex items-center gap-2 shadow-md shadow-amber-950/20 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Novo Tutorial
                </button>
              </div>

              {loading ? (
                <TableSkeleton rows={4} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.map(art => (
                    <div key={art.id} className="p-5 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between group hover:border-amber-500/40 transition-all">
                      <div className="min-w-0 flex-1 pr-4">
                        <span className="text-[11px] font-sans text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
                          {art.category?.name}
                        </span>
                        <h4 className="text-sm font-semibold text-white mt-2 truncate group-hover:text-amber-400 transition-colors">
                          {art.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditArticle(art)}
                          className="p-2 border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-white rounded-xl bg-white/5 transition-colors cursor-pointer"
                          title="Editar Artigo"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(art.id, art.title)}
                          className="p-2 border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 rounded-xl bg-white/5 transition-colors cursor-pointer"
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
          )}

          {activeSubTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-slate-400 font-medium">Listagem de categorias</span>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-sans font-semibold flex items-center gap-2 shadow-md shadow-amber-950/20 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Nova Categoria
                </button>
              </div>

              {loading ? (
                <TableSkeleton rows={4} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-5 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between hover:border-amber-500/40 transition-all">
                      <div className="flex-1 truncate pr-4">
                        <h4 className="text-sm font-semibold text-white">{cat.name}</h4>
                        <span className="text-[11px] font-sans text-slate-400">Ícone: {cat.iconName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="p-2 border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-white rounded-xl bg-white/5 transition-colors cursor-pointer"
                          title="Editar Categoria"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-2 border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 rounded-xl bg-white/5 transition-colors cursor-pointer"
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

          {activeSubTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-slate-400 font-medium">Gestão de usuários e técnicos cadastrados</span>
                <button
                  type="button"
                  onClick={handleOpenNewUserModal}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-sans font-semibold flex items-center gap-2 shadow-md shadow-amber-950/20 transition-all cursor-pointer"
                >
                  <UserPlus size={16} /> Novo Usuário
                </button>
              </div>

              {/* Users List Table */}
              <div className="bg-slate-900/70 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-sans font-semibold text-slate-300">
                      <th className="py-3.5 px-6">Nome</th>
                      <th className="py-3.5 px-6">E-mail</th>
                      <th className="py-3.5 px-6">Nível de Acesso</th>
                      <th className="py-3.5 px-6 text-center">Gestão Solar</th>
                      <th className="py-3.5 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-sans text-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-6 font-medium text-white flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-sans font-bold text-amber-400">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3.5 px-6 text-xs text-slate-300">{u.email}</td>
                        <td className="py-3.5 px-6 text-xs">
                          {u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-[11px]">
                              <ShieldCheck size={12} /> ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300 font-semibold text-[11px]">
                              <UserCheck size={12} /> TÉCNICO
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleGestaoSolar(u.id, u.can_access_gestao_solar)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              u.role === 'ADMIN' || u.can_access_gestao_solar
                                ? 'bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/25'
                                : 'bg-slate-800 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                            title={u.role === 'ADMIN' ? 'Administrador possui acesso permanente' : 'Clique para alternar permissão de Gestão Solar'}
                          >
                            <span className={`w-2 h-2 rounded-full ${u.role === 'ADMIN' || u.can_access_gestao_solar ? 'bg-teal-400' : 'bg-slate-500'}`} />
                            <span>{u.role === 'ADMIN' || u.can_access_gestao_solar ? 'Liberado' : 'Bloqueado'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditUser(u)}
                              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Alterar Cadastro do Usuário"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Usuário"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'guide' && (
            <div className="p-6 bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-sans text-amber-400 font-bold flex items-center gap-2">
                    <Sparkles size={18} /> Manual de Formatação de Postagens (Markdown)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Utilize este guia rápido para formatar manuais, esquemas elétricos e procedimentos de frota com excelente legibilidade.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowArticleForm(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-sans font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/20"
                >
                  <Plus size={15} /> Criar Postagem
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                <div className="p-4 bg-slate-800/60 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-sans text-amber-400 font-bold">1. Títulos e Subtítulos</h4>
                  <p>Inicie a linha com <code className="text-amber-300">##</code> para criar seções numeradas ou temáticas.</p>
                  <pre className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto">
{`## 1. Introdução ao Procedimento
### 1.1 Ferramentas Necessárias`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('## 1. Visão Geral da Operação\n\nDescreva os detalhes principais aqui...')}
                    className="text-xs font-sans text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    + Usar este modelo no novo tutorial
                  </button>
                </div>

                <div className="p-4 bg-slate-800/60 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-sans text-amber-400 font-bold">2. Destaques em Negrito</h4>
                  <p>Envolva os termos essenciais entre <code className="text-amber-300">**duplos asteriscos**</code> para facilitar a leitura dinâmica.</p>
                  <pre className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto">
{`**AVISO:** Verificar se o **chicote principal** está desenergizado.`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('**IMPORTANTE:** Certifique-se de que a **ignição** esteja desligada antes de iniciar.')}
                    className="text-xs font-sans text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    + Usar este modelo no novo tutorial
                  </button>
                </div>

                <div className="p-4 bg-slate-800/60 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-sans text-amber-400 font-bold">3. Listas Numéricas (Passos)</h4>
                  <p>Para instruções sequenciais de montagem ou teste, utilize números seguidos de ponto <code className="text-amber-300">1. 2. 3.</code>.</p>
                  <pre className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto">
{`1. Retirar o painel frontal
2. Identificar os fios pós-chave (12V)
3. Conectar os conectores selados`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('### Passos de Instalação:\n1. Desligar a chave geral do veículo.\n2. Conectar o chicote de alimentação principal.\n3. Realizar o teste de sinal.')}
                    className="text-xs font-sans text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    + Usar este modelo no novo tutorial
                  </button>
                </div>

                <div className="p-4 bg-slate-800/60 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-sans text-amber-400 font-bold">4. Blocos de Aviso / Alerta</h4>
                  <p>Coloque o símbolo <code className="text-amber-300">&gt;</code> no início da linha para destacar regras de segurança da frota.</p>
                  <pre className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto">
{`> ⚠️ **PROCEDIMENTO CRÍTICO:**
> Não cortar a fiação original do veículo em hipótese alguma.`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('> ⚠️ **AVISO DE SEGURANÇA:**\n> Nunca efetue emendas sem utilizar fita termo retrátil ou isolante de alta fusão.')}
                    className="text-xs font-sans text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    + Usar este modelo no novo tutorial
                  </button>
                </div>

                <div className="p-4 bg-slate-800/60 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-sans text-amber-400 font-bold">5. Comandos Técnicos e Parâmetros</h4>
                  <p>Envolva trechos de comandos SMS ou parâmetros de rastreadores entre crases triplas <code className="text-amber-300">```</code>.</p>
                  <pre className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto">
{`\`\`\`
SMS: SETIP 192.168.1.1 5000
RESPOSTA: SETIP OK
\`\`\``}
                  </pre>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('```\nComando SMS: SETIP 10.0.0.1 8080\nResposta Esperada: OK SETIP\n```')}
                    className="text-xs font-sans text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    + Usar este modelo no novo tutorial
                  </button>
                </div>

                <div className="p-4 bg-slate-800/60 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-sans text-amber-400 font-bold">6. Tabela de Fiação e Sinais</h4>
                  <p>Organize cores de fios e tensões utilizando a sintaxe de tabelas Markdown.</p>
                  <pre className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto">
{`| Sinal | Cor do Fio | Tensão |
| --- | --- | --- |
| Positivo (+) | Vermelho | 12V/24V |
| Pós-Chave | Laranja | 12V |`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('| Sinal | Cor do Fio | Tensão | Observação |\n| --- | --- | --- | --- |\n| Positivo (+) | Vermelho | 12V/24V | Direto da Bateria |\n| Pós-Chave (IGN) | Laranja | 12V | Ativo na Chave |\n| Linha Can (H) | Amarelo | 2.5V | Tráfego de Dados |')}
                    className="text-xs font-sans text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    + Usar este modelo no novo tutorial
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Irreversible Actions */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        itemTitle={deleteModal.title}
        message="Deseja mesmo excluir? Essa ação é irreversível."
        loading={deleteModal.loading}
        onConfirm={executeConfirmDelete}
        onCancel={closeDeleteModal}
      />

      {/* Modal de Cadastro / Edição de Usuário */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-xl bg-slate-900/95 backdrop-blur-2xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] rounded-3xl p-6 sm:p-8 text-white space-y-5"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseUserModal}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3.5 border-b border-white/10 pb-4 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  {editingUserId ? <Edit2 size={22} /> : <UserPlus size={22} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans tracking-tight">
                    {editingUserId ? 'Alterar Cadastro do Usuário' : 'Cadastrar Novo Usuário / Técnico'}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    {editingUserId
                      ? 'Atualize as informações cadastrais, perfil de acesso e permissões'
                      : 'Cadastre um novo técnico ou administrador com acesso à plataforma'}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-sans text-slate-300 mb-1.5 font-medium">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ex: Carlos Andrade"
                      className="w-full bg-slate-800/80 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-sans text-slate-300 mb-1.5 font-medium">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="carlos@solar.com"
                      className="w-full bg-slate-800/80 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-slate-300 mb-1.5 font-medium">
                      {editingUserId ? 'Nova Senha (Opcional)' : 'Senha Inicial *'}
                    </label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder={editingUserId ? 'Deixar em branco para manter' : 'Mínimo 6 caracteres'}
                      className="w-full bg-slate-800/80 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50 font-sans"
                      required={!editingUserId}
                    />
                    {editingUserId && (
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Deixe em branco se não quiser alterar a senha.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-slate-300 mb-1.5 font-medium">
                      Nível de Acesso
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full bg-slate-800/80 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50 font-sans cursor-pointer"
                    >
                      <option value="USER">USER (Técnico / Consulta)</option>
                      <option value="ADMIN">ADMIN (Supervisor / Administrador)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-white/10">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-sans text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={userCanAccessSolar}
                        onChange={(e) => setUserCanAccessSolar(e.target.checked)}
                        className="w-4 h-4 rounded-md border-white/20 text-teal-500 focus:ring-teal-500/20 bg-slate-800 cursor-pointer"
                      />
                      <span>
                        Liberar acesso ao módulo <strong className="text-teal-400 font-semibold">Gestão Solar</strong> (Monitoramento de Frota)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCloseUserModal}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={userSubmitting}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans text-xs font-semibold rounded-xl transition-all shadow-md shadow-amber-950/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {userSubmitting ? (
                      <span>Salvando...</span>
                    ) : (
                      <span>{editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

