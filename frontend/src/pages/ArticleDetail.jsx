import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import { ArrowLeft, Video, Download, Eye, Calendar, AlertCircle, List, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ArticleSkeleton } from '../components/ui/Skeleton';
import ScrollToTop from '../components/ui/ScrollToTop';

export default function ArticleDetail({ articleSlug, onBack }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [toc, setToc] = useState([]);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/articles/slug/${articleSlug}`);
        if (response.data.status === 'success') {
          const art = response.data.data.article;
          setArticle(art);
          
          const extractedImgs = extractImagesFromMarkdown(art.contentMarkdown);
          setImages(extractedImgs);

          const headings = extractHeadings(art.contentMarkdown);
          setToc(headings);
        }
      } catch (err) {
        setError('Falha ao sincronizar artigo. Verifique se o dispositivo está conectado à internet.');
      } finally {
        setLoading(false);
      }
    };

    if (articleSlug) {
      fetchArticle();
    }
  }, [articleSlug]);

  const extractImagesFromMarkdown = (markdown) => {
    if (!markdown) return [];
    const regex = /!\[.*?\]\((.*?)\)/g;
    const urls = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  };

  const extractHeadings = (markdown) => {
    if (!markdown) return [];
    const lines = markdown.split('\n');
    const list = [];
    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        list.push({ level: 1, text: line.replace('# ', '').trim() });
      } else if (line.startsWith('## ')) {
        list.push({ level: 2, text: line.replace('## ', '').trim() });
      } else if (line.startsWith('### ')) {
        list.push({ level: 3, text: line.replace('### ', '').trim() });
      }
    });
    return list;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const formatHTML = (markdown) => {
    if (!markdown) return '';
    const renderer = new marked.Renderer();
    
    renderer.link = function (token) {
      let href = '';
      let title = '';
      let text = '';

      if (typeof token === 'object' && token !== null) {
        href = token.href || '#';
        title = token.title || '';
        text = token.text || (token.tokens && this.parser ? this.parser.parseInline(token.tokens) : '') || token.raw || '';
      } else {
        href = arguments[0] || '#';
        title = arguments[1] || '';
        text = arguments[2] || '';
      }

      const titleAttr = title ? ` title="${title}"` : '';
      const isInternal = href.startsWith('#');
      const targetAttr = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
      
      return `<a href="${href}"${titleAttr}${targetAttr}>${text}</a>`;
    };

    renderer.heading = function (token) {
      let text = '';
      let level = 2;
      if (typeof token === 'object' && token !== null) {
        text = token.text || (token.tokens && this.parser ? this.parser.parseInline(token.tokens) : '') || '';
        level = token.depth || 2;
      } else {
        text = arguments[0] || '';
        level = arguments[1] || 2;
      }

      const rawSlug = text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-\u00C0-\u024F]+/g, '');
      return `<h${level} id="${rawSlug}">${text}</h${level}>`;
    };

    const rawMarkup = marked.parse(markdown, { renderer });
    return DOMPurify.sanitize(rawMarkup, { ADD_ATTR: ['target', 'id', 'class', 'style'] });
  };

  if (loading) {
    return <ArticleSkeleton />;
  }


  if (error || !article) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-2xl flex items-start gap-3 backdrop-blur-md">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold font-sans">Erro de Carregamento</p>
            <p className="mt-1 leading-relaxed">{error || 'Artigo não localizado.'}</p>
            <button
              onClick={onBack}
              className="mt-4 bg-white/5 border border-white/10 text-white hover:text-amber-400 font-sans text-xs font-medium px-4 py-2 rounded-full cursor-pointer transition-colors"
            >
              Voltar para Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const videoEmbed = getEmbedUrl(article.videoUrl);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs font-sans text-slate-300 hover:text-white hover:border-amber-500/40 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Voltar para Tutoriais</span>
        </motion.button>
        
        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1 rounded-full font-sans font-medium">
          {article.category?.name}
        </span>
      </div>

      {/* Main Document Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents Index (Desktop Sidebar) */}
        {toc.length > 0 && (
          <div className="hidden lg:block space-y-3 col-span-1">
            <div className="sticky top-24 bg-slate-900/70 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg">
              <h4 className="text-xs font-sans text-amber-400 font-semibold flex items-center gap-2 border-b border-white/10 pb-3">
                <List size={15} />
                Nesta Página
              </h4>
              <ul className="mt-3 space-y-2 text-xs font-sans text-slate-400">
                {toc.map((item, idx) => (
                  <li 
                    key={idx} 
                    className={`hover:text-white cursor-pointer transition-colors truncate ${
                      item.level === 2 ? 'pl-2 text-[11px]' : item.level === 3 ? 'pl-4 text-[10px]' : 'font-semibold text-slate-200'
                    }`}
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Article Body Container */}
        <article className={`space-y-6 bg-slate-900/70 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-xl ${
          toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'
        }`}>
          {/* Article Title & Metadata */}
          <div className="border-b border-white/10 pb-6">
            <h1 className="text-2xl sm:text-3xl text-white font-sans font-bold leading-tight tracking-tight">
              {article.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-sans text-slate-400">
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <Calendar size={13} className="text-amber-400" />
                Atualizado em {new Date(article.updatedAt).toLocaleDateString('pt-BR')}
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <Eye size={13} className="text-amber-400" />
                {article.viewCount} visualizações
              </span>
            </div>
          </div>

          {/* High Resolution Gallery */}
          {images.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-sans text-amber-400 font-semibold flex items-center gap-2">
                <CheckCircle size={15} />
                Galeria de Instalação Física & Esquemas
              </h3>
              <ImageCarousel images={images} />
            </div>
          )}

          {/* Markdown HTML */}
          <div 
            className="markdown-body text-base font-sans text-slate-200 leading-relaxed pt-2 max-w-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: formatHTML(article.contentMarkdown) }}
          />

          {/* Video Player */}
          {videoEmbed && (
            <div className="space-y-3 pt-6 border-t border-white/10">
              <h3 className="text-xs font-sans text-amber-400 font-semibold flex items-center gap-2">
                <Video size={16} />
                Vídeo Demonstrativo de Instalação
              </h3>
              <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-black rounded-2xl shadow-xl">
                <iframe
                  src={videoEmbed}
                  title="Tutorial em Vídeo"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Downloads Area */}
          {article.fileDownloadUrl && (
            <div className="space-y-3 pt-6 border-t border-white/10">
              <h3 className="text-xs font-sans text-amber-400 font-semibold flex items-center gap-2">
                <Download size={16} />
                Esquemas Elétricos & Manuais em PDF
              </h3>
              <motion.a
                whileHover={{ scale: 1.005 }}
                href={article.fileDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-white/5 border border-white/10 border-l-4 border-l-amber-500 rounded-2xl hover:bg-white/10 transition-all group shadow-md"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                    Fazer download do manual técnico em PDF
                  </p>
                  <p className="text-xs font-sans text-slate-400 mt-1">
                    Documento oficial Solar Coca-Cola
                  </p>
                </div>
                <Download size={20} className="text-slate-400 group-hover:text-amber-400 shrink-0 transition-transform group-hover:translate-y-0.5" />
              </motion.a>
            </div>
          )}
        </article>
      </div>

      {/* Floating Scroll To Top Button */}
      <ScrollToTop />
    </div>
  );
}
