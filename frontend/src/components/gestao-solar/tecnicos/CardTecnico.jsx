import React, { useState } from 'react';
import { openTechnicianDocument } from '../../../services/technicianDocuments';
import { 
  UserCheck, 
  Clock, 
  MapPin, 
  FileText, 
  Eye, 
  Box, 
  PackagePlus, 
  Wrench, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Phone
} from 'lucide-react';

export default function CardTecnico({ 
  tecnico, 
  onLancarOS, 
  onAdicionarCarga, 
  onEditar, 
  onExcluir 
}) {
  const [expandirServicos, setExpandirServicos] = useState(false);
  const [expandirEquipamentos, setExpandirEquipamentos] = useState(false);
  const [documentError, setDocumentError] = useState('');

  const abrirDocumento = async (tipo) => {
    setDocumentError('');
    try {
      await openTechnicianDocument(tecnico.id, tipo);
    } catch (error) {
      setDocumentError(error.response?.data?.message || 'Não foi possível abrir o documento.');
    }
  };

  // Calcula total e ordena equipamentos decrescente pela quantidade (maior volume primeiro)
  const equipamentos = tecnico.equipamentos || [];
  const totalEquipamentos = equipamentos.reduce(
    (acc, curr) => acc + (curr.quantidade || 0), 
    0
  );

  const equipamentosOrdenados = [...equipamentos].sort(
    (a, b) => (b.quantidade || 0) - (a.quantidade || 0)
  );

  // Limite padrão de exibição inicial para não poluir o card (Top 2 itens de maior volume)
  const LIMITE_ITENS_PADRAO = 2;
  const temMaisEquipamentos = equipamentosOrdenados.length > LIMITE_ITENS_PADRAO;
  const equipamentosVisiveis = expandirEquipamentos
    ? equipamentosOrdenados
    : equipamentosOrdenados.slice(0, LIMITE_ITENS_PADRAO);
  const qtdOcultos = equipamentosOrdenados.length - LIMITE_ITENS_PADRAO;

  const servicos = tecnico.servicos_precos || [];
  const servicosVisiveis = expandirServicos ? servicos : servicos.slice(0, 3);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Card Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
              {tecnico.nome ? tecnico.nome.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base tracking-tight line-clamp-1 group-hover:text-teal-700 transition-colors">
                {tecnico.nome}
              </h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-teal-600 shrink-0" />
                <span className="truncate">{tecnico.regiao}</span>
              </p>
              {tecnico.telefone && (
                <a
                  href={`https://wa.me/55${tecnico.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 mt-1 hover:underline"
                  title="Abrir WhatsApp com o técnico"
                >
                  <Phone size={11} className="text-teal-600 shrink-0" />
                  <span>{tecnico.telefone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Badge Homologado */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs ${
            tecnico.homologado 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {tecnico.homologado ? (
              <>
                <UserCheck size={12} className="text-emerald-600" />
                <span>Homologado</span>
              </>
            ) : (
              <>
                <Clock size={12} className="text-amber-600" />
                <span>Em Homologação</span>
              </>
            )}
          </span>
        </div>

        {/* Documentos Anexados (CNH & Residência) */}
        <div className="flex flex-wrap gap-2 mt-3.5 pt-3 border-t border-slate-100">
          {tecnico.cnh_url ? (
            <button
              type="button"
              onClick={() => abrirDocumento('cnh')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50/80 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-xl text-[11px] font-bold transition-all shadow-2xs"
              title={tecnico.cnh_nome || 'Ver CNH'}
            >
              <FileText size={12} />
              <span>CNH Anexada</span>
              <ExternalLink size={10} className="opacity-60" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-medium border border-slate-200/60">
              CNH Pendente
            </span>
          )}

          {tecnico.comprovante_residencia_url ? (
            <button
              type="button"
              onClick={() => abrirDocumento('comprovante')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50/80 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-xl text-[11px] font-bold transition-all shadow-2xs"
              title={tecnico.comprovante_residencia_nome || 'Ver Comprovante'}
            >
              <FileText size={12} />
              <span>Comprovante End.</span>
              <ExternalLink size={10} className="opacity-60" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-medium border border-slate-200/60">
              Comprovante Pendente
            </span>
          )}
        </div>
        {documentError && <p className="mt-2 text-xs text-red-600" role="alert">{documentError}</p>}
      </div>

      {/* Seção Central: Cards de Equipamentos em Posse */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-y border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Box size={13} className="text-teal-600" />
            Equipamentos com o Técnico ({totalEquipamentos} un)
          </span>

          <div className="flex items-center gap-2">
            {temMaisEquipamentos && (
              <button
                type="button"
                onClick={() => setExpandirEquipamentos(!expandirEquipamentos)}
                className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 cursor-pointer transition-colors"
                title={expandirEquipamentos ? 'Recolher lista de equipamentos' : 'Ver todos os equipamentos em posse'}
              >
                <span>{expandirEquipamentos ? 'Recolher' : `Ver todos (${equipamentosOrdenados.length})`}</span>
                {expandirEquipamentos ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}

            <button
              type="button"
              onClick={() => onAdicionarCarga(tecnico)}
              className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-100/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Enviar mais materiais para o técnico"
            >
              <PackagePlus size={13} />
              <span>+ Carga</span>
            </button>
          </div>
        </div>

        {equipamentosOrdenados.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {equipamentosVisiveis.map(eq => (
              <span
                key={eq.id}
                title={eq.modelo_equipamento}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs max-w-full transition-all ${
                  eq.quantidade > 0
                    ? 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}
              >
                <span className="uppercase truncate max-w-[170px] sm:max-w-[210px]">
                  {eq.modelo_equipamento}:
                </span>
                <strong className={`font-black shrink-0 whitespace-nowrap ${eq.quantidade > 0 ? 'text-teal-700' : 'text-red-700'}`}>
                  {eq.quantidade} un
                </strong>
              </span>
            ))}

            {!expandirEquipamentos && temMaisEquipamentos && (
              <button
                type="button"
                onClick={() => setExpandirEquipamentos(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 transition-all cursor-pointer shadow-2xs"
                title={`Clique para ver mais ${qtdOcultos} equipamento(s)`}
              >
                <span>+{qtdOcultos} outros</span>
                <ChevronDown size={11} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 font-medium py-1">
            Nenhum equipamento registrado em posse deste profissional.
          </div>
        )}
      </div>

      {/* Seção Tabela de Valores / Serviços */}
      <div className="p-5 pt-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Tabela de Serviços ({servicos.length})
            </span>
            {servicos.length > 3 && (
              <button
                type="button"
                onClick={() => setExpandirServicos(!expandirServicos)}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>{expandirServicos ? 'Recolher' : `Ver todos (${servicos.length})`}</span>
                {expandirServicos ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {servicosVisiveis.map(s => (
              <div 
                key={s.id} 
                className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-slate-700 truncate">{s.nome_servico}</span>
                  {s.gera_devolucao && (
                    <span 
                      className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-md uppercase"
                      title="Gera cobrança de devolução de peça"
                    >
                      Devolução
                    </span>
                  )}
                  {s.is_km && (
                    <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[9px] font-bold rounded-md uppercase">
                      Por KM
                    </span>
                  )}
                </div>
                <span className="font-black text-slate-900 shrink-0 ml-2">
                  R$ {Number(s.valor).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions do Card */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEditar(tecnico)}
              className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
              title="Editar dados e tabela de preços"
            >
              <Edit3 size={16} />
            </button>
            <button
              type="button"
              onClick={() => onExcluir(tecnico)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Excluir ou desativar técnico"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onLancarOS(tecnico)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Wrench size={14} />
            <span>Lançar O.S.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
