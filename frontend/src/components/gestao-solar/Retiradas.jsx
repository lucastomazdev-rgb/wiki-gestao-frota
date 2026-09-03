import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import ModalInstrucoesImportacaoRetiradas from './ModalInstrucoesImportacaoRetiradas';
import ModalFormularioRetirada from './retiradas/ModalFormularioRetirada';
import RetiradasHeaderSection from './retiradas/RetiradasHeaderSection';
import RetiradasListView from './retiradas/RetiradasListView';
import RetiradasPagination from './retiradas/RetiradasPagination';
import { useRetiradasData } from './retiradas/useRetiradasData';
import { useRetiradasDerivedData } from './retiradas/useRetiradasDerivedData';

export default function Retiradas({ avisarMudanca } = {}) {
  const { getNomePerfil } = useAuth();
  const isSupervisor = getNomePerfil() === 'Supervisor';

  const {
    fileInputRef,
    filtroUnidade,
    setFiltroUnidade,
    filtroTipo,
    setFiltroTipo,
    filtroUF,
    setFiltroUF,
    filtroStatus,
    setFiltroStatus,
    filtroPlaca,
    setFiltroPlaca,
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
    handleExportarExcel
  } = useRetiradasData({ avisarMudanca });

  const {
    unidadesDisponiveis,
    ufsDisponiveis,
    tiposDisponiveis,
    statusDisponiveis,
    countCaminhoes,
    countMotos,
    countVideos,
    volumeBaixas,
    receitaTaxas,
    totalPaginas,
    getPaginasExibidas,
    indexPrimeiro,
    indexUltimo,
    retiradasPaginadas
  } = useRetiradasDerivedData({
    unidadesLookup,
    modelosLookup,
    kpisRetiradas,
    totalPaginasBackend,
    totalRegistros,
    paginaAtual,
    retiradas
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden animate-in fade-in duration-500">
        <RetiradasHeaderSection
          totalRegistros={totalRegistros}
          volumeBaixas={volumeBaixas}
          receitaTaxas={receitaTaxas}
          unidadesDisponiveis={unidadesDisponiveis}
          filtroUnidade={filtroUnidade}
          setFiltroUnidade={setFiltroUnidade}
          ufsDisponiveis={ufsDisponiveis}
          filtroUF={filtroUF}
          setFiltroUF={setFiltroUF}
          tiposDisponiveis={tiposDisponiveis}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          statusDisponiveis={statusDisponiveis}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          filtroPlaca={filtroPlaca}
          setFiltroPlaca={setFiltroPlaca}
          countCaminhoes={countCaminhoes}
          countMotos={countMotos}
          countVideos={countVideos}
          onNovoRegistro={handleNovoRegistro}
          isSupervisor={isSupervisor}
          fileInputRef={fileInputRef}
          onFileUpload={handleFileUpload}
          onAbrirImportacao={handleAbrirImportacao}
          onExportarExcel={handleExportarExcel}
        />

        <RetiradasListView
          retiradasPaginadas={retiradasPaginadas}
          isLoadingRetiradas={isLoadingRetiradas}
          onEditarRetirada={handleEditarRetirada}
          onDelete={handleDelete}
        />

        <RetiradasPagination
          totalPaginas={totalPaginas}
          indexPrimeiro={indexPrimeiro}
          indexUltimo={indexUltimo}
          totalRegistros={totalRegistros}
          paginaAtual={paginaAtual}
          setPaginaAtual={setPaginaAtual}
          getPaginasExibidas={getPaginasExibidas}
        />

        <ModalFormularioRetirada
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          retirada={retiradaEmEdicao}
          unidadesLookup={unidadesLookup}
          modelosLookup={modelosLookup}
          onSalvar={handleSalvarRetirada}
        />

        <ConfirmModal
          isOpen={!!confirmDelete}
          title="Excluir Registro de Baixa"
          message="Tem certeza que deseja excluir este registro de retirada? Esta ação removerá o histórico desta desativação."
          confirmLabel="Sim, Excluir"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />

        <ModalInstrucoesImportacaoRetiradas
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          unidades={unidadesLookup}
          onConfirm={(config) => {
            setSyncConfig(config);
            setIsImportModalOpen(false);
            setTimeout(() => fileInputRef.current?.click(), 100);
          }}
        />
      </div>
    </div>
  );
}
