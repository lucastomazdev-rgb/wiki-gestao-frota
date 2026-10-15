import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ListChecks,
  X,
  ArrowRight,
  ArrowLeft,
  ChevronsRight,
  ChevronsLeft,
  Building2,
  Calendar,
  CheckSquare,
  Search,
  Truck,
  BatteryWarning,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const STATUS_OPCOES = [
  'Pendente de Contato',
  'Aguardando Retorno',
  'Agendado Manutenção',
  'Aguardando Técnico',
  'Oficina',
  'Parado',
  'Retirada em Aberto',
  'Voltou a comunicar'
];

export default function ModalTratativaMassa({
  isOpen = false,
  onClose,
  loteAtivo = null,
  unidadesDisponiveis = [],
  onSucesso
}) {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [placasDisponiveis, setPlacasDisponiveis] = useState([]);
  const [placasSelecionadas, setPlacasSelecionadas] = useState([]);
  const [carregandoPlacas, setCarregandoPlacas] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [statusTratativa, setStatusTratativa] = useState('Pendente de Contato');
  const [dataContato, setDataContato] = useState(() => new Date().toISOString().split('T')[0]);

  // Filtros rápidos de busca em cada coluna
  const [buscaDisponiveis, setBuscaDisponiveis] = useState('');
  const [buscaSelecionadas, setBuscaSelecionadas] = useState('');

  // Limpar estado ao abrir/fechar
  useEffect(() => {
    if (!isOpen) {
      setUnidadeSelecionada('');
      setPlacasDisponiveis([]);
      setPlacasSelecionadas([]);
      setBuscaDisponiveis('');
      setBuscaSelecionadas('');
      setStatusTratativa('Pendente de Contato');
    }
  }, [isOpen]);

  // Carregar placas da unidade selecionada
  useEffect(() => {
    let cancelled = false;

    if (!isOpen || !unidadeSelecionada) {
      setPlacasDisponiveis([]);
      setPlacasSelecionadas([]);
      return;
    }

    const carregarPlacas = async () => {
      setCarregandoPlacas(true);
      setPlacasSelecionadas([]);
      try {
        const res = await api.get('/gestao-solar/falhas/placas-unidade', {
          params: {
            lote_id: loteAtivo?.id || 'latest',
            unidade: unidadeSelecionada
          }
        });
        const lista = res.data?.data || [];
        if (!cancelled) {
          setPlacasDisponiveis(lista);
        }
      } catch (err) {
        if (!cancelled) {
          setPlacasDisponiveis([]);
          toast.error('Erro ao carregar placas da unidade selecionada.');
        }
      } finally {
        if (!cancelled) {
          setCarregandoPlacas(false);
        }
      }
    };

    carregarPlacas();

    return () => {
      cancelled = true;
    };
  }, [isOpen, unidadeSelecionada, loteAtivo?.id]);

  // Mover placas entre colunas
  const moverParaDireita = (placa) => {
    setPlacasDisponiveis((prev) => prev.filter((p) => p.id !== placa.id));
    setPlacasSelecionadas((prev) => [...prev, placa]);
  };

  const moverParaEsquerda = (placa) => {
    setPlacasSelecionadas((prev) => prev.filter((p) => p.id !== placa.id));
    setPlacasDisponiveis((prev) => [...prev, placa]);
  };

  const moverTodasDireita = () => {
    setPlacasSelecionadas((prev) => [...prev, ...disponiveisFiltradas]);
    const idsMovidos = new Set(disponiveisFiltradas.map((p) => p.id));
    setPlacasDisponiveis((prev) => prev.filter((p) => !idsMovidos.has(p.id)));
  };

  const moverTodasEsquerda = () => {
    setPlacasDisponiveis((prev) => [...prev, ...selecionadasFiltradas]);
    const idsMovidos = new Set(selecionadasFiltradas.map((p) => p.id));
    setPlacasSelecionadas((prev) => prev.filter((p) => !idsMovidos.has(p.id)));
  };

  // Placas filtradas pela busca rápida em cada lado
  const disponiveisFiltradas = useMemo(() => {
    if (!buscaDisponiveis.trim()) return placasDisponiveis;
    const termo = buscaDisponiveis.trim().toUpperCase();
    return placasDisponiveis.filter(
      (p) =>
        p.placa?.toUpperCase().includes(termo) ||
        p.tipo_veiculo?.toUpperCase().includes(termo) ||
        p.status_tratativa?.toUpperCase().includes(termo)
    );
  }, [placasDisponiveis, buscaDisponiveis]);

  const selecionadasFiltradas = useMemo(() => {
    if (!buscaSelecionadas.trim()) return placasSelecionadas;
    const termo = buscaSelecionadas.trim().toUpperCase();
    return placasSelecionadas.filter(
      (p) =>
        p.placa?.toUpperCase().includes(termo) ||
        p.tipo_veiculo?.toUpperCase().includes(termo)
    );
  }, [placasSelecionadas, buscaSelecionadas]);

  // Executar a atualização em massa
  const handleSalvar = async () => {
    if (placasSelecionadas.length === 0) {
      return toast.error('Selecione pelo menos um veículo no grid da direita para atualizar!');
    }

    setSalvando(true);
    const toastId = toast.loading(`Atualizando ${placasSelecionadas.length} veículo(s)...`);

    try {
      const payload = {
        ids: placasSelecionadas.map((p) => p.id),
        status_tratativa: statusTratativa,
        data_contato: dataContato || null
      };

      await api.put('/gestao-solar/falhas/registros-massa', payload);
      toast.success(`${placasSelecionadas.length} veículo(s) atualizado(s) com sucesso!`, { id: toastId });
      onClose();
      if (onSucesso) onSucesso();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao realizar tratativa em massa.';
      toast.error(msg, { id: toastId });
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-300">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-xs">
              <ListChecks size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">
                Tratativa e Alteração em Massa
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                Gerenciador de Múltiplos Veículos por Unidade
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-5 bg-slate-50/30">
          
          {/* Painel de Configurações da Ação em Massa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs shrink-0">
            {/* 1. Selecionar Unidade (Lista suspensa apenas com unidades do relatório) */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                1. Selecionar Unidade
              </label>
              <select
                value={unidadeSelecionada}
                onChange={(e) => setUnidadeSelecionada(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-xs text-slate-800 transition-all px-3 cursor-pointer truncate"
              >
                <option value="">-- Escolher Unidade da Falha --</option>
                {unidadesDisponiveis
                  .filter((u) => u && u.trim().length > 0)
                  .map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
              </select>
            </div>

            {/* 2. Novo Motivo / Status do Lote */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                2. Novo Motivo / Status
              </label>
              <select
                value={statusTratativa}
                onChange={(e) => setStatusTratativa(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-xs text-slate-800 transition-all px-3 cursor-pointer"
              >
                {STATUS_OPCOES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Data de Contato / Efetivação */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                3. Data de Contato
              </label>
              <input
                type="date"
                value={dataContato}
                onChange={(e) => setDataContato(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-xs text-slate-800 transition-all px-3"
              />
            </div>
          </div>

          {/* Engine Transfer List (Duplo Grid com Botões Centrais) */}
          {unidadeSelecionada ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center shrink-0">
              
              {/* Coluna Esquerda: Placas Disponíveis na Unidade */}
              <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[320px] lg:h-[450px] shadow-xs flex-1">
                <div className="bg-slate-50/90 p-3.5 border-b border-slate-200 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-widest text-[10px] font-black text-slate-700">
                      Placas Disponíveis
                    </span>
                    <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-md text-[10px] font-black">
                      {placasDisponiveis.length} UN
                    </span>
                  </div>
                </div>

                {/* Campo de Busca Rápida na Lista Disponível */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/40 shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar placas..."
                      value={buscaDisponiveis}
                      onChange={(e) => setBuscaDisponiveis(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Lista de Placas Disponíveis */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar bg-slate-50/20">
                  {carregandoPlacas ? (
                    <div className="text-center font-bold text-slate-400 py-16 text-xs animate-pulse">
                      Carregando placas da unidade...
                    </div>
                  ) : disponiveisFiltradas.length > 0 ? (
                    disponiveisFiltradas.map((placa) => (
                      <div
                        key={placa.id}
                        className="flex justify-between items-center p-3 bg-white border border-slate-200/80 rounded-xl hover:border-emerald-300 hover:shadow-xs transition-all group"
                      >
                        <div>
                          <span className="font-mono font-black text-slate-800 tracking-wide text-xs inline-block">
                            {placa.placa}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {placa.tipo_veiculo || 'Veículo'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {placa.status_tratativa || 'Pendente'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => moverParaDireita(placa)}
                          className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-emerald-200"
                          title="Adicionar ao lote em tratativa"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center font-bold text-slate-400 py-16 text-xs">
                      {placasDisponiveis.length === 0
                        ? 'Nenhuma placa restante nesta unidade'
                        : 'Nenhuma placa corresponde ao filtro'}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões Centrais de Transferência */}
              <div className="flex flex-row lg:flex-col justify-center gap-2.5 py-2">
                <button
                  type="button"
                  onClick={moverTodasDireita}
                  disabled={disponiveisFiltradas.length === 0}
                  className="flex-1 lg:flex-none p-3 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-600 rounded-xl disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Mover Todas as Visíveis para a Direita"
                >
                  <ChevronsRight size={20} />
                </button>
                <button
                  type="button"
                  onClick={moverTodasEsquerda}
                  disabled={selecionadasFiltradas.length === 0}
                  className="flex-1 lg:flex-none p-3 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-xl disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Remover Todas as Visíveis"
                >
                  <ChevronsLeft size={20} />
                </button>
              </div>

              {/* Coluna Direita: Lote Alvo Selecionado */}
              <div className="bg-white border text-sm border-emerald-300 rounded-2xl overflow-hidden flex flex-col min-h-[320px] lg:h-[450px] shadow-xs flex-1 ring-1 ring-emerald-100">
                <div className="bg-emerald-600 p-3.5 border-b border-emerald-700 flex justify-between items-center text-white shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-widest text-[10px] font-black">
                      Lote em Tratativa
                    </span>
                    <span className="bg-white text-emerald-700 font-black py-0.5 px-2 rounded-md text-[10px]">
                      {placasSelecionadas.length} ALVO
                    </span>
                  </div>
                </div>

                {/* Campo de Busca Rápida na Lista Selecionada */}
                <div className="p-2 border-b border-emerald-100 bg-emerald-50/20 shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar selecionadas..."
                      value={buscaSelecionadas}
                      onChange={(e) => setBuscaSelecionadas(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Lista de Placas Selecionadas */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar bg-emerald-50/10">
                  {selecionadasFiltradas.length > 0 ? (
                    selecionadasFiltradas.map((placa) => (
                      <div
                        key={placa.id}
                        className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200/70 shadow-xs group hover:border-emerald-400 transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => moverParaEsquerda(placa)}
                          className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Remover do lote"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <div className="text-right flex-1 ml-2">
                          <span className="font-mono font-black text-slate-800 tracking-wide block leading-none text-xs">
                            {placa.placa}
                          </span>
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black tracking-wider border border-emerald-200 inline-block mt-1.5 uppercase">
                            ➔ {statusTratativa}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-2">
                        <CheckSquare size={24} />
                      </div>
                      <p className="font-bold text-slate-500 text-xs">
                        Nenhum veículo selecionado
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                        Clique na seta verde da placa desejada ou no botão &quot;&gt;&gt;&quot; para adicionar ao lote.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-white/70">
              <div className="p-5 bg-slate-100 rounded-full mb-4 border border-slate-200 text-slate-400">
                <Building2 size={44} />
              </div>
              <p className="text-base font-black text-slate-800 tracking-tight">
                Selecione uma Unidade de Operação
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1.5 text-center max-w-md">
                Para iniciar a tratativa em massa, selecione primeiro qual unidade você deseja auditar na lista suspensa acima.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-wrap justify-between items-center p-5 border-t border-slate-100 bg-white gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-bold pl-2">
            {placasSelecionadas.length > 0 ? (
              <span className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                [{placasSelecionadas.length}] veículo(s) pronto(s) para receber status &quot;{statusTratativa}&quot;.
              </span>
            ) : (
              <span className="text-slate-400">Selecione placas para habilitar a gravação.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-extrabold uppercase tracking-wider hover:bg-slate-100 rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              disabled={placasSelecionadas.length === 0 || salvando}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-black uppercase tracking-wider text-xs text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {salvando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gravando Dados...</span>
                </>
              ) : (
                <>
                  <CheckSquare size={16} />
                  <span>Executar Atualização</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
