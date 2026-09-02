import React from 'react';
import TabelaComandosCaminhao from '../TabelaComandosCaminhao';
import ConversorOnewire from '../ConversorOnewire';

export default function FerramentasTab({ activeTab }) {
  if (activeTab === 'CAMINHÃO') {
    return <TabelaComandosCaminhao />;
  }

  if (activeTab === 'MOTO') {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        <ConversorOnewire />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[400px]">
      <h3 className="text-xl font-bold">Nenhuma ferramenta técnica disponível para esta categoria.</h3>
    </div>
  );
}
