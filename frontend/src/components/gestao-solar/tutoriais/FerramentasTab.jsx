import React from 'react';
import TabelaComandosCaminhao from '../TabelaComandosCaminhao';
import ConversorOnewire from '../ConversorOnewire';
import { Video } from 'lucide-react';

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
      <Video size={40} className="text-slate-300 mb-4" />
      <h3 className="text-xl font-bold text-slate-600">Nenhuma ferramenta técnica disponível para esta categoria.</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">A operação de vídeo telemetria não necessita de conversão ou comandos manuais nesta aba.</p>
    </div>
  );
}
