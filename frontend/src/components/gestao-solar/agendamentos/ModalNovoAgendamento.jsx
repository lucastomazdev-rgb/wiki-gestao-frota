import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Truck, 
  User, 
  Phone, 
  FileText, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Building2, 
  MapPin, 
  Loader2,
  ShieldCheck,
  Users
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const SERVICOS_OPCOES = ['Retirada', 'Manutenção', 'Instalação', 'Vistoria'];
const STATUS_OPCOES = ['Agendado', 'Aguardando Data', 'Aguardando Técnico', 'Realizado', 'Frustrado'];

const formatPhone = (val) => {
  const digits = String(val || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const formatPlate = (val) => {
  return String(val || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
};

export default function ModalNovoAgendamento({
  isOpen,
  onClose,
  agendamentoParaEditar = null,
  onSuccess
}) {
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [placa, setPlaca] = useState('');
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [placaStatus, setPlacaStatus] = useState(null);

  const [unidade, setUnidade] = useState('');
  const [uf, setUf] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');

  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [numeroOs, setNumeroOs] = useState('');
  const [servico, setServico] = useState('Manutenção');

  const [tipoTecnico, setTipoTecnico] = useState('CORPVS'); // 'CORPVS' | 'TERCEIRIZADO'
  const [tecnicoId, setTecnicoId] = useState('');

  const [status, setStatus] = useState('Agendado');
  const [motivoFrustrado, setMotivoFrustrado] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Listas de técnicos
  const [tecnicosCorpvs, setTecnicosCorpvs] = useState([]);
  const [tecnicosTerceirizados, setTecnicosTerceirizados] = useState([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);

  // Mini-modal / Inline para adicionar técnico CORPVS com o botão "+"
  const [showAddCorpvs, setShowAddCorpvs] = useState(false);
  const [novoCorpvsNome, setNovoCorpvsNome] = useState('');
  const [salvandoCorpvs, setSalvandoCorpvs] = useState(false);

  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false);

  // Carregar listas de técnicos
  const carregarTecnicos = async () => {
    try {
      setLoadingTecnicos(true);
      const [resCorpvs, resTerc] = await Promise.all([
        api.get('/gestao-solar/tecnicos-corpvs'),
        api.get('/gestao-solar/tecnicos')
      ]);

      const listaCorpvs = resCorpvs.data?.data?.tecnicos || [];
      const listaTerc = resTerc.data?.data?.tecnicos || [];

      setTecnicosCorpvs(listaCorpvs);
      setTecnicosTerceirizados(listaTerc);

      return { listaCorpvs, listaTerc };
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar lista de técnicos.');
      return { listaCorpvs: [], listaTerc: [] };
    } finally {
      setLoadingTecnicos(false);
    }
  };

  // Limpeza síncrona e imediata de todos os estados do formulário
  const resetarFormulario = () => {
    setDataAgendamento('');
    setPlaca('');
    setPlacaStatus(null);
    setUnidade('');
    setUf('');
    setTipoVeiculo('');
    setNomeResponsavel('');
    setContatoResponsavel('');
    setNumeroOs('');
    setServico('Manutenção');
    setTipoTecnico('CORPVS');
    setTecnicoId('');
    setStatus('Agendado');
    setMotivoFrustrado('');
    setObservacoes('');
    setShowAddCorpvs(false);
    setNovoCorpvsNome('');
  };

  const handleFechar = () => {
    resetarFormulario();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetarFormulario();
      return;
    }

    setShowAddCorpvs(false);
    setNovoCorpvsNome('');

    // Preenchimento ou Reset SÍNCRONO E IMEDIATO (0ms de delay)
    if (agendamentoParaEditar) {
      setDataAgendamento(agendamentoParaEditar.data_agendamento ? agendamentoParaEditar.data_agendamento.slice(0, 10) : '');
      setPlaca(agendamentoParaEditar.placa || '');
      setUnidade(agendamentoParaEditar.unidade || '');
      setUf(agendamentoParaEditar.uf || '');
      setTipoVeiculo(agendamentoParaEditar.tipo_veiculo || '');
      setNomeResponsavel(agendamentoParaEditar.nome_responsavel || '');
      setContatoResponsavel(formatPhone(agendamentoParaEditar.contato_responsavel || ''));
      setNumeroOs(agendamentoParaEditar.numero_os || '');
      setServico(agendamentoParaEditar.servico || 'Manutenção');
      setTipoTecnico(agendamentoParaEditar.tipo_tecnico || 'CORPVS');
      setTecnicoId(agendamentoParaEditar.tipo_tecnico === 'TERCEIRIZADO' 
        ? (agendamentoParaEditar.tecnico_terceirizado_id || '') 
        : (agendamentoParaEditar.tecnico_corpvs_id || ''));
      setStatus(agendamentoParaEditar.status || 'Agendado');
      setMotivoFrustrado(agendamentoParaEditar.motivo_frustrado || '');
      setObservacoes(agendamentoParaEditar.observacoes || '');
      setPlacaStatus(null);
    } else {
      resetarFormulario();
    }

    // Carregar lista de técnicos em segundo plano sem bloquear a inicialização dos campos
    carregarTecnicos().then(({ listaCorpvs }) => {
      if (!agendamentoParaEditar) {
        setTecnicoId(prev => prev || (listaCorpvs && listaCorpvs.length > 0 ? listaCorpvs[0].id : ''));
      }
    });
  }, [isOpen, agendamentoParaEditar]);

  // Se trocar o tipo de técnico, ajusta o primeiro id selecionado
  const handleTrocaTipoTecnico = (novoTipo) => {
    setTipoTecnico(novoTipo);
    if (novoTipo === 'CORPVS') {
      setTecnicoId(tecnicosCorpvs.length > 0 ? tecnicosCorpvs[0].id : '');
    } else {
      setTecnicoId(tecnicosTerceirizados.length > 0 ? tecnicosTerceirizados[0].id : '');
    }
  };

  // Autocomplete da Placa com dados da unidade e responsável principal
  const buscarDadosPlaca = async (placaValor) => {
    const limpa = formatPlate(placaValor);
    if (!limpa || limpa.length < 5) return;

    try {
      setBuscandoPlaca(true);
      const res = await api.get(`/gestao-solar/veiculos/buscar-placa/${limpa}`);
      if (res.data?.found && res.data?.data) {
        const d = res.data.data;
        setUnidade(d.unidade || '');
        setUf(d.uf || '');
        setTipoVeiculo(d.tipo_veiculo || '');

        // Preenche o responsável principal daquela unidade se cadastrado; caso contrário, deixa em branco
        if (d.nome_responsavel) {
          setNomeResponsavel(d.nome_responsavel);
        } else {
          setNomeResponsavel('');
        }

        if (d.contato_responsavel) {
          setContatoResponsavel(formatPhone(d.contato_responsavel));
        } else {
          setContatoResponsavel('');
        }

        setPlacaStatus({
          found: true,
          message: `Veículo identificado: ${d.unidade || 'Solar'} (${d.uf || 'BR'})`
        });
      } else {
        setPlacaStatus({
          found: false,
          message: 'Placa não cadastrada previamente na frota. Preencha os campos abaixo.'
        });
        setUnidade('');
        setUf('');
        setTipoVeiculo('');
        setNomeResponsavel('');
        setContatoResponsavel('');
      }
    } catch {
      setPlacaStatus(null);
    } finally {
      setBuscandoPlaca(false);
    }
  };

  const handlePlacaChange = (e) => {
    const val = formatPlate(e.target.value);
    setPlaca(val);

    if (val.length >= 7) {
      buscarDadosPlaca(val);
    } else {
      setPlacaStatus(null);
      // Ao apagar a placa ou reduzir abaixo do tamanho mínimo, limpa os campos automáticos
      if (val.length === 0) {
        setUnidade('');
        setUf('');
        setTipoVeiculo('');
        setNomeResponsavel('');
        setContatoResponsavel('');
      }
    }
  };

  // Cadastrar Técnico CORPVS rapidamente pelo botão "+"
  const handleCriarTecnicoCorpvs = async (e) => {
    e.preventDefault();
    if (!novoCorpvsNome || novoCorpvsNome.trim().length < 2) {
      toast.error('Informe o nome do técnico (mínimo 2 caracteres).');
      return;
    }

    try {
      setSalvandoCorpvs(true);
      const res = await api.post('/gestao-solar/tecnicos-corpvs', {
        nome: novoCorpvsNome.trim()
      });

      const tecnicoCriado = res.data?.data?.tecnico;
      toast.success(res.data?.message || 'Técnico CORPVS cadastrado com sucesso!');

      // Atualiza lista e já seleciona
      setTecnicosCorpvs(prev => {
        const filtrado = prev.filter(t => t.id !== tecnicoCriado.id);
        const nova = [...filtrado, tecnicoCriado].sort((a, b) => a.nome.localeCompare(b.nome));
        return nova;
      });

      setTecnicoId(tecnicoCriado.id);
      setNovoCorpvsNome('');
      setShowAddCorpvs(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao cadastrar técnico CORPVS.');
    } finally {
      setSalvandoCorpvs(false);
    }
  };

  // Submissão do Agendamento
  const handleSubmit = async (e) => {
    e.preventDefault();

    const limpaPlaca = formatPlate(placa);
    if (!limpaPlaca || limpaPlaca.length < 5) {
      toast.error('A placa é obrigatória (mínimo 5 caracteres).');
      return;
    }

    if (!nomeResponsavel.trim()) {
      toast.error('Informe o nome do responsável.');
      return;
    }

    const limpaContato = contatoResponsavel.replace(/\D/g, '');
    if (!limpaContato || limpaContato.length < 10) {
      toast.error('Informe o número com DDD e 9 dígitos (ex: 85 9 9999-9999).');
      return;
    }

    if (!tecnicoId) {
      toast.error('Selecione um técnico.');
      return;
    }

    if (status === 'Frustrado' && !motivoFrustrado.trim()) {
      toast.error('Informe o motivo pelo qual o agendamento foi frustrado.');
      return;
    }

    const payload = {
      data_agendamento: dataAgendamento || null,
      placa: limpaPlaca,
      unidade: unidade.trim() || null,
      uf: uf.trim() ? uf.trim().toUpperCase() : null,
      tipo_veiculo: tipoVeiculo.trim() || null,
      nome_responsavel: nomeResponsavel.trim(),
      contato_responsavel: contatoResponsavel.trim(),
      numero_os: numeroOs.trim() || null,
      servico,
      tipo_tecnico: tipoTecnico,
      tecnico_id: tecnicoId,
      status,
      motivo_frustrado: status === 'Frustrado' ? motivoFrustrado.trim() : null,
      observacoes: observacoes.trim() || null
    };

    try {
      setSalvandoAgendamento(true);

      if (agendamentoParaEditar) {
        await api.put(`/gestao-solar/agendamentos/${agendamentoParaEditar.id}`, payload);
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        await api.post('/gestao-solar/agendamentos', payload);
        toast.success('Agendamento registrado com sucesso!');
      }

      resetarFormulario();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar agendamento.');
    } finally {
      setSalvandoAgendamento(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                {agendamentoParaEditar ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h3>
              <p className="text-xs text-slate-400">
                Preencha os dados operacionais da visita ou manutenção do veículo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFechar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Linha 1: Placa (Auto-Preenchimento) & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Placa do Veículo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={placa}
                  onChange={handlePlacaChange}
                  onBlur={() => buscarDadosPlaca(placa)}
                  placeholder="EX: ABC1D23"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 uppercase tracking-wider focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <Truck className="absolute left-3 top-3 text-slate-400" size={18} />
                {buscandoPlaca && (
                  <Loader2 className="absolute right-3 top-3 text-teal-600 animate-spin" size={18} />
                )}
              </div>

              {placaStatus && (
                <div className={`mt-1.5 text-[11px] font-medium flex items-center gap-1.5 ${
                  placaStatus.found ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {placaStatus.found ? <CheckCircle2 size={13} className="shrink-0" /> : <AlertTriangle size={13} className="shrink-0" />}
                  <span>{placaStatus.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Data do Agendamento <span className="text-slate-400 font-normal lowercase">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dataAgendamento}
                  onChange={(e) => setDataAgendamento(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          {/* Linha 2: Unidade, UF & Tipo Veículo (Preenchidos automaticamente) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Unidade
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  placeholder="Ex: Fortaleza"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                />
                <Building2 className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                UF
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={uf}
                  maxLength={2}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  placeholder="CE"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 uppercase"
                />
                <MapPin className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tipo Veículo
              </label>
              <input
                type="text"
                value={tipoVeiculo}
                onChange={(e) => setTipoVeiculo(e.target.value)}
                placeholder="Ex: CAMINHÃO / MOTO"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Linha 3: Responsável & Número (com máscara) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Responsável <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Nome do contato local"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Número de Contato <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contatoResponsavel}
                  onChange={(e) => setContatoResponsavel(formatPhone(e.target.value))}
                  placeholder="(85) 9 9999-9999"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          {/* Linha 4: O.S. (Opcional) & Serviço (Obrigatório) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ordem de Serviço (O.S.) <span className="text-slate-400 font-normal lowercase">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={numeroOs}
                  onChange={(e) => setNumeroOs(e.target.value)}
                  placeholder="Ex: OS-2026-9812"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Serviço <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={servico}
                  onChange={(e) => setServico(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  {SERVICOS_OPCOES.map((srv) => (
                    <option key={srv} value={srv}>{srv}</option>
                  ))}
                </select>
                <Wrench className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          {/* Linha 5: Seletor de Tipo de Técnico & Dropdown com Botão "+" */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Técnico Responsável <span className="text-red-500">*</span>
              </label>

              {/* Toggle CORPVS vs Terceirizado */}
              <div className="inline-flex p-1 bg-slate-200 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleTrocaTipoTecnico('CORPVS')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    tipoTecnico === 'CORPVS'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Próprio CORPVS
                </button>
                <button
                  type="button"
                  onClick={() => handleTrocaTipoTecnico('TERCEIRIZADO')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    tipoTecnico === 'TERCEIRIZADO'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terceirizado
                </button>
              </div>
            </div>

            {/* Dropdown do Técnico */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="" disabled>Selecione o técnico...</option>
                  {tipoTecnico === 'CORPVS' ? (
                    tecnicosCorpvs.map((tec) => (
                      <option key={tec.id} value={tec.id}>{tec.nome}</option>
                    ))
                  ) : (
                    tecnicosTerceirizados.map((tec) => (
                      <option key={tec.id} value={tec.id}>
                        {tec.nome} {tec.regiao ? `(${tec.regiao})` : ''} {tec.homologado ? '★ Homologado' : ''}
                      </option>
                    ))
                  )}
                </select>
                <Users className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>

              {/* Botão "+" para adicionar técnico CORPVS persistente */}
              {tipoTecnico === 'CORPVS' && (
                <button
                  type="button"
                  onClick={() => setShowAddCorpvs(prev => !prev)}
                  className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                  title="Cadastrar novo técnico CORPVS"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Adicionar</span>
                </button>
              )}
            </div>

            {/* Mini formulário inline para o botão "+" de técnico CORPVS */}
            {showAddCorpvs && tipoTecnico === 'CORPVS' && (
              <div className="mt-3 p-3 bg-white rounded-xl border border-teal-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-800">
                    Cadastrar Novo Técnico CORPVS (Persistente)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCorpvs(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={novoCorpvsNome}
                    onChange={(e) => setNovoCorpvsNome(e.target.value)}
                    placeholder="Ex: Cleison Gomes"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    disabled={salvandoCorpvs}
                    onClick={handleCriarTecnicoCorpvs}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {salvandoCorpvs ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Linha 6: Status & Motivo Frustrado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status do Agendamento <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                {STATUS_OPCOES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {status === 'Frustrado' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5">
                  Motivo do Insucesso / Frustrado <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motivoFrustrado}
                  onChange={(e) => setMotivoFrustrado(e.target.value)}
                  placeholder="Descreva o motivo (ex: veículo ausente na unidade, cliente cancelou, falta de sinal celular)"
                  rows={2}
                  className="w-full px-3 py-2 bg-red-50/50 border border-red-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações Gerais <span className="text-slate-400 font-normal lowercase">(opcional)</span>
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções para o técnico, pontos de referência ou detalhes do problema"
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer do Modal */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleFechar}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoAgendamento}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {salvandoAgendamento && <Loader2 size={16} className="animate-spin" />}
              <span>{agendamentoParaEditar ? 'Salvar Alterações' : 'Criar Agendamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
