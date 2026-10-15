import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const normalizeHeader = (str) =>
  String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const normalizePlate = (val) =>
  String(val || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

export default function ModalImportarFalhas({
  isOpen,
  onClose,
  onImportSuccess,
  lotesExistentes = []
}) {
  const [dataExtracao, setDataExtracao] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [registrosProcessados, setRegistrosProcessados] = useState([]);
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  // Verificação prévia de placas na base de instalações
  const [verificacaoPlacas, setVerificacaoPlacas] = useState(null);
  const [verificandoPlacas, setVerificandoPlacas] = useState(false);
  const [opcaoNaoCadastradas, setOpcaoNaoCadastradas] = useState('ignorar'); // 'ignorar' | 'manter'
  const [mostrarNaoEncontradas, setMostrarNaoEncontradas] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Verifica se já existe um lote para essa data
  const dataJaExiste = lotesExistentes.some((l) => {
    const dStr = String(l.data_extracao || '').split('T')[0];
    return dStr === dataExtracao;
  });

  const verificarPlacasNoBackend = async (regs) => {
    try {
      setVerificandoPlacas(true);
      const placasUnicas = Array.from(new Set(regs.map((r) => r.placa)));
      const res = await api.post('/gestao-solar/falhas/verificar-placas', {
        placas: placasUnicas
      });
      const data = res.data?.data;
      setVerificacaoPlacas(data || null);
    } catch (err) {
      console.error('Erro ao verificar placas na frota:', err);
      setVerificacaoPlacas(null);
    } finally {
      setVerificandoPlacas(false);
    }
  };

  const processarLinhas = (rows) => {
    if (!rows || rows.length === 0) {
      toast.error('O arquivo está vazio.');
      return;
    }

    const registros = [];

    // Caso 1: Array de arrays (matriz de linhas bruta, igual ao pandas no processar_falhas.py)
    if (Array.isArray(rows[0])) {
      let headerRowIdx = -1;
      let colPlaca = -1;
      let colTransmissao = -1;
      let colBateria = -1;

      // Detecta a linha de cabeçalho nas primeiras 10 linhas
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const linha = rows[r];
        if (!Array.isArray(linha)) continue;

        let foundPlaca = -1;
        let foundTrans = -1;
        let foundBat = -1;

        linha.forEach((cell, idx) => {
          const norm = normalizeHeader(cell);
          if (!norm) return;
          if (norm.includes('placa') || norm.includes('veiculo')) {
            foundPlaca = idx;
          } else if (norm.includes('ultimatransmissao') || (norm.includes('ultima') && norm.includes('transmissao'))) {
            foundTrans = idx;
          } else if (foundTrans === -1 && (norm.includes('transmissao') || norm.includes('comunicacao'))) {
            foundTrans = idx;
          } else if (norm.includes('bateria') || norm.includes('tensao') || norm.includes('voltagem')) {
            foundBat = idx;
          }
        });

        if (foundPlaca !== -1 || (foundTrans !== -1 && foundBat !== -1)) {
          headerRowIdx = r;
          colPlaca = foundPlaca !== -1 ? foundPlaca : 1;
          colTransmissao = foundTrans !== -1 ? foundTrans : 8;
          colBateria = foundBat !== -1 ? foundBat : 9;
          break;
        }
      }

      // Se não encontrou cabeçalho nos primeiros registros, usa os padrões Vanguarda (coluna B = 1, I = 8, J = 9)
      if (headerRowIdx === -1) {
        headerRowIdx = 0;
        colPlaca = 1;
        colTransmissao = 8;
        colBateria = 9;
      }

      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const linha = rows[i];
        if (!linha || linha.length === 0) continue;

        const placaBruta = linha[colPlaca];
        const placa = normalizePlate(placaBruta);

        if (placa && placa.length >= 5 && placa.length <= 8) {
          const rawTrans = colTransmissao !== -1 ? linha[colTransmissao] : null;
          const rawBat = colBateria !== -1 ? linha[colBateria] : null;

          const ultimaTransmissao = rawTrans instanceof Date
            ? (isNaN(rawTrans.getTime()) ? null : rawTrans.toISOString())
            : (rawTrans || null);

          const nivelBateria = rawBat !== null && rawBat !== undefined
            ? String(rawBat).trim()
            : null;

          registros.push({
            placa,
            ultima_transmissao: ultimaTransmissao,
            nivel_bateria: nivelBateria
          });
        }
      }
    } else {
      // Caso 2: Objeto com chaves de cabeçalho
      const headers = Object.keys(rows[0]);
      let colPlaca = null;
      let colTransmissao = null;
      let colBateria = null;

      headers.forEach((h, idx) => {
        const norm = normalizeHeader(h);
        if (norm.includes('placa') || norm.includes('veiculo')) colPlaca = h;
        else if (norm.includes('ultimatransmissao') || (norm.includes('ultima') && norm.includes('transmissao'))) colTransmissao = h;
        else if (norm.includes('bateria') || norm.includes('tensao') || norm.includes('voltagem')) colBateria = h;
        if (!colPlaca && idx === 1) colPlaca = h;
        if (!colBateria && idx === 9) colBateria = h;
      });

      if (!colTransmissao) {
        headers.forEach((h, idx) => {
          const norm = normalizeHeader(h);
          if (norm.includes('transmissao') || norm.includes('comunicacao') || norm.includes('ultima')) {
            colTransmissao = h;
          }
          if (!colTransmissao && idx === 8) colTransmissao = h;
        });
      }

      if (!colPlaca) {
        toast.error('Não foi possível identificar a coluna de Placa no arquivo.');
        return;
      }

      rows.forEach((row) => {
        const placa = normalizePlate(row[colPlaca]);
        if (placa && placa.length >= 5 && placa.length <= 8) {
          const rawTrans = colTransmissao ? row[colTransmissao] : null;
          const ultimaTransmissao = rawTrans instanceof Date
            ? (isNaN(rawTrans.getTime()) ? null : rawTrans.toISOString())
            : (rawTrans || null);

          registros.push({
            placa,
            ultima_transmissao: ultimaTransmissao,
            nivel_bateria: colBateria ? String(row[colBateria] || '').trim() : null
          });
        }
      });
    }

    if (registros.length === 0) {
      toast.error('Nenhuma placa válida encontrada na planilha.');
      return;
    }

    setRegistrosProcessados(registros);
    verificarPlacasNoBackend(registros);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivo(file);
    setCarregandoArquivo(true);
    setVerificacaoPlacas(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          setCarregandoArquivo(false);
          processarLinhas(results.data);
        },
        error: () => {
          setCarregandoArquivo(false);
          toast.error('Erro ao ler arquivo CSV.');
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
          setCarregandoArquivo(false);
          processarLinhas(data);
        } catch {
          setCarregandoArquivo(false);
          toast.error('Erro ao ler arquivo Excel (.xlsx/.xls).');
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dataExtracao) {
      toast.error('Selecione a data da extração.');
      return;
    }
    if (registrosProcessados.length === 0) {
      toast.error('Carregue uma planilha com dados válidos.');
      return;
    }

    try {
      setEnviando(true);
      const res = await api.post('/gestao-solar/falhas/importar', {
        data_extracao: dataExtracao,
        descricao: descricao.trim() || undefined,
        ignorar_nao_cadastradas: opcaoNaoCadastradas === 'ignorar',
        registros: registrosProcessados
      });

      const { data } = res.data;
      toast.success(res.data.message || 'Importação realizada com sucesso!');
      onImportSuccess(data?.lote);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao importar dados de falhas.';
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  const totalParaGravar = opcaoNaoCadastradas === 'ignorar' && verificacaoPlacas
    ? verificacaoPlacas.cadastradas
    : registrosProcessados.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Importar Planilha de Falhas
              </h3>
              <p className="text-xs text-slate-500">
                Lê as colunas B, I e J do Vanguarda e calcula Unidade, UF e Tipo automaticamente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body com scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Data da Extração */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Data da Extração <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dataExtracao}
              onChange={(e) => setDataExtracao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
              required
            />
            {dataJaExiste && (
              <div className="flex items-center gap-1.5 mt-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium">
                <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                <span>Esta data já existe no histórico. Os registros serão <strong>atualizados e sobrescritos</strong>.</span>
              </div>
            )}
          </div>

          {/* Descrição opcional */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Descrição / Observação <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Extração semanal de quarta-feira (15h)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          {/* Área de Arquivo */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Arquivo da Planilha (.xlsx, .xls, .csv) <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/20 rounded-2xl p-5 text-center cursor-pointer transition-all group"
            >
              {carregandoArquivo ? (
                <div className="flex flex-col items-center">
                  <Loader2 size={26} className="animate-spin text-teal-600 mb-1.5" />
                  <span className="text-xs font-bold text-slate-600">Lendo planilha...</span>
                </div>
              ) : arquivo ? (
                <div className="flex flex-col items-center">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl mb-1.5">
                    <CheckCircle2 size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[280px] truncate">
                    {arquivo.name}
                  </span>
                  <span className="text-[11px] text-teal-700 font-extrabold mt-0.5">
                    {registrosProcessados.length} placas lidas do arquivo
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Clique para trocar de arquivo
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-2.5 bg-slate-100 text-slate-500 group-hover:text-teal-600 group-hover:bg-teal-50 rounded-xl mb-1.5 transition-colors">
                    <FileSpreadsheet size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
                    Clique aqui ou arraste o arquivo da planilha
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Compatível com exportação bruta do Vanguarda (Colunas B, I e J)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CARD DE PRÉ-VALIDAÇÃO DE PLACAS */}
          {verificandoPlacas && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
              <Loader2 size={16} className="animate-spin text-teal-600" />
              <span>Verificando placas na base da frota...</span>
            </div>
          )}

          {verificacaoPlacas && !verificandoPlacas && (
            <>
              {verificacaoPlacas.nao_encontradas.length > 0 ? (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                        {verificacaoPlacas.nao_encontradas.length} placas não pertencem à base da Frota
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Foram encontradas <strong>{verificacaoPlacas.cadastradas}</strong> placas pertencentes à frota Coca-Cola Solar e <strong>{verificacaoPlacas.nao_encontradas.length}</strong> placas que não constam em instalações.
                      </p>
                    </div>
                  </div>

                  {/* Decisão do Usuário */}
                  <div className="space-y-2 pt-1 border-t border-amber-200/60">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/90 border border-amber-200/80 hover:bg-white cursor-pointer transition-colors shadow-2xs">
                      <input
                        type="radio"
                        name="opcaoNaoCadastradas"
                        value="ignorar"
                        checked={opcaoNaoCadastradas === 'ignorar'}
                        onChange={() => setOpcaoNaoCadastradas('ignorar')}
                        className="mt-0.5 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900 block">
                          Ignorar placas não cadastradas (Recomendado)
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Importa apenas as <strong>{verificacaoPlacas.cadastradas}</strong> placas válidas da frota. As {verificacaoPlacas.nao_encontradas.length} placas externas serão descartadas.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/90 border border-amber-200/80 hover:bg-white cursor-pointer transition-colors shadow-2xs">
                      <input
                        type="radio"
                        name="opcaoNaoCadastradas"
                        value="manter"
                        checked={opcaoNaoCadastradas === 'manter'}
                        onChange={() => setOpcaoNaoCadastradas('manter')}
                        className="mt-0.5 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900 block">
                          Importar todas mesmo assim
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Traz todas as {verificacaoPlacas.total} placas. As {verificacaoPlacas.nao_encontradas.length} não cadastradas ficarão com unidade "Não informada".
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Ver Placas Não Encontradas */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setMostrarNaoEncontradas(!mostrarNaoEncontradas)}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                    >
                      <span>
                        {mostrarNaoEncontradas ? 'Ocultar placas externas' : `Ver as ${verificacaoPlacas.nao_encontradas.length} placas externas`}
                      </span>
                      {mostrarNaoEncontradas ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {mostrarNaoEncontradas && (
                      <div className="mt-2 p-2.5 bg-white rounded-xl border border-amber-200 max-h-28 overflow-y-auto flex flex-wrap gap-1.5 custom-scrollbar">
                        {verificacaoPlacas.nao_encontradas.map((placa) => (
                          <span
                            key={placa}
                            className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs"
                          >
                            {placa}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold animate-in fade-in duration-300">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>Todas as {verificacaoPlacas.total} placas pertencem à frota Coca-Cola Solar!</span>
                </div>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || registrosProcessados.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black uppercase tracking-wider rounded-xl text-xs transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              {enviando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Gravar Falhas ({totalParaGravar})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
