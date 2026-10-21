import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  MessageCircle, Building2, Truck, Bike, Video, AlertTriangle,
  CheckCircle2, Clock, Search, MapPin, User, Users, ExternalLink,
  Star, Phone, Layers, Copy, Check
} from 'lucide-react';
import { useUnidadesLookup } from '../../../hooks/useLookups';
import SearchableSelect from '../../shared/SearchableSelect';
import ModalContatoWhatsApp from './ModalContatoWhatsApp';
import ModalContatoMultiUnidade from './ModalContatoMultiUnidade';
import { agruparResponsaveisMultiUnidade } from '../../../utils/contatoMultiUtils';

export default function FalhasContatoTab({ loteAtivo, onAtualizarFalhas }) {
  const [falhasLote, setFalhasLote] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Lookup de unidades com seus responsáveis cadastrados na Gestão de Unidades
  const { data: unidadesLookup = [], isLoading: isLookupLoading } = useUnidadesLookup();

  // Modal WhatsApp
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Contato Multi-Unidade
  const [isModalMultiOpen, setIsModalMultiOpen] = useState(false);
  const [responsavelMultiInicial, setResponsavelMultiInicial] = useState(null);

  // Estado temporário de cópia de telefone nos cards
  const [copiadoTel, setCopiadoTel] = useState(null);

  const handleCopiarTelefoneDigitos = async (e, tel) => {
    e.stopPropagation();
    const digitos = String(tel || '').replace(/\D/g, '');
    if (!digitos) {
      return toast.error('Nenhum número disponível para copiar.');
    }
    try {
      await navigator.clipboard.writeText(digitos);
      setCopiadoTel(tel);
      toast.success(`Número copiado: ${digitos}`);
      setTimeout(() => setCopiadoTel(null), 1500);
    } catch {
      toast.error('Erro ao copiar número.');
    }
  };

  // Filtros locais
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [filtroUF, setFiltroUF] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'pendente' | 'contatado'

  // Carregar dados leves do lote ativo para agrupamento por unidade (otimizado para Render/Vercel)
  const carregarFalhasDoLote = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await api.get('/gestao-solar/falhas/resumo-contatos', {
        params: {
          lote_id: loteAtivo?.id || 'latest'
        }
      });
      const lista = res.data?.data || [];
      setFalhasLote(lista);
    } catch {
      toast.error('Erro ao carregar falhas para o painel de contatos.');
      setFalhasLote([]);
    } finally {
      setCarregando(false);
    }
  }, [loteAtivo?.id]);

  useEffect(() => {
    carregarFalhasDoLote();
  }, [carregarFalhasDoLote]);

  // Agrupar falhas por unidade e associar os responsáveis vindos da Gestão de Unidades
  const unidadesComFalhas = useMemo(() => {
    const mapa = {};

    falhasLote.forEach((f) => {
      const nome = f.unidade?.trim() || 'Sem Unidade';
      if (!mapa[nome]) {
        // Localiza a unidade correspondente na Gestão de Unidades
        const match = unidadesLookup.find(
          (u) => u.nome_unidade?.trim().toLowerCase() === nome.toLowerCase()
        );

        mapa[nome] = {
          nome_unidade: nome,
          unidade_id: match?.id || null,
          uf: f.uf || match?.uf || '',
          contatos: Array.isArray(match?.responsaveis) ? match.responsaveis : [],
          falhas: []
        };
      }
      mapa[nome].falhas.push(f);
    });

    return Object.values(mapa).sort((a, b) => a.nome_unidade.localeCompare(b.nome_unidade));
  }, [falhasLote, unidadesLookup]);

  // Listas para filtros rápidos
  const ufsDisponiveis = useMemo(() => {
    const vals = unidadesComFalhas.map((u) => u.uf).filter(Boolean);
    return [...new Set(vals)].sort();
  }, [unidadesComFalhas]);

  const responsaveisDisponiveis = useMemo(() => {
    const nomes = [];
    unidadesComFalhas.forEach((u) => {
      (u.contatos || []).forEach((c) => {
        if (c.nome) nomes.push(c.nome);
      });
    });
    return [...new Set(nomes)].sort();
  }, [unidadesComFalhas]);

  const unidadesNomesDisponiveis = useMemo(() => {
    return unidadesComFalhas.map((u) => u.nome_unidade).sort();
  }, [unidadesComFalhas]);

  // KPIs
  const totalUnidades = unidadesComFalhas.length;
  const unidadesPendentes = useMemo(() => {
    return unidadesComFalhas.filter((u) =>
      u.falhas.some((f) => f.status_tratativa === 'Pendente de Contato' || !f.status_tratativa)
    ).length;
  }, [unidadesComFalhas]);
  const unidadesContatadas = totalUnidades - unidadesPendentes;

  // Responsáveis qualificados em múltiplas unidades com falhas (dupla validação estrita: Nome + Número)
  const responsaveisMulti = useMemo(() => {
    return agruparResponsaveisMultiUnidade(unidadesComFalhas);
  }, [unidadesComFalhas]);

  // Mapa para identificação imediata das unidades que possuem responsável compartilhado
  const mapaUnidadeParaResponsaveisMulti = useMemo(() => {
    const mapa = {};
    responsaveisMulti.forEach((resp) => {
      resp.unidades.forEach((u) => {
        const chave = u.nome_unidade?.trim().toLowerCase();
        if (!mapa[chave]) mapa[chave] = [];
        mapa[chave].push(resp);
      });
    });
    return mapa;
  }, [responsaveisMulti]);

  // Filtragem de unidades na tela
  const unidadesFiltradas = useMemo(() => {
    return unidadesComFalhas.filter((u) => {
      // 1. Filtro Unidade
      if (buscaUnidade && u.nome_unidade !== buscaUnidade && !u.nome_unidade.toLowerCase().includes(buscaUnidade.toLowerCase())) {
        return false;
      }

      // 2. Filtro UF
      if (filtroUF && u.uf !== filtroUF) {
        return false;
      }

      // 3. Filtro Responsável
      if (filtroResponsavel) {
        const temEsseResp = (u.contatos || []).some((c) => c.nome === filtroResponsavel);
        if (!temEsseResp) return false;
      }

      // 4. Filtro Status Contato
      const temPendentes = u.falhas.some(
        (f) => f.status_tratativa === 'Pendente de Contato' || !f.status_tratativa
      );
      if (filtroStatus === 'pendente' && !temPendentes) return false;
      if (filtroStatus === 'contatado' && temPendentes) return false;

      return true;
    });
  }, [unidadesComFalhas, buscaUnidade, filtroUF, filtroResponsavel, filtroStatus]);

  // Abrir modal de contato para uma unidade
  const abrirModalContato = (unidade) => {
    setModalData({
      nome_unidade: unidade.nome_unidade,
      uf: unidade.uf,
      falhas: unidade.falhas,
      contatos: unidade.contatos,
      lote_id: loteAtivo?.id || 'latest'
    });
    setIsModalOpen(true);
  };

  // Abrir modal de contato multi-unidade
  const abrirModalMulti = (responsavel = null) => {
    setResponsavelMultiInicial(responsavel);
    setIsModalMultiOpen(true);
  };

  // Callback de sucesso ao copiar mensagem individual
  const handleContatadoSucesso = ({ unidade }) => {
    // Atualização otimista: registros pendentes desta unidade viram 'Aguardando Retorno'
    setFalhasLote((prev) =>
      prev.map((f) => {
        if (f.unidade?.trim().toLowerCase() === unidade?.trim().toLowerCase() && f.status_tratativa === 'Pendente de Contato') {
          return {
            ...f,
            status_tratativa: 'Aguardando Retorno',
            data_contato: new Date().toISOString()
          };
        }
        return f;
      })
    );

    // Notifica a tela de Falhas principal para atualizar contadores e tabela
    if (onAtualizarFalhas) {
      onAtualizarFalhas();
    }
  };

  // Callback de sucesso ao copiar mensagem multi-unidade
  const handleContatadoMultiSucesso = ({ unidades }) => {
    const setNomes = new Set(unidades.map((u) => u.trim().toLowerCase()));

    // Atualização otimista: registros pendentes de todas as unidades tratadas viram 'Aguardando Retorno'
    setFalhasLote((prev) =>
      prev.map((f) => {
        const nomeUnidade = f.unidade?.trim().toLowerCase();
        if (
          nomeUnidade &&
          setNomes.has(nomeUnidade) &&
          (f.status_tratativa === 'Pendente de Contato' || !f.status_tratativa)
        ) {
          return {
            ...f,
            status_tratativa: 'Aguardando Retorno',
            data_contato: new Date().toISOString()
          };
        }
        return f;
      })
    );

    if (onAtualizarFalhas) {
      onAtualizarFalhas();
    }
  };

  // Atalho para Gestão de Unidades
  const handleIrGestaoUnidades = () => {
    try {
      localStorage.setItem('tabelaVeiculosTab', 'unidades');
    } catch (err) {
      console.warn('Não foi possível persistir aba ativa:', err);
    }
    window.location.hash = '#solar/veiculos';
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* 1. KPIs da Aba de Contatos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total de Unidades */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              Unidades com Falha
            </p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalUnidades}</p>
          </div>
        </div>

        {/* Pendente de Contato */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 p-4.5 rounded-3xl shadow-sm text-white flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
          <div className="p-3 bg-white/20 rounded-2xl relative z-10">
            <AlertTriangle size={22} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-rose-100 font-black uppercase tracking-widest">
              Pendente de Contato
            </p>
            <p className="text-2xl font-black mt-0.5">{unidadesPendentes}</p>
          </div>
        </div>

        {/* 100% Contatadas */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              100% Contatadas
            </p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{unidadesContatadas}</p>
          </div>
        </div>

      </div>

      {/* 2. Barra de Filtros e Ação Multi-Contato */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3">
          
          {/* Grid dos 4 Filtros Convencionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 items-end">
            
            {/* Seletor Unidade */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Unidade
              </label>
              <SearchableSelect
                placeholder="Todas as Unidades"
                options={unidadesNomesDisponiveis}
                value={buscaUnidade}
                onChange={setBuscaUnidade}
                icon={Building2}
              />
            </div>

            {/* Seletor UF */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                UF
              </label>
              <SearchableSelect
                placeholder="Todos os Estados"
                options={ufsDisponiveis}
                value={filtroUF}
                onChange={setFiltroUF}
                icon={MapPin}
              />
            </div>

            {/* Seletor Responsável */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Responsável (Unidade)
              </label>
              <SearchableSelect
                placeholder="Todos os Responsáveis"
                options={responsaveisDisponiveis}
                value={filtroResponsavel}
                onChange={setFiltroResponsavel}
                icon={User}
              />
            </div>

            {/* Filtro Rápido de Status */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Status do Contato
              </label>
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 h-12 items-center">
                {[
                  { key: 'todos', label: 'Todos' },
                  { key: 'pendente', label: 'Pendentes' },
                  { key: 'contatado', label: 'Contatados' }
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFiltroStatus(opt.key)}
                    className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filtroStatus === opt.key
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Botão de Destaque Contato Multi-Unidade */}
          <div className="lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => abrirModalMulti()}
              disabled={responsaveisMulti.length === 0}
              className={`w-full lg:w-auto h-12 px-4.5 flex items-center justify-center gap-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm ${
                responsaveisMulti.length > 0
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-teal-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              title={
                responsaveisMulti.length > 0
                  ? `${responsaveisMulti.length} responsável(is) com falhas em 2 ou mais unidades`
                  : 'Nenhum responsável compartilhado com falhas no lote atual'
              }
            >
              <Layers size={16} className={responsaveisMulti.length > 0 ? 'text-teal-200' : 'text-slate-400'} />
              <span>Contato Multi-Unidade</span>
              {responsaveisMulti.length > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-black">
                  {responsaveisMulti.length}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* 3. Grid de Cards de Unidades */}
      {carregando || isLookupLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black text-slate-600 uppercase tracking-wider">
            Carregando painel de contatos e responsáveis…
          </p>
        </div>
      ) : unidadesFiltradas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <Building2 size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-700">Nenhuma unidade encontrada</p>
          <p className="text-xs text-slate-400 mt-1">
            Tente ajustar os filtros de busca ou verificar o lote selecionado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
          {unidadesFiltradas.map((unidade, idx) => {
            const contatos = unidade.contatos || [];
            const semContato = contatos.length === 0;

            const pendentes = unidade.falhas.filter(
              (f) => f.status_tratativa === 'Pendente de Contato' || !f.status_tratativa
            ).length;
            const foiContatado = pendentes === 0;

            const cams = unidade.falhas.filter((f) =>
              String(f.tipo_veiculo || '').toUpperCase().includes('CAMINH')
            ).length;
            const motos = unidade.falhas.filter((f) =>
              String(f.tipo_veiculo || '').toUpperCase().includes('MOTO')
            ).length;
            const videos = unidade.falhas.filter((f) => {
              const t = String(f.tipo_veiculo || '').toUpperCase();
              return t.includes('VÍDEO') || t.includes('VIDEO') || t.includes('DASHCAM') || t.includes('CÂMERA');
            }).length;

            const contatoPrincipal = contatos.find((c) => c.principal) || contatos[0];
            const responsaveisMultiDestaUnidade =
              mapaUnidadeParaResponsaveisMulti[unidade.nome_unidade?.trim().toLowerCase()] || [];

            return (
              <div
                key={unidade.nome_unidade}
                className={`bg-white rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 shadow-sm ${
                  foiContatado
                    ? 'border-emerald-200/80 bg-emerald-50/10'
                    : semContato
                    ? 'border-amber-200/80 bg-amber-50/10'
                    : 'border-slate-200/80'
                }`}
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                {/* Header do Card */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800 truncate" title={unidade.nome_unidade}>
                          {unidade.nome_unidade}
                        </p>
                        {unidade.uf && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {unidade.uf}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {unidade.falhas.length} veículo{unidade.falhas.length > 1 ? 's' : ''} com falha
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        foiContatado
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {foiContatado ? 'Contatada' : `${pendentes} Pendente${pendentes > 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {/* Pills por Categoria */}
                  <div className="flex flex-wrap items-center gap-2 mt-3.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold">
                      <span className="text-slate-400 font-medium text-[10px]">Total:</span>
                      <span className="font-black">{unidade.falhas.length}</span>
                    </div>
                    {cams > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/70 text-slate-700 rounded-xl text-[11px] font-bold">
                        <Truck size={12} className="text-slate-500" />
                        <span>{cams}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Cam</span>
                      </div>
                    )}
                    {motos > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/70 text-slate-700 rounded-xl text-[11px] font-bold">
                        <Bike size={12} className="text-slate-500" />
                        <span>{motos}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Moto</span>
                      </div>
                    )}
                    {videos > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/70 text-slate-700 rounded-xl text-[11px] font-bold">
                        <Video size={12} className="text-slate-500" />
                        <span>{videos}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Vídeo</span>
                      </div>
                    )}
                  </div>

                  {/* Bloco de Responsáveis (Gestão de Unidades) */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    {semContato ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200/70 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-amber-800 text-[11px] font-bold">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                          <span>Sem responsável cadastrado</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleIrGestaoUnidades}
                          className="text-[10px] font-black text-amber-700 hover:text-amber-900 underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Cadastrar <ExternalLink size={9} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-black text-[11px] shrink-0">
                            {contatoPrincipal.nome?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-black text-slate-800 truncate text-[11px]">
                                {contatoPrincipal.nome}
                              </p>
                              {contatoPrincipal.principal && (
                                <Star size={10} className="fill-amber-500 text-amber-500 shrink-0" />
                              )}
                            </div>
                            {contatoPrincipal.telefone && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <Phone size={9} className="shrink-0" />
                                <span className="truncate">{contatoPrincipal.telefone}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopiarTelefoneDigitos(e, contatoPrincipal.telefone)}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-0.5"
                                  title="Copiar número limpo (apenas dígitos)"
                                  aria-label="Copiar apenas dígitos do número"
                                >
                                  {copiadoTel === contatoPrincipal.telefone ? (
                                    <Check size={10} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={10} />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {contatos.length > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                            +{contatos.length - 1} outro{contatos.length - 1 > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Chip de Atalho Multi-Contato se a unidade compartilhar responsável */}
                    {responsaveisMultiDestaUnidade.length > 0 && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalMulti(responsaveisMultiDestaUnidade[0]);
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 border border-teal-200/80 rounded-xl text-teal-800 text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs group"
                          title={`Abrir Multi-Contato para ${responsaveisMultiDestaUnidade[0].nome} (${responsaveisMultiDestaUnidade[0].totalUnidades} unidades)`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Layers size={12} className="text-teal-600 shrink-0 group-hover:rotate-12 transition-transform" />
                            <span className="truncate">Multi-Contato: {responsaveisMultiDestaUnidade[0].nome}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-teal-200/70 text-teal-900 rounded font-black text-[9px] shrink-0">
                            {responsaveisMultiDestaUnidade[0].totalUnidades} un.
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de Ação WhatsApp */}
                <div className="pt-2">
                  {semContato ? (
                    <button
                      type="button"
                      onClick={() => abrirModalContato(unidade)}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200 cursor-pointer hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all duration-200"
                    >
                      <AlertTriangle size={15} /> Ver Detalhes (Bloqueado)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirModalContato(unidade)}
                      className={`w-full h-11 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm ${
                        foiContatado
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                    >
                      <MessageCircle size={16} />
                      {foiContatado ? 'Enviar Novamente' : 'Copiar Mensagem'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal WhatsApp Integrado */}
      <ModalContatoWhatsApp
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        unidadeData={modalData}
        onContatado={handleContatadoSucesso}
        onIrGestaoUnidades={handleIrGestaoUnidades}
      />

      {/* 5. Modal Contato Multi-Unidade Integrado */}
      <ModalContatoMultiUnidade
        isOpen={isModalMultiOpen}
        onClose={() => {
          setIsModalMultiOpen(false);
          setResponsavelMultiInicial(null);
        }}
        responsaveisMulti={responsaveisMulti}
        responsavelInicial={responsavelMultiInicial}
        loteAtivo={loteAtivo}
        onContatadoMulti={handleContatadoMultiSucesso}
      />

    </div>
  );
}
