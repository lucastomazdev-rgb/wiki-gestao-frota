import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useModelosLookup, useUnidadesLookup } from '../../hooks/useLookups';
import { buildSyncPayload, formatSyncReportMessage } from '../../utils/syncImport';
import { INITIAL_SYNC_CONFIG, ITENS_POR_PAGINA } from './constants';

export function useTabelaVeiculosData({ avisarMudanca }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('veiculos');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroUF, setFiltroUF] = useState('');
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const applyFilterWithPageReset = useCallback((setter, value) => {
    setPaginaAtual(1);
    setter(value);
  }, []);

  const debouncedPlaca = useDebounce(filtroPlaca, 300);
  const { data: unidadesLookup = [] } = useUnidadesLookup();
  const { data: modelosLookup = [] } = useModelosLookup();
  const fileInputRef = useRef(null);

  const filtrosApi = useMemo(
    () => ({
      unidade: filtroUnidade || undefined,
      uf: filtroUF || undefined,
      tipo: filtroTipo || undefined,
      placa: debouncedPlaca || undefined
    }),
    [debouncedPlaca, filtroTipo, filtroUF, filtroUnidade]
  );

  const { data: respostaInstalacoes, isLoading: isLoadingVeiculos } = useQuery({
    queryKey: ['instalacoes', 'list', paginaAtual, ITENS_POR_PAGINA, filtrosApi],
    queryFn: async () => {
      const response = await api.get('/instalacoes', {
        params: {
          paginated: true,
          page: paginaAtual,
          limit: ITENS_POR_PAGINA,
          ...filtrosApi
        }
      });
      return response.data;
    },
    staleTime: 1000 * 30
  });

  const { data: kpisInstalacoes } = useQuery({
    queryKey: ['instalacoes', 'kpis', filtrosApi],
    queryFn: async () => {
      const response = await api.get('/instalacoes/kpis', { params: filtrosApi });
      return response.data;
    },
    staleTime: 1000 * 30
  });

  const veiculos = respostaInstalacoes?.data || [];
  const totalRegistros = respostaInstalacoes?.pagination?.total || 0;
  const totalPaginasBackend = respostaInstalacoes?.pagination?.total_pages || 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [veiculoEmEdicao, setVeiculoEmEdicao] = useState(null);
  const [isRetiradaModalOpen, setIsRetiradaModalOpen] = useState(false);
  const [veiculoParaRetirar, setVeiculoParaRetirar] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [unidadesLista, setUnidadesLista] = useState([]);
  const [unidadeOrigem, setUnidadeOrigem] = useState('');
  const [unidadeDestino, setUnidadeDestino] = useState('');
  const [placasOrigem, setPlacasOrigem] = useState([]);
  const [placasSelecionadas, setPlacasSelecionadas] = useState(new Set());
  const [transferindo, setTransferindo] = useState(false);
  const [filtroPlacaTransfer, setFiltroPlacaTransfer] = useState('');
  const [filtroTipoTransfer, setFiltroTipoTransfer] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportRulesAccepted, setIsImportRulesAccepted] = useState(false);
  const [syncConfig, setSyncConfig] = useState(INITIAL_SYNC_CONFIG);

  const setFiltroUnidadeWithReset = useCallback((value) => {
    applyFilterWithPageReset(setFiltroUnidade, value);
  }, [applyFilterWithPageReset]);

  const setFiltroTipoWithReset = useCallback((value) => {
    applyFilterWithPageReset(setFiltroTipo, value);
  }, [applyFilterWithPageReset]);

  const setFiltroUFWithReset = useCallback((value) => {
    applyFilterWithPageReset(setFiltroUF, value);
  }, [applyFilterWithPageReset]);

  const setFiltroPlacaWithReset = useCallback((value) => {
    applyFilterWithPageReset(setFiltroPlaca, value);
  }, [applyFilterWithPageReset]);

  const carregarVeiculosSync = () => {
    queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
  };

  const handleAbrirImportacao = async () => {
    setIsImportRulesAccepted(false);
    setUnidadesLista(unidadesLookup);
    setIsImportModalOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const executeDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/instalacoes/${id}`);
      toast.success('Instalação excluída com sucesso!');
      carregarVeiculosSync();
      if (avisarMudanca) avisarMudanca();
    } catch {
      toast.error('Erro ao excluir. Tente novamente.');
    }
  };

  const handleNovoVeiculo = () => {
    setVeiculoEmEdicao(null);
    setIsModalOpen(true);
  };

  const handleEditarVeiculo = (veiculo) => {
    setVeiculoEmEdicao(veiculo);
    setIsModalOpen(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Sincronizando frota com o banco de dados. Aguarde...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: async (results) => {
        try {
          const payload = buildSyncPayload(results.data, syncConfig);
          const response = await api.post('/instalacoes/sync', payload);
          toast.success(formatSyncReportMessage('Frota atualizada', response.data?.relatorio), { id: toastId });
          carregarVeiculosSync();
          if (avisarMudanca) avisarMudanca();
        } catch (error) {
          toast.error(error.response?.data?.erro || 'Erro ao sincronizar. Verifique a formatação do CSV.', { id: toastId });
        }
        event.target.value = null;
      }
    });
  };

  const handleExportarExcel = async () => {
    if (totalRegistros === 0) {
      toast.error('Não há dados para exportar com os filtros atuais.');
      return;
    }

    const { data } = await api.get('/instalacoes', { params: filtrosApi });
    const baseExport = Array.isArray(data) ? data : [];

    const dadosFormatados = baseExport.map((veiculo) => ({
      'ID do Veículo': veiculo.descricao_veiculo,
      Placa: veiculo.placa,
      Módulo: veiculo.modulo,
      Operação: veiculo.operacao,
      'Data de Instalação': veiculo.data_instalacao,
      'Razão Social': veiculo.unidades_clientes?.razao_social || 'N/A',
      UF: veiculo.unidades_clientes?.uf || 'N/A',
      'Tipo de Veículo': veiculo.modelos_rastreadores?.tipo_veiculo || 'N/A',
      'Modelo do Rastreador': veiculo.modelos_rastreadores?.nome_modelo || 'N/A',
      'Mensalidade (R$)': Number(veiculo.modelos_rastreadores?.valor_mensalidade || 0).toFixed(2),
      'Instalação (R$)': Number(veiculo.modelos_rastreadores?.valor_instalacao || 0).toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Frotas');
    XLSX.writeFile(workbook, 'Relatório_Veículos_Solar.xlsx');
  };

  const handleAbrirRetirada = (veiculo) => {
    setVeiculoParaRetirar(veiculo);
    setIsRetiradaModalOpen(true);
  };

  const handleConfirmarRetirada = async (status, dataRetirada) => {
    try {
      await api.post(`/instalacoes/${veiculoParaRetirar.id}/retirar`, {
        placa: veiculoParaRetirar.placa,
        status,
        data_retirada: dataRetirada
      });
      toast.success('Veículo retirado com sucesso!');
      setIsRetiradaModalOpen(false);
      carregarVeiculosSync();
      queryClient.invalidateQueries({ queryKey: ['retiradas'] });
      if (avisarMudanca) avisarMudanca();
    } catch {
      toast.error('Erro ao registrar retirada.');
    }
  };

  const handleAbrirTransfer = async () => {
    setUnidadesLista(unidadesLookup);
    setUnidadeOrigem('');
    setUnidadeDestino('');
    setPlacasOrigem([]);
    setPlacasSelecionadas(new Set());
    setFiltroPlacaTransfer('');
    setFiltroTipoTransfer('');
    setIsTransferOpen(true);
  };

  const handleSelecionarOrigem = async (unidadeId) => {
    setUnidadeOrigem(unidadeId);
    setPlacasSelecionadas(new Set());
    if (!unidadeId) {
      setPlacasOrigem([]);
      return;
    }
    try {
      const resposta = await api.get('/instalacoes', {
        params: {
          paginated: true,
          page: 1,
          limit: 100,
          unidade_id: unidadeId
        }
      });
      setPlacasOrigem(Array.isArray(resposta.data?.data) ? resposta.data.data : []);
    } catch {
      setPlacasOrigem([]);
    }
  };

  const togglePlaca = (id) => {
    setPlacasSelecionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExecutarTransfer = async () => {
    if (!unidadeDestino || placasSelecionadas.size === 0) {
      toast.error('Selecione ao menos uma placa e a unidade de destino.');
      return;
    }
    if (unidadeOrigem === unidadeDestino) {
      toast.error('A unidade de destino deve ser diferente da origem.');
      return;
    }
    setTransferindo(true);
    const toastId = toast.loading(`Transferindo ${placasSelecionadas.size} veículo(s)...`);
    try {
      const promises = Array.from(placasSelecionadas).map((id) => {
        const veiculo = veiculos.find((item) => item.id === id);
        return api.put(`/instalacoes/${id}`, {
          placa: veiculo?.placa,
          unidade_id: unidadeDestino
        });
      });
      await Promise.all(promises);
      const nomeDestino = unidadesLista.find((item) => String(item.id) === String(unidadeDestino))?.nome_unidade || 'Nova Unidade';
      toast.success(`${placasSelecionadas.size} veículo(s) transferido(s) para ${nomeDestino}!`, { id: toastId });
      setIsTransferOpen(false);
      carregarVeiculosSync();
      if (avisarMudanca) avisarMudanca();
    } catch {
      toast.error('Erro ao transferir. Verifique a conexão.', { id: toastId });
    } finally {
      setTransferindo(false);
    }
  };

  return {
    fileInputRef,
    activeTab,
    setActiveTab,
    filtroUnidade,
    setFiltroUnidade: setFiltroUnidadeWithReset,
    filtroTipo,
    setFiltroTipo: setFiltroTipoWithReset,
    filtroUF,
    setFiltroUF: setFiltroUFWithReset,
    filtroPlaca,
    setFiltroPlaca: setFiltroPlacaWithReset,
    paginaAtual,
    setPaginaAtual,
    filtrosApi,
    isLoadingVeiculos,
    kpisInstalacoes,
    veiculos,
    totalRegistros,
    totalPaginasBackend,
    unidadesLookup,
    modelosLookup,
    isModalOpen,
    setIsModalOpen,
    veiculoEmEdicao,
    isRetiradaModalOpen,
    setIsRetiradaModalOpen,
    veiculoParaRetirar,
    confirmDelete,
    setConfirmDelete,
    isTransferOpen,
    setIsTransferOpen,
    unidadesLista,
    unidadeOrigem,
    unidadeDestino,
    setUnidadeDestino,
    placasOrigem,
    placasSelecionadas,
    setPlacasSelecionadas,
    transferindo,
    filtroPlacaTransfer,
    setFiltroPlacaTransfer,
    filtroTipoTransfer,
    setFiltroTipoTransfer,
    isImportModalOpen,
    setIsImportModalOpen,
    isImportRulesAccepted,
    setIsImportRulesAccepted,
    syncConfig,
    setSyncConfig,
    handleAbrirImportacao,
    carregarVeiculosSync,
    handleDelete,
    executeDelete,
    handleNovoVeiculo,
    handleEditarVeiculo,
    handleFileUpload,
    handleExportarExcel,
    handleAbrirRetirada,
    handleConfirmarRetirada,
    handleAbrirTransfer,
    handleSelecionarOrigem,
    togglePlaca,
    handleExecutarTransfer
  };
}
