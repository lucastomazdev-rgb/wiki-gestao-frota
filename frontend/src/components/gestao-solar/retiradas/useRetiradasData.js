import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { exportRowsToCsv } from '../../../utils/exportCsv';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModelosLookup, useUnidadesLookup } from '../../../hooks/useLookups';
import { buildSyncPayload, formatSyncReportMessage } from '../../../utils/syncImport';
import { INITIAL_SYNC_CONFIG, ITENS_POR_PAGINA } from './constants';

export function useRetiradasData({ avisarMudanca } = {}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('retiradas');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroUF, setFiltroUF] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
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
      status: filtroStatus || undefined,
      placa: debouncedPlaca || undefined
    }),
    [debouncedPlaca, filtroStatus, filtroTipo, filtroUF, filtroUnidade]
  );

  const { data: respostaRetiradas, isLoading: isLoadingRetiradas } = useQuery({
    queryKey: ['retiradas', 'list', paginaAtual, ITENS_POR_PAGINA, filtrosApi],
    queryFn: async () => {
      const response = await api.get('/retiradas', {
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

  const { data: kpisRetiradas } = useQuery({
    queryKey: ['retiradas', 'kpis', filtrosApi],
    queryFn: async () => {
      const response = await api.get('/retiradas/kpis', { params: filtrosApi });
      return response.data;
    },
    staleTime: 1000 * 30
  });

  const retiradas = respostaRetiradas?.data || [];
  const totalRegistros = respostaRetiradas?.pagination?.total || 0;
  const totalPaginasBackend = respostaRetiradas?.pagination?.total_pages || 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [retiradaEmEdicao, setRetiradaEmEdicao] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  const setFiltroStatusWithReset = useCallback((value) => {
    applyFilterWithPageReset(setFiltroStatus, value);
  }, [applyFilterWithPageReset]);

  const setFiltroPlacaWithReset = useCallback((value) => {
    applyFilterWithPageReset(setFiltroPlaca, value);
  }, [applyFilterWithPageReset]);

  const invalidarConsultas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['retiradas'] });
  }, [queryClient]);

  const handleNovoRegistro = useCallback(() => {
    setRetiradaEmEdicao(null);
    setIsModalOpen(true);
  }, []);

  const handleEditarRetirada = useCallback((retirada) => {
    setRetiradaEmEdicao(retirada);
    setIsModalOpen(true);
  }, []);

  const handleSalvarRetirada = useCallback(async (dados) => {
    try {
      if (retiradaEmEdicao?.id) {
        await api.put(`/retiradas/${retiradaEmEdicao.id}`, dados);
        toast.success('Retirada atualizada com sucesso!');
      } else {
        await api.post('/retiradas', dados);
        toast.success('Nova baixa registrada com sucesso!');
      }
      setIsModalOpen(false);
      invalidarConsultas();
      if (avisarMudanca) avisarMudanca();
    } catch (error) {
      toast.error(error.response?.data?.erro || error.response?.data?.message || 'Erro ao salvar registro de retirada.');
    }
  }, [avisarMudanca, invalidarConsultas, retiradaEmEdicao]);

  const handleDelete = useCallback((id) => {
    setConfirmDelete(id);
  }, []);

  const executeDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/retiradas/${confirmDelete}`);
      toast.success('Registro de retirada excluído com sucesso.');
      setConfirmDelete(null);
      invalidarConsultas();
      if (avisarMudanca) avisarMudanca();
    } catch (error) {
      toast.error(error.response?.data?.erro || error.response?.data?.message || 'Erro ao excluir retirada.');
    }
  }, [avisarMudanca, confirmDelete, invalidarConsultas]);

  const handleAbrirImportacao = useCallback(() => {
    setIsImportModalOpen(true);
  }, []);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Sincronizando histórico de retiradas...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const payload = buildSyncPayload(results.data, syncConfig);
          const response = await api.post('/retiradas/lote', payload);
          toast.success(formatSyncReportMessage('Histórico sincronizado com sucesso', response.data?.relatorio), { id: toastId });
          invalidarConsultas();
          if (avisarMudanca) avisarMudanca();
        } catch (error) {
          toast.error(error.response?.data?.erro || error.response?.data?.message || 'Erro ao importar. Verifique o formato do arquivo.', { id: toastId });
        }
      },
      error: () => {
        toast.error('Erro ao processar o arquivo CSV.', { id: toastId });
      }
    });

    event.target.value = null;
  }, [avisarMudanca, invalidarConsultas, syncConfig]);

  const handleExportarExcel = useCallback(async () => {
    const toastId = toast.loading('Gerando relatório de retiradas...');
    try {
      // Buscar todos os registros correspondentes aos filtros atuais
      const response = await api.get('/retiradas', {
        params: {
          paginated: false,
          ...filtrosApi
        }
      });

      const lista = Array.isArray(response.data) ? response.data : (response.data?.data || []);

      if (lista.length === 0) {
        toast.error('Nenhum dado encontrado para exportar com os filtros atuais.', { id: toastId });
        return;
      }

      const dataToExport = lista.map((r) => ({
        'Cód. Cliente': r.unidades_clientes?.cod_cliente || '-',
        'Placa': r.placa,
        'Unidade': r.unidades_clientes?.nome_unidade || '-',
        'UF': r.unidades_clientes?.uf || '-',
        'Tipo Veículo': r.modelos_rastreadores?.tipo_veiculo || '-',
        'Modelo Rastreador': r.modelos_rastreadores?.nome_modelo || '-',
        'Status': r.status || 'Retirado',
        'Data da Baixa': r.data_retirada ? new Date(r.data_retirada).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-',
        'Taxa Cobrada': r.status === 'Retirado'
          ? `R$ ${Number(r.modelos_rastreadores?.valor_instalacao || 0).toFixed(2)}`
          : 'R$ 0,00',
        'Motivo': r.motivo || '-'
      }));

      const dateStr = new Date().toISOString().split('T')[0];
      exportRowsToCsv(dataToExport, `Relatorio_Retiradas_${dateStr}.csv`);
      toast.success('Relatório CSV exportado com sucesso!', { id: toastId });
    } catch (error) {
      toast.error('Erro ao gerar relatório CSV.', { id: toastId });
    }
  }, [filtrosApi]);

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
    filtroStatus,
    setFiltroStatus: setFiltroStatusWithReset,
    filtroPlaca,
    setFiltroPlaca: setFiltroPlacaWithReset,
    paginaAtual,
    setPaginaAtual,
    isLoadingRetiradas,
    kpisRetiradas,
    retiradas,
    totalRegistros,
    totalPaginasBackend,
    unidadesLookup,
    modelosLookup,
    isModalOpen,
    setIsModalOpen,
    retiradaEmEdicao,
    confirmDelete,
    setConfirmDelete,
    isImportModalOpen,
    setIsImportModalOpen,
    setSyncConfig,
    handleNovoRegistro,
    handleEditarRetirada,
    handleSalvarRetirada,
    handleDelete,
    executeDelete,
    handleAbrirImportacao,
    handleFileUpload,
    handleExportarExcel,
    invalidarConsultas
  };
}
