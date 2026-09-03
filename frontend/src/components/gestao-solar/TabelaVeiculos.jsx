import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import GestaoUnidades from './GestaoUnidades';
import ModalFormulario from './ModalFormulario';
import ModalInstrucoesImportacao from './ModalInstrucoesImportacao';
import ModalRetirada from './ModalRetirada';
import TabelaVeiculosHeaderSection from './tabela-veiculos/TabelaVeiculosHeaderSection';
import TabelaVeiculosListView from './tabela-veiculos/TabelaVeiculosListView';
import TabelaVeiculosPagination from './tabela-veiculos/TabelaVeiculosPagination';
import TabelaVeiculosTransferModal from './tabela-veiculos/TabelaVeiculosTransferModal';
import ModalTimeline from './tabela-veiculos/ModalTimeline';
import { useTabelaVeiculosData } from './tabela-veiculos/useTabelaVeiculosData';
import { useTabelaVeiculosDerivedData } from './tabela-veiculos/useTabelaVeiculosDerivedData';

export default function TabelaVeiculos({ avisarMudanca }) {
  const { getNomePerfil } = useAuth();
  const isSupervisor = getNomePerfil() === 'Supervisor';
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const {
    fileInputRef,
    activeTab,
    setActiveTab,
    filtroUnidade,
    setFiltroUnidade,
    filtroTipo,
    setFiltroTipo,
    filtroUF,
    setFiltroUF,
    filtroPlaca,
    setFiltroPlaca,
    paginaAtual,
    setPaginaAtual,
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
  } = useTabelaVeiculosData({ avisarMudanca });

  const {
    unidadesDisponiveis,
    ufsDisponiveis,
    tiposDisponiveis,
    countCaminhoes,
    countMotos,
    countVideos,
    totalPaginas,
    getPaginasExibidas,
    indexPrimeiro,
    indexUltimo,
    veiculosPaginados,
    placasFiltradas,
    toggleTodas,
    nomeUnidadeOrigem,
    nomeUnidadeDestino
  } = useTabelaVeiculosDerivedData({
    unidadesLookup,
    modelosLookup,
    kpisInstalacoes,
    totalPaginasBackend,
    totalRegistros,
    paginaAtual,
    veiculos,
    placasOrigem,
    filtroPlacaTransfer,
    filtroTipoTransfer,
    placasSelecionadas,
    unidadesLista,
    unidadeOrigem,
    unidadeDestino,
    setPlacasSelecionadas
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl w-max animate-in fade-in slide-in-from-top-2">
        <button
          onClick={() => setActiveTab('veiculos')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'veiculos' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
        >
          Frota Operacional
        </button>
        <button
          onClick={() => setActiveTab('unidades')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'unidades' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
        >
          Gestão de Unidades
        </button>
      </div>

      {activeTab === 'veiculos' ? (
        <div className="bg-white p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <TabelaVeiculosHeaderSection
            totalRegistros={totalRegistros}
            unidadesDisponiveis={unidadesDisponiveis}
            filtroUnidade={filtroUnidade}
            setFiltroUnidade={setFiltroUnidade}
            ufsDisponiveis={ufsDisponiveis}
            filtroUF={filtroUF}
            setFiltroUF={setFiltroUF}
            tiposDisponiveis={tiposDisponiveis}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            filtroPlaca={filtroPlaca}
            setFiltroPlaca={setFiltroPlaca}
            countCaminhoes={countCaminhoes}
            countMotos={countMotos}
            countVideos={countVideos}
            onAbrirTransfer={handleAbrirTransfer}
            onNovoVeiculo={handleNovoVeiculo}
            isSupervisor={isSupervisor}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            onAbrirImportacao={handleAbrirImportacao}
            onExportarExcel={handleExportarExcel}
            onOpenTimeline={() => setIsTimelineOpen(true)}
          />

          <TabelaVeiculosListView
            veiculosPaginados={veiculosPaginados}
            isLoadingVeiculos={isLoadingVeiculos}
            onEditarVeiculo={handleEditarVeiculo}
            onAbrirRetirada={handleAbrirRetirada}
            onDelete={handleDelete}
          />

          <TabelaVeiculosPagination
            totalPaginas={totalPaginas}
            indexPrimeiro={indexPrimeiro}
            indexUltimo={indexUltimo}
            totalRegistros={totalRegistros}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            getPaginasExibidas={getPaginasExibidas}
          />

          <ModalFormulario
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            veiculo={veiculoEmEdicao}
            onSaveSuccess={() => {
              if (veiculoEmEdicao) {
                toast.success('Veículo atualizado!');
              } else {
                toast.success('Novo veículo cadastrado!');
              }
              carregarVeiculosSync();
              if (avisarMudanca) avisarMudanca();
            }}
          />

          <ModalRetirada
            isOpen={isRetiradaModalOpen}
            onClose={() => setIsRetiradaModalOpen(false)}
            veiculo={veiculoParaRetirar}
            onConfirm={handleConfirmarRetirada}
          />

          <ConfirmModal
            isOpen={!!confirmDelete}
            title="Excluir Instalação"
            message="Tem certeza que deseja excluir permanentemente esta instalação? Esta ação não pode ser desfeita."
            confirmLabel="Sim, Excluir"
            onConfirm={executeDelete}
            onCancel={() => setConfirmDelete(null)}
          />

          <TabelaVeiculosTransferModal
            isOpen={isTransferOpen}
            transferindo={transferindo}
            setIsTransferOpen={setIsTransferOpen}
            unidadesLista={unidadesLista}
            unidadeOrigem={unidadeOrigem}
            handleSelecionarOrigem={handleSelecionarOrigem}
            unidadeDestino={unidadeDestino}
            setUnidadeDestino={setUnidadeDestino}
            nomeUnidadeOrigem={nomeUnidadeOrigem}
            nomeUnidadeDestino={nomeUnidadeDestino}
            placasFiltradas={placasFiltradas}
            placasSelecionadas={placasSelecionadas}
            toggleTodas={toggleTodas}
            filtroPlacaTransfer={filtroPlacaTransfer}
            setFiltroPlacaTransfer={setFiltroPlacaTransfer}
            filtroTipoTransfer={filtroTipoTransfer}
            setFiltroTipoTransfer={setFiltroTipoTransfer}
            togglePlaca={togglePlaca}
            placasOrigem={placasOrigem}
            onExecutarTransfer={() => handleExecutarTransfer({ placasFiltradas })}
          />

          <ModalTimeline
            isOpen={isTimelineOpen}
            onClose={() => setIsTimelineOpen(false)}
          />
        </div>
      ) : (
        <GestaoUnidades veiculos={veiculos} />
      )}

      <ModalInstrucoesImportacao
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        unidades={unidadesLista}
        onConfirm={(config) => {
          setSyncConfig(config);
          setIsImportModalOpen(false);
          setTimeout(() => fileInputRef.current.click(), 100);
        }}
      />
    </div>
  );
}
