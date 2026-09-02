import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  MessageCircle, Building2, Truck, Bike, Video, AlertTriangle,
  CheckCircle2, Clock, Search, ChevronDown, Users, Filter, MapPin, User, Layers
} from 'lucide-react';
import ModalContatoWhatsApp from './ModalContatoWhatsApp';
import GestaoContatos from './GestaoContatos';
import SearchableSelect from './shared/SearchableSelect';
import ModalContatoMultiUnidade from './ModalContatoMultiUnidade';

// =====================================================================
// PAINEL DE CONTATOS — Cards agrupados por unidade com falhas
// =====================================================================
export default function ContatosFalhas() {
  const [falhasContato, setFalhasContato] = useState([]);
  const [loadingFalhas, setLoadingFalhas] = useState(true);
  const [contatos, setContatos] = useState([]);
  const [logRecente, setLogRecente] = useState([]);
  const [loadingContatos, setLoadingContatos] = useState(true);

  // Modal WhatsApp
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Gestão de Responsáveis
  const [isGestaoOpen, setIsGestaoOpen] = useState(false);

  // Modal Contato Multi-Unidade
  const [isModalMultiOpen, setIsModalMultiOpen] = useState(false);

  // Filtros locais
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'pendente' | 'contatado'
  const [filtroUF, setFiltroUF] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('');

  // Estado de "recém contatado" para feedback imediato (sem reload)
  const [recemContatado, setRecemContatado] = useState({}); // { [unidade_id]: { contato, data } }

  // Timestamp da última importação — buscado do banco para funcionar em qualquer dispositivo
  const [ultimaImportacao, setUltimaImportacao] = useState(() => {
    const ts = localStorage.getItem('ultimaImportacaoFalhas');
    return ts ? new Date(ts) : null;
  });

  const carregarUltimaImportacao = useCallback(async () => {
    try {
      const res = await api.get('/configuracoes/ultima_importacao_falhas');
      const valor = res.data?.valor;
      if (valor && valor !== 'null') {
        const data = new Date(valor);
        setUltimaImportacao(data);
        localStorage.setItem('ultimaImportacaoFalhas', valor);
      }
    } catch {
      // Silencioso — mantém o valor do localStorage como fallback
    }
  }, []);

  useEffect(() => {
    carregarFalhasContatos();
    carregarContatos();
    carregarLogRecente();
    carregarUltimaImportacao();
  }, [carregarUltimaImportacao]);

  const carregarFalhasContatos = async () => {
    setLoadingFalhas(true);
    try {
      const { data } = await api.get('/falhas');
      const lista = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setFalhasContato(lista);
    } catch {
      setFalhasContato([]);
      toast.error('Erro ao carregar falhas para gestão de contatos.');
    } finally {
      setLoadingFalhas(false);
    }
  };


  const carregarContatos = async () => {
    setLoadingContatos(true);
    try {
      const res = await api.get('/contatos');
      setContatos(res.data);
    } catch {
      toast.error('Erro ao carregar responsáveis.');
    } finally {
      setLoadingContatos(false);
    }
  };

  const carregarLogRecente = async () => {
    try {
      // Traz o último registro de contato por unidade (últimos 90 dias)
      const ate = new Date().toISOString().split('T')[0];
      const de = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await api.get(`/log-contatos?limite=200&de=${de}&ate=${ate}`);
      setLogRecente(res.data);
    } catch {
      // silencioso — log não é crítico para o painel
    }
  };

  // Mapas de conveniência
  const mapaContatosPorUnidade = useMemo(() => {
    const mapa = {};
    contatos.forEach(c => {
      if (!mapa[c.unidade_id]) mapa[c.unidade_id] = [];
      mapa[c.unidade_id].push(c);
    });
    return mapa;
  }, [contatos]);

  const mapaUltimoLogPorUnidade = useMemo(() => {
    const mapa = {};
    // log já vem ordenado por created_at DESC
    logRecente.forEach(l => {
      if (!mapa[l.unidade_id]) mapa[l.unidade_id] = l;
    });
    return mapa;
  }, [logRecente]);

  // Agrupamento de falhas por unidade
  const unidadesComFalhas = useMemo(() => {
    const mapa = {};
    falhasContato.forEach(f => {
      const uid = f.unidade_id;
      if (!uid) return;
      if (!mapa[uid]) {
        mapa[uid] = {
          unidade_id: uid,
          nome_unidade: f.unidades_clientes?.nome_unidade || `Unidade ${uid}`,
          uf: f.unidades_clientes?.uf || '',
          falhas: []
        };
      }
      mapa[uid].falhas.push(f);
    });
    return Object.values(mapa).sort((a, b) => a.nome_unidade.localeCompare(b.nome_unidade));
  }, [falhasContato]);

  // Listas Únicas para Filtros (seguindo padrão TabelaVeiculos)
  const ufsDisponiveis = useMemo(() => {
    const vals = unidadesComFalhas.map(u => u.uf).filter(Boolean);
    return [...new Set(vals)].sort();
  }, [unidadesComFalhas]);

  const responsaveisDisponiveis = useMemo(() => {
    const vals = contatos.map(c => c.nome).filter(Boolean);
    return [...new Set(vals)].sort();
  }, [contatos]);

  const unidadesDisponiveis = useMemo(() => {
    return unidadesComFalhas.map(u => u.nome_unidade).sort();
  }, [unidadesComFalhas]);

  // Determina se uma unidade foi contatada APÓS a última importação
  const foiContatadoAposImportacao = useCallback((unidade_id) => {
    const logLocal = recemContatado[unidade_id];
    const logServidor = mapaUltimoLogPorUnidade[unidade_id];

    // Obtém o contato mais recente (local ou servidor)
    let dataContato = null;
    if (logLocal) dataContato = new Date(logLocal.created_at);
    else if (logServidor) dataContato = new Date(logServidor.created_at);

    if (!dataContato) return false; // nunca foi contatado

    // Se houve uma importação depois do último contato, reseta para "Pendente"
    if (ultimaImportacao && ultimaImportacao > dataContato) return false;

    return true;
  }, [mapaUltimoLogPorUnidade, recemContatado, ultimaImportacao]);

  const unidadesFiltradas = useMemo(() => {
    return unidadesComFalhas.filter(u => {
      // Filtro Unidade (Seletor ou Busca)
      if (buscaUnidade && u.nome_unidade !== buscaUnidade && !u.nome_unidade.toLowerCase().includes(buscaUnidade.toLowerCase())) return false;
      
      // Filtro UF
      if (filtroUF && u.uf !== filtroUF) return false;

      // Filtro Responsável
      if (filtroResponsavel) {
        const responsaveisDestaUnidade = mapaContatosPorUnidade[u.unidade_id] || [];
        if (!responsaveisDestaUnidade.some(c => c.nome === filtroResponsavel)) return false;
      }

      // Filtro Status Contato — usa a nova lógica que considera a última importação
      const foiContatado = foiContatadoAposImportacao(u.unidade_id);
      if (filtroStatus === 'pendente' && foiContatado) return false;
      if (filtroStatus === 'contatado' && !foiContatado) return false;
      
      return true;
    });
  }, [unidadesComFalhas, buscaUnidade, filtroStatus, filtroUF, filtroResponsavel, mapaContatosPorUnidade, foiContatadoAposImportacao]);

  const abrirModal = (unidade) => {
    setModalData({
      unidade_id: unidade.unidade_id,
      nome_unidade: unidade.nome_unidade,
      falhas: unidade.falhas,
      contatos: mapaContatosPorUnidade[unidade.unidade_id] || []
    });
    setIsModalOpen(true);
  };

  const handleContatado = ({ unidade_id, contato }) => {
    const agora = new Date();
    setRecemContatado(prev => ({
      ...prev,
      [unidade_id]: {
        contatos_unidades: { nome: contato.nome },
        created_at: agora.toISOString()
      }
    }));
    // Recarrega o log em background para manter sincronizado
    setTimeout(carregarLogRecente, 2000);
  };

  const formatarDataLog = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const hoje = new Date();
    const diff = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Estatísticas gerais — usa a nova lógica de importação
  const totalUnidades = unidadesComFalhas.length;
  const pendentes = unidadesComFalhas.filter(u => !foiContatadoAposImportacao(u.unidade_id)).length;
  const contatados = totalUnidades - pendentes;

  // Banner: nova importação existe e há pelo menos 1 unidade que era "contatado" mas agora virou "pendente"
  const temNovaImportacao = ultimaImportacao !== null && pendentes > 0 && (
    unidadesComFalhas.some(u => {
      const log = recemContatado[u.unidade_id] || mapaUltimoLogPorUnidade[u.unidade_id];
      if (!log) return false;
      const dataContato = new Date(log.created_at);
      return ultimaImportacao > dataContato;
    })
  );

  return (
    <div className="space-y-5 w-full animate-in fade-in duration-500">

      {/* Banner de nova importação */}
      {temNovaImportacao && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in duration-300">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-amber-800">Nova importação detectada!</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Uma nova planilha foi carregada em {ultimaImportacao.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}. Os contatos anteriores à importação foram marcados automaticamente como <strong>Pendentes</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] cursor-pointer group">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Unidades com Falha</p>
            <p className="text-2xl font-black text-slate-800">{totalUnidades}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 p-4 rounded-3xl shadow-md text-white flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] cursor-pointer group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="p-3 bg-white/20 rounded-xl relative z-10">
            <AlertTriangle size={20} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-rose-100 font-black uppercase tracking-widest">Pendente de Contato</p>
            <p className="text-2xl font-black">{pendentes}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] cursor-pointer group">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Contatados</p>
            <p className="text-2xl font-black text-slate-800">{contatados}</p>
          </div>
        </div>
      </div>

      {/* Toolbar - Layout Grid seguindo TabelaVeiculos */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            
            {/* Seletor Unidade */}
            <div className="lg:col-span-1">
              <SearchableSelect 
                label="Unidade"
                placeholder="Selecionar..."
                options={unidadesDisponiveis}
                value={buscaUnidade}
                onChange={setBuscaUnidade}
                icon={Building2}
              />
            </div>

            {/* Filtro UF */}
            <div className="lg:col-span-1">
              <SearchableSelect 
                label="UF"
                placeholder="Estado..."
                options={ufsDisponiveis}
                value={filtroUF}
                onChange={setFiltroUF}
                icon={MapPin}
              />
            </div>

            {/* Filtro Responsável */}
            <div className="lg:col-span-1">
              <SearchableSelect 
                label="Responsável"
                placeholder="Nome..."
                options={responsaveisDisponiveis}
                value={filtroResponsavel}
                onChange={setFiltroResponsavel}
                icon={User}
              />
            </div>

            {/* Filtro Status */}
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filtro Rápido</label>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {[
                  { key: 'todos', label: 'Todos' },
                  { key: 'pendente', label: 'Pendentes' },
                  { key: 'contatado', label: 'Contatados' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setFiltroStatus(opt.key)}
                    className={`flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filtroStatus === opt.key
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Gestão */}
            <div className="flex justify-end lg:col-span-1">
              <button
                onClick={() => setIsGestaoOpen(true)}
                className="w-full h-11 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-teal-200 hover:scale-[1.02] active:scale-95 cursor-pointer group"
              >
                <Users size={16} className="group-hover:scale-110 transition-transform" /> Gestão Contatos
              </button>
            </div>
          </div>
        </div>

        {/* Botão Multi-Unidade — destaque fora do grid */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setIsModalMultiOpen(true)}
            className="w-full h-10 flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-orange-200 hover:scale-[1.01] active:scale-95 cursor-pointer group"
          >
            <Layers size={15} className="group-hover:rotate-12 transition-transform" />
            Contato Multi-Unidade
          </button>
        </div>

        <div className="p-4">
          {loadingContatos || loadingFalhas ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">Carregando dados de contato…</div>
          ) : unidadesFiltradas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              Nenhuma unidade encontrada com os filtros atuais
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {unidadesFiltradas.map((unidade, idx) => {
                const contatosUnidade = mapaContatosPorUnidade[unidade.unidade_id] || [];
                const logUnidade = recemContatado[unidade.unidade_id] || mapaUltimoLogPorUnidade[unidade.unidade_id];
                const foiContatado = foiContatadoAposImportacao(unidade.unidade_id);

                const cams = unidade.falhas.filter(f => f.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'CAMINHÃO').length;
                const motos = unidade.falhas.filter(f => f.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'MOTO').length;
                const vids = unidade.falhas.filter(f => f.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'VÍDEO').length;

                const semResponsavel = contatosUnidade.length === 0;

                return (
                  <div
                    key={unidade.unidade_id}
                    className={`bg-white border rounded-2xl p-4 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.015] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 group ${
                      foiContatado
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : semResponsavel
                        ? 'border-amber-200 bg-amber-50/10'
                        : 'border-slate-200'
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 leading-tight truncate">{unidade.nome_unidade}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{unidade.uf}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${
                        foiContatado
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {foiContatado ? 'Contatado' : 'Pendente'}
                      </div>
                    </div>

                    {/* Contadores por tipo */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                        <span className="text-lg font-black text-slate-800">{unidade.falhas.length}</span>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Total</p>
                      </div>
                      {cams > 0 && (
                        <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Truck size={10} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-700">{cams}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Cam.</p>
                        </div>
                      )}
                      {motos > 0 && (
                        <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Bike size={10} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-700">{motos}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Motos</p>
                        </div>
                      )}
                      {vids > 0 && (
                        <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Video size={10} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-700">{vids}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Vídeo</p>
                        </div>
                      )}
                    </div>

                    {/* Badge de último contato */}
                    {foiContatado && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <Clock size={11} className="text-emerald-500 flex-shrink-0" />
                        <p className="text-[10px] text-emerald-700 font-bold leading-tight">
                          Você contatou <span className="font-black">{logUnidade.contatos_unidades?.nome}</span> em{' '}
                          <span className="font-black">{formatarDataLog(logUnidade.created_at)}</span>
                        </p>
                      </div>
                    )}

                    {/* Aviso sem responsável */}
                    {semResponsavel && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                        <AlertTriangle size={11} className="text-amber-500 flex-shrink-0" />
                        <p className="text-[10px] text-amber-700 font-bold">Sem responsável cadastrado</p>
                      </div>
                    )}

                    {/* Botão WhatsApp */}
                    <button
                      onClick={() => abrirModal(unidade)}
                      className={`w-full h-10 flex items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        foiContatado
                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : semResponsavel
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          : 'bg-[#25D366] text-white hover:bg-[#1ebe5d] shadow-sm shadow-green-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                    >
                      <MessageCircle size={15} />
                      {foiContatado ? 'Enviar Novamente' : semResponsavel ? 'Ver Detalhes' : 'Copiar Mensagem'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <ModalContatoWhatsApp
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        unidadeData={modalData}
        onContatado={handleContatado}
      />

      <ModalContatoMultiUnidade
        isOpen={isModalMultiOpen}
        onClose={() => setIsModalMultiOpen(false)}
        contatos={contatos}
        unidadesComFalhas={unidadesComFalhas}
        mapaContatosPorUnidade={mapaContatosPorUnidade}
        onContatado={handleContatado}
      />

      <GestaoContatos
        isOpen={isGestaoOpen}
        onClose={() => setIsGestaoOpen(false)}
        onContatosAtualizados={carregarContatos}
      />
    </div>
  );
}
