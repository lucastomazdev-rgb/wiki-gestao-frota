import React, { useState, useMemo, useEffect } from 'react';
import { Users, Plus, Search, Download, FileText, Upload, Trash2, AlertTriangle, CheckCircle, Clock, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, Building2, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import useTecnicos from '../hooks/useTecnicos';
import { useAuth } from '../contexts/useAuth';
import SearchableSelect from './shared/SearchableSelect';
import toast from 'react-hot-toast';

const LABEL_TIPO = { ASO: 'ASO', CTPS: 'CTPS', FICHA_EPI: 'Ficha de EPI', NR01: 'NR-01', NR06: 'NR-06', PGR: 'PGR', PCMSO: 'PCMSO' };
const COR_URGENCIA = { vencido: 'bg-red-500', critico: 'bg-orange-500', alerta: 'bg-amber-400', info: 'bg-teal-400' };
const TEXTO_URGENCIA = { vencido: 'Vencido', critico: 'Crítico (3d)', alerta: 'Atenção (15d)', info: 'Próximo (30d)' };

function Badge({ urgencia }) {
  return (
    <span className={`${COR_URGENCIA[urgencia]} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
      {TEXTO_URGENCIA[urgencia]}
    </span>
  );
}

function StatusDot({ docs, tipo }) {
  const doc = docs?.find(d => d.tipo === tipo);
  if (!doc) return <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" title="Pendente" />;
  if (!doc.data_vencimento) return <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" title="Anexado" />;
  const dias = Math.ceil((new Date(doc.data_vencimento) - new Date()) / 86400000);
  if (dias <= 0) return <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" title="Vencido" />;
  if (dias <= 15) return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" title={`${dias}d restantes`} />;
  return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" title={`${dias}d restantes`} />;
}

function UploadField({ label, tipo, tecnicoId, onUpload, existingDoc, onDelete }) {
  const [file, setFile] = useState(null);
  const [emissao, setEmissao] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [uploading, setUploading] = useState(false);
  const temDatas = ['ASO', 'FICHA_EPI', 'PGR', 'PCMSO'].includes(tipo);

  const handleSubmit = async () => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. O limite é 5MB.');
      return;
    }
    setUploading(true);
    const ok = await onUpload(tecnicoId, tipo, file, emissao, vencimento);
    if (ok) { setFile(null); setEmissao(''); setVencimento(''); }
    setUploading(false);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</h4>
        {existingDoc && (
          <div className="flex items-center gap-1.5">
            <a href={existingDoc.arquivo_url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1">
              <Eye size={10} /> Ver
            </a>
            <button onClick={() => onDelete(existingDoc.id)}
              className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors">
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>

      {existingDoc && (
        <div className="mb-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
          <span className="font-semibold text-slate-600">{existingDoc.arquivo_nome}</span>
          {existingDoc.data_vencimento && (
            <span className="ml-2">• Vence: <span className="font-bold">{new Date(existingDoc.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span></span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-2 hover:border-teal-400 hover:bg-teal-50/30 transition-all">
          <Upload size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500 truncate flex-1">{file ? file.name : 'Selecionar arquivo (PDF, JPG, PNG)'}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
            onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
        </label>

        {file && (
          <>
            {file.size > 5 * 1024 * 1024 && (
              <div className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                <AlertTriangle size={12} /> Arquivo excede 5MB! Reduza o tamanho.
              </div>
            )}
            {temDatas && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Emissão</label>
                  <input type="date" value={emissao} onChange={e => setEmissao(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-teal-400 focus:border-teal-400 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Vencimento</label>
                  <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-teal-400 focus:border-teal-400 outline-none" />
                </div>
              </div>
            )}
            <button onClick={handleSubmit} disabled={uploading || file.size > 5 * 1024 * 1024}
              className="w-full text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5">
              {uploading ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : <Upload size={12} />}
              {uploading ? 'Enviando...' : existingDoc ? 'Substituir Documento' : 'Enviar Documento'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GestaoTecnicos() {
  const { isAdmin, hasPermission } = useAuth();
  const {
    tecnicos, grupos, docsGlobais, alertas, loading,
    salvarTecnico, excluirTecnico,
    uploadDocumento, excluirDocumento,
    uploadDocGlobal, excluirDocGlobal,
    baixarZip, TIPOS_DOC, TIPOS_GLOBAL,
  } = useTecnicos();

  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [tecnicoAberto, setTecnicoAberto] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [globalAberto, setGlobalAberto] = useState(false);
  const [alertasAberto, setAlertasAberto] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  // Form técnico
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formGrupo, setFormGrupo] = useState('');
  const [formTerceirizado, setFormTerceirizado] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const tecnicosFiltrados = useMemo(() => {
    return tecnicos.filter(t => {
      const matchBusca = !busca || t.nome.toLowerCase().includes(busca.toLowerCase());
      const matchGrupo = !filtroGrupo || String(t.grupo_id) === filtroGrupo;
      return matchBusca && matchGrupo;
    });
  }, [tecnicos, busca, filtroGrupo]);

  // Reset paginação quando filtro muda
  useEffect(() => {
    const timer = setTimeout(() => setPaginaAtual(1), 0);
    return () => clearTimeout(timer);
  }, [busca, filtroGrupo]);

  // Paginação
  const totalPaginas = Math.ceil(tecnicosFiltrados.length / ITENS_POR_PAGINA);
  const indexOfLastItem = paginaAtual * ITENS_POR_PAGINA;
  const indexOfFirstItem = indexOfLastItem - ITENS_POR_PAGINA;
  const tecnicosPaginados = tecnicosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  const getPaginasExibidas = () => {
    const total = totalPaginas;
    const atual = paginaAtual;
    const paginas = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i >= total - 2 || (i >= atual - 1 && i <= atual + 1)) {
        paginas.push(i);
      } else if (paginas[paginas.length - 1] !== '...') {
        paginas.push('...');
      }
    }
    return paginas;
  };

  const abrirModal = (tecnico = null) => {
    if (tecnico) {
      setEditandoId(tecnico.id);
      setFormNome(tecnico.nome);
      setFormCpf(tecnico.cpf || '');
      setFormTelefone(tecnico.telefone || '');
      setFormGrupo(tecnico.grupo_id ? String(tecnico.grupo_id) : '');
      setFormTerceirizado(!!tecnico.terceirizado);
    } else {
      setEditandoId(null);
      setFormNome(''); setFormCpf(''); setFormTelefone(''); setFormGrupo(''); setFormTerceirizado(false);
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    const ok = await salvarTecnico(
      { nome: formNome, cpf: formCpf, telefone: formTelefone, grupo_id: formGrupo ? parseInt(formGrupo) : null, terceirizado: formTerceirizado },
      editandoId
    );
    if (ok) setModalAberto(false);
  };

  const podeEditar = isAdmin || hasPermission('registro');

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const totalTecnicos = tecnicos.length;
  const tecnicosAtivos = tecnicos.filter(t => t.ativo).length;
  const totalTerceirizados = tecnicos.filter(t => t.terceirizado).length;
  const docsVencendo = alertas.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* KPI CARDS - Premium Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-slate-100 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl ring-1 ring-slate-100 group-hover:bg-slate-700 group-hover:text-white transition-all duration-300">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 leading-none">Total de Técnicos</p>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-2xl font-black text-slate-800 tracking-tight">{totalTecnicos}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">perfis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-emerald-100/60 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 leading-none">Técnicos Ativos</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{tecnicosAtivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-3xl shadow-sm text-white relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 relative z-10">
             <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
               <Users size={20} className="text-white drop-shadow-md" />
             </div>
             <div>
               <p className="text-amber-100 font-black uppercase tracking-widest text-[10px] mb-1.5 leading-none">Terceirizados</p>
               <p className="text-2xl font-black tracking-tight drop-shadow-sm leading-none">{totalTerceirizados}</p>
             </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-rose-100/60 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-xl ring-1 transition-all duration-300 ${docsVencendo > 0 ? 'bg-rose-50 text-rose-600 ring-rose-100 group-hover:bg-rose-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 ring-slate-100'}`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 leading-none">Docs em Alerta</p>
              <p className={`text-2xl font-black tracking-tight leading-none ${docsVencendo > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{docsVencendo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Vencimento - Collapse refined */}
      {alertas.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <button onClick={() => setAlertasAberto(!alertasAberto)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 ring-4 ring-amber-500/5">
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Painel de Alertas</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{alertas.length} documento(s) próximo(s) do vencimento</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Ação Requerida</span>
              {alertasAberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>
          </button>
          {alertasAberto && (
            <div className="px-5 py-4 space-y-2 max-h-[300px] overflow-y-auto bg-slate-50/20">
              {alertas.map(a => (
                <div key={`${a.id}-${a.escopo}`} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 hover:shadow-md hover:border-amber-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <Badge urgencia={a.urgencia} />
                    <div>
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">{LABEL_TIPO[a.tipo_documento]}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {a.escopo === 'global' ? (
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded uppercase">Documento Global</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Técnico: <span className="text-slate-600">{a.tecnico_nome}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-[10px] font-black uppercase tracking-tighter ${a.dias_restantes <= 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {a.dias_restantes <= 0 ? 'Expirado' : `Vence em ${a.dias_restantes} dias`}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(a.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar e Filtros - Premium Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 flex flex-col w-full relative z-20">
        <div className="p-4 border-b border-slate-100 bg-slate-50/20 rounded-t-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            
            {/* BUSCA */}
            <div className="lg:col-span-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                  <Search size={18} className={`transition-colors ${busca ? 'text-teal-500' : 'text-slate-400'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar técnico por nome..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className={`w-full bg-white border text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition-all shadow-sm ${
                    busca ? 'border-teal-500 ring-4 ring-teal-500/10 font-bold text-slate-800' : 'border-slate-200 group-hover:border-teal-300 text-slate-400 font-medium'
                  }`}
                />
              </div>
            </div>

            {/* GRUPO */}
            <div className="lg:col-span-3">
              <SearchableSelect 
                label="Grupo de Veículos"
                placeholder="Todos os Grupos"
                options={grupos.map(g => g.nome)}
                value={grupos.find(g => String(g.id) === filtroGrupo)?.nome || ''}
                onChange={(nome) => {
                  const g = grupos.find(gr => gr.nome === nome);
                  setFiltroGrupo(g ? String(g.id) : '');
                }}
                icon={Building2}
              />
            </div>

            {/* AÇÕES */}
            <div className="lg:col-span-5 flex items-center justify-end gap-2">
              <button onClick={() => setGlobalAberto(!globalAberto)}
                className="h-11 flex items-center gap-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600 hover:-translate-y-0.5 shadow-sm active:scale-95">
                <FileText size={16} /> Docs Globais
              </button>
              
              <button onClick={() => baixarZip()}
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all duration-300 shadow-md hover:-translate-y-0.5 active:scale-95 group"
                title="ZIP Compilado">
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </button>

              {podeEditar && (
                <button onClick={() => abrirModal()}
                  className="h-11 bg-teal-500 hover:bg-teal-600 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 shadow-md shadow-teal-200 hover:-translate-y-0.5 active:scale-95">
                  <Plus size={16} /> Novo Técnico
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documentos Globais */}
      {globalAberto && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText size={16} className="text-teal-500" /> Documentos Globais (PGR / PCMSO)
            </h3>
            <button onClick={() => setGlobalAberto(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIPOS_GLOBAL.map(tipo => {
              const doc = docsGlobais.find(d => d.tipo === tipo);
              return (
                <UploadField key={tipo} label={LABEL_TIPO[tipo]} tipo={tipo}
                  tecnicoId={null}
                  existingDoc={doc}
                  onUpload={(_, t, f, e, v) => uploadDocGlobal(t, f, e, v)}
                  onDelete={excluirDocGlobal} />
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Técnicos */}
      <div className="space-y-3">
        {tecnicosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500">Nenhum técnico encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre um novo técnico para começar.</p>
          </div>
        ) : (
          tecnicosPaginados.map(tec => {
            const aberto = tecnicoAberto === tec.id;
            const docs = tec.documentos_tecnicos || [];
            const isTerceirizado = !!tec.terceirizado;
            return (
              <div key={tec.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Header do card */}
                <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setTecnicoAberto(aberto ? null : tec.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 ${
                      isTerceirizado ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-teal-400 to-emerald-500'
                    }`}>
                      {tec.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-700 truncate">{tec.nome}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isTerceirizado && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Terceirizado</span>
                        )}
                        {tec.grupos_veiculos?.nome && (
                          <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded">{tec.grupos_veiculos.nome}</span>
                        )}
                        {tec.telefone && <span className="text-[10px] text-slate-400">{tec.telefone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini status dots — oculto para terceirizados */}
                    {!isTerceirizado && (
                      <div className="hidden sm:flex items-center gap-1.5" title="Status dos documentos">
                        {TIPOS_DOC.map(t => <StatusDot key={t} docs={docs} tipo={t} />)}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      {podeEditar && (
                        <button onClick={e => { e.stopPropagation(); abrirModal(tec); }}
                          className="p-1.5 text-slate-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg transition-colors text-xs">✏️</button>
                      )}
                      {!isTerceirizado && (
                        <button onClick={e => { e.stopPropagation(); baixarZip(tec.id); }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <Download size={14} />
                        </button>
                      )}
                      {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Painel expandido de documentos */}
                {aberto && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/30">
                    {isTerceirizado ? (
                      <div className="text-center py-6">
                        <p className="text-sm font-bold text-amber-600">Técnico Terceirizado</p>
                        <p className="text-xs text-slate-400 mt-1">Documentos não são necessários para técnicos terceirizados.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {TIPOS_DOC.map(tipo => {
                          const doc = docs.find(d => d.tipo === tipo);
                          return (
                            <UploadField key={tipo} label={LABEL_TIPO[tipo]} tipo={tipo}
                              tecnicoId={tec.id} existingDoc={doc}
                              onUpload={uploadDocumento}
                              onDelete={excluirDocumento} />
                          );
                        })}
                      </div>
                    )}
                    {podeEditar && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        <button onClick={() => { if (confirm(`Desativar ${tec.nome}?`)) excluirTecnico(tec.id); }}
                          className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1">
                          <Trash2 size={12} /> Desativar Técnico
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm font-medium text-slate-500">
            Exibindo <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> a <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, tecnicosFiltrados.length)}</span> de <span className="font-bold text-slate-700">{tecnicosFiltrados.length}</span> técnicos
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))} disabled={paginaAtual === 1}
              className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500">
              <ChevronLeft size={16} />
            </button>
            {getPaginasExibidas().map((p, idx) =>
              p === '...' ? (
                <span key={`e-${idx}`} className="px-2 text-slate-400 font-bold">...</span>
              ) : (
                <button key={`p-${p}`} onClick={() => setPaginaAtual(p)}
                  className={`min-w-[38px] h-[38px] flex items-center justify-center rounded-xl text-sm font-bold border shadow-sm transition-all ${
                    paginaAtual === p
                      ? 'bg-teal-500 border-teal-500 text-white shadow-teal-200 shadow-lg'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600'
                  }`}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))} disabled={paginaAtual === totalPaginas}
              className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Técnico */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4" onClick={() => setModalAberto(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editandoId ? 'Editar Técnico' : 'Novo Técnico'}</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome *</label>
                <input type="text" value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Nome completo"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">CPF</label>
                  <input type="text" value={formCpf} onChange={e => setFormCpf(e.target.value)} placeholder="000.000.000-00"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Telefone</label>
                  <input type="text" value={formTelefone} onChange={e => setFormTelefone(e.target.value)} placeholder="(00) 00000-0000"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Grupo</label>
                <select value={formGrupo} onChange={e => setFormGrupo(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-400/30 outline-none">
                  <option value="">Sem grupo</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
              </div>
              {/* Toggle Terceirizado */}
              <div className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formTerceirizado} onChange={e => setFormTerceirizado(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
                <div>
                  <span className="text-xs font-bold text-slate-700">Terceirizado</span>
                  <p className="text-[10px] text-slate-400">Técnicos terceirizados não precisam de documentos.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalAberto(false)}
                className="text-sm font-semibold text-slate-500 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={handleSalvar} disabled={!formNome.trim()}
                className="text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                {editandoId ? 'Salvar' : 'Criar Técnico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
