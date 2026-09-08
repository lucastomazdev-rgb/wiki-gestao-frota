import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Wrench, 
  Search, 
  Truck, 
  MapPin, 
  DollarSign, 
  Boxes, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function ModalLancamentoOS({ 
  isOpen, 
  onClose, 
  tecnicos = [], 
  tecnicoPreSelecionado = null, 
  ordemParaEditar = null,
  onSuccess 
}) {
  const [tecnicoId, setTecnicoId] = useState('');
  const [numeroOs, setNumeroOs] = useState('');
  const [placa, setPlaca] = useState('');
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [placaInfo, setPlacaInfo] = useState(null);

  const [uf, setUf] = useState('');
  const [unidade, setUnidade] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');

  const [servicoSelecionadoId, setServicoSelecionadoId] = useState('');
  const [nomeServico, setNomeServico] = useState('');
  const [valorServico, setValorServico] = useState(0);
  const [exigeDevolucao, setExigeDevolucao] = useState(false);

  const [teveKm, setTeveKm] = useState(false);
  const [kmQuantidade, setKmQuantidade] = useState(0);
  const [valorKmUnitario, setValorKmUnitario] = useState(0);

  const [numeroNf, setNumeroNf] = useState('');
  const [status, setStatus] = useState('Agendado');

  // Equipamentos utilizados na O.S. (array de { modelo, quantidade })
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState([]);

  const [loading, setLoading] = useState(false);
  const prevTecnicoIdRef = useRef(null);

  // Técnico selecionado atualmente
  const tecnicoAtivo = tecnicos.find(t => t.id === tecnicoId) || null;

  // Ao abrir o modal, inicializa com dados de edição ou novo formulário
  useEffect(() => {
    if (isOpen) {
      if (ordemParaEditar) {
        setTecnicoId(ordemParaEditar.tecnico_id || '');
        setNumeroOs(ordemParaEditar.numero_os || '');
        setPlaca(ordemParaEditar.placa || '');
        setPlacaInfo(null);
        setUf(ordemParaEditar.uf || '');
        setUnidade(ordemParaEditar.unidade || '');
        setTipoVeiculo(ordemParaEditar.tipo_veiculo || '');
        setServicoSelecionadoId(ordemParaEditar.servico_id || '');
        setNomeServico(ordemParaEditar.nome_servico || '');
        setValorServico(Number(ordemParaEditar.valor_servico) || 0);
        setExigeDevolucao(Boolean(ordemParaEditar.exige_devolucao));
        setTeveKm(Boolean(ordemParaEditar.teve_km_rodado));
        setKmQuantidade(Number(ordemParaEditar.km_quantidade) || 0);
        setValorKmUnitario(Number(ordemParaEditar.valor_km_unitario) || 0);
        setNumeroNf(ordemParaEditar.numero_nf || '');
        setStatus(ordemParaEditar.status || 'Agendado');
        setEquipamentosSelecionados(
          Array.isArray(ordemParaEditar.equipamentos_utilizados) 
            ? ordemParaEditar.equipamentos_utilizados 
            : []
        );
        prevTecnicoIdRef.current = ordemParaEditar.tecnico_id || '';
      } else {
        const idInicial = tecnicoPreSelecionado?.id || (tecnicos.length > 0 ? tecnicos[0].id : '');
        setTecnicoId(idInicial);
        setNumeroOs('');
        setPlaca('');
        setPlacaInfo(null);
        setUf('');
        setUnidade('');
        setTipoVeiculo('');
        setServicoSelecionadoId('');
        setNomeServico('');
        setValorServico(0);
        setExigeDevolucao(false);
        setTeveKm(false);
        setKmQuantidade(0);
        setValorKmUnitario(0);
        setNumeroNf('');
        setStatus('Agendado');
        setEquipamentosSelecionados([]);
        prevTecnicoIdRef.current = idInicial;
      }
    } else {
      prevTecnicoIdRef.current = null;
    }
  }, [isOpen, ordemParaEditar, tecnicoPreSelecionado, tecnicos]);

  // Atualiza taxa de KM quando o usuário troca ativamente de técnico
  useEffect(() => {
    if (!isOpen) return;
    if (tecnicoAtivo) {
      const servicoKm = tecnicoAtivo.servicos_precos?.find(s => s.is_km || /km/i.test(s.nome_servico));

      // Se o usuário trocou manualmente de técnico (diferente do carregado)
      if (prevTecnicoIdRef.current && prevTecnicoIdRef.current !== tecnicoId) {
        if (servicoKm) {
          setValorKmUnitario(Number(servicoKm.valor) || 0);
        } else {
          setValorKmUnitario(0);
        }
        setServicoSelecionadoId('');
        setNomeServico('');
        setValorServico(0);
        setEquipamentosSelecionados([]);
        prevTecnicoIdRef.current = tecnicoId;
      } else if (!ordemParaEditar && servicoKm && valorKmUnitario === 0) {
        setValorKmUnitario(Number(servicoKm.valor) || 0);
      }
    }
  }, [tecnicoId, tecnicoAtivo, isOpen, ordemParaEditar, valorKmUnitario]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Busca instantânea de dados do veículo pela Placa
  const handleBuscarPlaca = async (placaParaBuscar) => {
    const limpa = (placaParaBuscar || placa).replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
    if (!limpa || limpa.length < 5) return;

    try {
      setBuscandoPlaca(true);
      const res = await api.get(`/gestao-solar/veiculos/buscar-placa/${limpa}`);
      if (res.data?.found && res.data?.data) {
        const d = res.data.data;
        setUf(d.uf || '');
        setUnidade(d.unidade || '');
        setTipoVeiculo(d.tipo_veiculo || '');
        setPlacaInfo({
          encontrado: true,
          msg: `Veículo localizado na base: ${d.unidade || 'Solar'} (${d.uf || 'BR'})`
        });
      } else {
        setPlacaInfo({
          encontrado: false,
          msg: 'Placa não cadastrada previamente na frota. Preencha UF e Unidade manualmente.'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscandoPlaca(false);
    }
  };

  // Ao selecionar um serviço da tabela do técnico
  const handleSelecionarServico = (sId) => {
    setServicoSelecionadoId(sId);
    const serv = tecnicoAtivo?.servicos_precos?.find(s => s.id === sId);
    if (serv) {
      setNomeServico(serv.nome_servico);
      setValorServico(Number(serv.valor) || 0);
      setExigeDevolucao(Boolean(serv.gera_devolucao));
    } else {
      setNomeServico('');
      setValorServico(0);
      setExigeDevolucao(false);
    }
  };

  // Manipulação de equipamentos utilizados
  const handleToggleEquipamento = (modelo, saldoDisponivel) => {
    const jaExiste = equipamentosSelecionados.find(e => e.modelo === modelo);
    if (jaExiste) {
      setEquipamentosSelecionados(prev => prev.filter(e => e.modelo !== modelo));
    } else {
      setEquipamentosSelecionados(prev => [...prev, { modelo, quantidade: 1 }]);
    }
  };

  const handleUpdateQtdEquipamento = (modelo, qtd) => {
    const valorNum = Math.max(1, parseInt(qtd, 10) || 1);
    setEquipamentosSelecionados(prev =>
      prev.map(e => (e.modelo === modelo ? { ...e, quantidade: valorNum } : e))
    );
  };

  // Cálculos financeiros
  const valorKmTotal = teveKm ? Number((kmQuantidade * valorKmUnitario).toFixed(2)) : 0;
  const valorTotalFinal = Number((valorServico + valorKmTotal).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!numeroOs.trim()) {
      toast.error('Informe o número da O.S.');
      return;
    }
    if (!tecnicoId) {
      toast.error('Selecione o técnico terceirizado.');
      return;
    }
    if (!placa.trim()) {
      toast.error('Informe a placa do veículo.');
      return;
    }
    if (!nomeServico.trim()) {
      toast.error('Selecione o serviço prestado pelo técnico.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        numero_os: numeroOs.trim(),
        tecnico_id: tecnicoId,
        servico_id: servicoSelecionadoId,
        placa: placa.trim().toUpperCase(),
        uf: uf.trim().toUpperCase() || null,
        unidade: unidade.trim() || null,
        tipo_veiculo: tipoVeiculo.trim() || null,
        teve_km_rodado: teveKm,
        km_quantidade: teveKm ? kmQuantidade : 0,
        numero_nf: numeroNf.trim() || null,
        status,
        equipamentos_utilizados: equipamentosSelecionados
      };

      if (ordemParaEditar) {
        const res = await api.put(`/gestao-solar/ordens-servicos/${ordemParaEditar.id}`, payload);
        toast.success(res.data?.message || 'Ordem de Serviço atualizada com sucesso!');
      } else {
        const res = await api.post('/gestao-solar/ordens-servicos', payload);
        toast.success(res.data?.message || 'Ordem de Serviço lançada com sucesso!');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar Ordem de Serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-os-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-2xl shadow-sm">
              <Wrench size={22} />
            </div>
            <div>
              <h2 id="modal-os-title" className="text-lg font-black text-slate-900 tracking-tight">
                {ordemParaEditar ? `Editar Ordem de Serviço #${ordemParaEditar.numero_os}` : 'Lançamento de Ordem de Serviço'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {ordemParaEditar 
                  ? 'Atualize os dados operacionais, valores de KM ou equipamentos utilizados nesta O.S.'
                  : 'Despache o serviço, controle KM e aplique baixa automática de equipamentos.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Seção 1: Seleção do Técnico */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Técnico Terceirizado Responsável *
            </label>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
              required
            >
              {tecnicos.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nome} — {t.regiao} {t.homologado ? '(Homologado ✅)' : '(Em Homologação ⏳)'}
                </option>
              ))}
            </select>
          </div>

          {/* Seção 2: O.S e Veículo com Auto-busca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* O.S */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Número da O.S. *
              </label>
              <input
                type="text"
                value={numeroOs}
                onChange={(e) => setNumeroOs(e.target.value)}
                placeholder="Ex: OS-2026-8841"
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                required
              />
            </div>

            {/* Placa com auto-busca */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Placa do Veículo (Busca Automática) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setPlaca(v);
                    if (v.length >= 7) handleBuscarPlaca(v);
                  }}
                  onBlur={() => handleBuscarPlaca(placa)}
                  placeholder="Ex: BRA2E19 ou ABC1234"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all tracking-wider uppercase"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleBuscarPlaca(placa)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-teal-600 cursor-pointer"
                  title="Buscar dados do veículo"
                >
                  {buscandoPlaca ? (
                    <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <Search size={17} />
                  )}
                </button>
              </div>

              {/* Feedback da Placa */}
              {placaInfo && (
                <p className={`text-[11px] font-bold mt-1.5 flex items-center gap-1.5 ${
                  placaInfo.encontrado ? 'text-emerald-700' : 'text-amber-600'
                }`}>
                  {placaInfo.encontrado ? <CheckCircle2 size={13} /> : <Info size={13} />}
                  <span>{placaInfo.msg}</span>
                </p>
              )}
            </div>
          </div>

          {/* Dados complementares do veículo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                UF
              </label>
              <input
                type="text"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                placeholder="Ex: CE"
                maxLength={2}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Unidade / Operação
              </label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="Ex: CD Fortaleza"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tipo de Veículo
              </label>
              <input
                type="text"
                value={tipoVeiculo}
                onChange={(e) => setTipoVeiculo(e.target.value)}
                placeholder="Ex: Cavalo Mecânico / Toco"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Seção 3: Serviço & Valor Cobrado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Serviço Prestado (Tabela do Técnico) *
              </label>
              <select
                value={servicoSelecionadoId}
                onChange={(e) => handleSelecionarServico(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                required
              >
                <option value="">Selecione um serviço cadastrado...</option>
                {tecnicoAtivo?.servicos_precos?.filter(s => !s.is_km).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome_servico} — R$ {Number(s.valor).toFixed(2)} {s.gera_devolucao ? '(Exige Devolução ⚠️)' : ''}
                  </option>
                ))}
              </select>

              {exigeDevolucao && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-bold">
                  <RotateCcw size={14} className="text-amber-600 shrink-0" />
                  <span>
                    Este serviço exige logística reversa (devolução do equipamento retirado na conclusão).
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 whitespace-nowrap">
                Valor Base do Serviço
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-black text-slate-800 whitespace-nowrap flex items-center gap-1">
                <span className="text-slate-500 text-xs font-bold">R$</span>
                <span>{Number(valorServico).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Seção 4: Deslocamento / KM Rodado */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Houve KM Rodado / Deslocamento?
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Multiplica a distância percorrida pelo valor unitário cadastrado para o técnico.
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTeveKm(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !teveKm ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setTeveKm(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    teveKm ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-teal-700'
                  }`}
                >
                  Sim
                </button>
              </div>
            </div>

            {teveKm && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Quilômetros Rodados (KM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={kmQuantidade}
                    onChange={(e) => setKmQuantidade(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Valor por KM (Técnico)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorKmUnitario}
                    onChange={(e) => setValorKmUnitario(Number(e.target.value) || 0)}
                    placeholder="1.50"
                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 whitespace-nowrap">
                    Subtotal Deslocamento
                  </label>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-800 whitespace-nowrap flex items-center gap-1">
                    <span>+</span>
                    <span className="text-emerald-600 text-[10px] font-bold">R$</span>
                    <span>{Number(valorKmTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 5: Equipamentos Utilizados (com Baixa de Estoque) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Equipamentos Utilizados (Baixa do Estoque do Técnico)
              </label>
              <span className="text-[10px] text-slate-400 font-bold">
                Saldo atual com o técnico
              </span>
            </div>

            {tecnicoAtivo?.equipamentos && tecnicoAtivo.equipamentos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tecnicoAtivo.equipamentos.map(eq => {
                  const sel = equipamentosSelecionados.find(e => e.modelo === eq.modelo_equipamento);
                  const isChecked = Boolean(sel);
                  const qtdDisponivel = eq.quantidade || 0;

                  return (
                    <div
                      key={eq.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        isChecked 
                          ? 'bg-teal-50/70 border-teal-300 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEquipamento(eq.modelo_equipamento, qtdDisponivel)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 block truncate">
                            {eq.modelo_equipamento}
                          </span>
                          <span className={`text-[10px] font-bold block ${
                            qtdDisponivel > 0 ? 'text-teal-700' : 'text-rose-600'
                          }`}>
                            Saldo: {qtdDisponivel} un
                          </span>
                        </div>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-slate-500">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            max={Math.max(1, qtdDisponivel)}
                            value={sel.quantidade}
                            onChange={(e) => handleUpdateQtdEquipamento(eq.modelo_equipamento, e.target.value)}
                            className="w-14 px-2 py-1 bg-white border border-teal-300 focus:border-teal-500 rounded-lg text-xs font-black text-teal-900 text-center outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-semibold">
                Nenhum equipamento cadastrado no estoque deste técnico.
              </div>
            )}
          </div>

          {/* Seção 6: Informações Adicionais (NF & Status) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Número da Nota Fiscal (NF)
              </label>
              <input
                type="text"
                value={numeroNf}
                onChange={(e) => setNumeroNf(e.target.value)}
                placeholder="Ex: NF-10492"
                className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Status Inicial da O.S.
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
              >
                <option value="Agendado">Agendado</option>
                <option value="Aguardando data">Aguardando Data</option>
                <option value="Realizado">Realizado (Baixa imediata de estoque) ✅</option>
              </select>
            </div>
          </div>

          {/* Banner de Resumo Financeiro */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 block">
                Composição Financeira da O.S.
              </span>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span className="whitespace-nowrap">Serviço: <strong>R$&nbsp;{Number(valorServico).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                {teveKm && <span className="whitespace-nowrap">KM ({kmQuantidade} × R$&nbsp;{Number(valorKmUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}): <strong>R$&nbsp;{Number(valorKmTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>}
                {exigeDevolucao && <span className="text-amber-400 font-bold whitespace-nowrap">• Requer devolução de peça</span>}
              </div>
            </div>
            <div className="text-right self-end sm:self-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 block whitespace-nowrap">Valor Total Cobrado</span>
              <span className="text-2xl font-black text-emerald-400 whitespace-nowrap flex items-center justify-end gap-1.5">
                <span className="text-base text-emerald-500 font-bold">R$</span>
                <span>{Number(valorTotalFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{ordemParaEditar ? 'Salvando Alterações...' : 'Gravando O.S...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{ordemParaEditar ? 'Salvar Alterações' : 'Confirmar e Lançar O.S.'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
