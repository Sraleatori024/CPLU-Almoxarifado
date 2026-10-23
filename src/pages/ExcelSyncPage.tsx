import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  History,
  FileCheck,
  Cloud,
  ExternalLink,
  Info,
  Database,
  ArrowRight,
  Archive,
  Save,
  Laptop,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { dbService } from '../services/db';
import { excelSyncService } from '../services/excelSync';
import { ExcelSyncLog, ExcelImportAnalysis, ExcelSheetReport } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeBR } from '../utils/formatters';

export const ExcelSyncPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ExcelImportAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activePreviewSheet, setActivePreviewSheet] = useState<string | null>(null);

  // Local File System Access API State
  const [localFileHandle, setLocalFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [connectedFileName, setConnectedFileName] = useState<string | null>(null);
  const [isSavingToLocalFile, setIsSavingToLocalFile] = useState(false);

  // Sync options
  const [updateExistingStock, setUpdateExistingStock] = useState(true);
  const [importNewEmployees, setImportNewEmployees] = useState(true);
  const [syncMovements, setSyncMovements] = useState(true);

  // Status feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState<ExcelSyncLog[]>([]);

  const loadLogs = () => {
    setSyncLogs(dbService.getExcelSyncLogs());
  };

  // Check stored handle on load
  useEffect(() => {
    loadLogs();
    const unsub = dbService.subscribe(loadLogs);

    if (excelSyncService.isFileSystemAccessSupported()) {
      excelSyncService.getStoredLocalFileHandle().then((handle) => {
        if (handle) {
          setLocalFileHandle(handle);
          // @ts-ignore
          handle.getFile().then((f: File) => setConnectedFileName(f.name)).catch(() => {});
        }
      });
    }

    return () => unsub();
  }, []);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setFeedback({
        type: 'error',
        message: 'Formato inválido. Por favor, selecione uma planilha Excel (.xlsx ou .xls).',
      });
      return;
    }

    setSelectedFile(file);
    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const result = await excelSyncService.analyzeExcelFile(file);
      setAnalysis(result);
      if (result.sheets.length > 0) {
        setActivePreviewSheet(result.sheets[0].name);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erro ao interpretar a planilha Excel: ' + (err.message || 'Arquivo corrompido ou protegido por senha.'),
      });
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load in-memory official test copy of CONSUMO MATERIAL CPLU.xlsx
  const handleLoadOfficialTestCopy = async () => {
    setIsAnalyzing(true);
    setFeedback(null);
    try {
      const wb = excelSyncService.exportToWorkbook();
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const testFile = new File([excelBuffer], 'CONSUMO MATERIAL CPLU.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await processFile(testFile);
      setFeedback({
        type: 'info',
        message: 'Cópia de teste oficial "CONSUMO MATERIAL CPLU.xlsx" carregada! Analise as abas oficiais (LIST. COD. IKKI, ENTRADAS, LANÇAMENTO DE CONSUMO, SALDO AGOSTO, CONSOLIDADADO e EPI) e confirme a importação.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Falha ao gerar cópia de teste da planilha oficial: ' + err.message,
      });
      setIsAnalyzing(false);
    }
  };

  // Connect local file on PC via File System Access API
  const handleConnectLocalFile = async () => {
    setFeedback(null);
    const res = await excelSyncService.connectLocalExcelFile();
    if (res.success && res.handle && res.file) {
      setLocalFileHandle(res.handle);
      setConnectedFileName(res.file.name);
      setFeedback({ type: 'success', message: res.message });
      // Automatically analyze connected file
      await processFile(res.file);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Disconnect local file
  const handleDisconnectLocalFile = async () => {
    await excelSyncService.disconnectLocalExcelFile();
    setLocalFileHandle(null);
    setConnectedFileName(null);
    setFeedback({
      type: 'info',
      message: 'Arquivo local desconectado. O sistema continuará operando normalmente via upload e download manual.',
    });
  };

  // Write CPL Log changes directly to the connected local file on disk
  const handleSaveToLocalFile = async () => {
    if (!localFileHandle || !currentUser) return;
    setIsSavingToLocalFile(true);
    setFeedback(null);
    try {
      const res = await excelSyncService.writeToLocalExcelFile(localFileHandle, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        loadLogs();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erro ao gravar no arquivo local: ' + (err.message || 'Falha de gravação.'),
      });
    } finally {
      setIsSavingToLocalFile(false);
    }
  };

  // Execute Real Sync/Import
  const handleExecuteSync = async () => {
    if (!selectedFile || !currentUser) return;

    setIsSyncing(true);
    setFeedback(null);

    try {
      const res = await excelSyncService.importFromExcel(
        selectedFile,
        { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        { updateExistingStock, importNewEmployees, syncMovements }
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setSelectedFile(null);
        setAnalysis(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadLogs();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Falha durante a sincronização: ' + (err.message || 'Erro inesperado.'),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const activeSheetObj = analysis?.sheets.find((s) => s.name === activePreviewSheet);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-emerald-300" />
              Integração com CONSUMO MATERIAL CPLU.xlsx
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
              Catálogo Oficial IKKI Ativo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            Sincronização & Integração de Planilhas Oficiais
          </h1>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Importação real das abas <strong>LIST. COD. IKKI</strong>, <strong>LANÇAMENTO DE CONSUMO</strong>, <strong>ENTRADAS</strong>, <strong>SALDO AGOSTO</strong> e <strong>EPI</strong>, preservando códigos com zeros à esquerda e integrando diretamente ao estoque e requisições.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => excelSyncService.downloadStandardTemplate()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-xs font-bold text-white transition shadow-sm"
            title="Baixar a planilha oficial CONSUMO MATERIAL CPLU.xlsx formatada"
          >
            <Download className="w-4 h-4 text-amber-300" />
            Baixar CONSUMO MATERIAL CPLU.xlsx
          </button>

          <button
            onClick={handleLoadOfficialTestCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition"
            title="Carregar cópia oficial de teste para conferência imediata"
          >
            <Eye className="w-4 h-4 text-slate-950" />
            Testar com Cópia Oficial
          </button>
        </div>
      </div>

      {/* Local File Connection Banner (File System Access API) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              localFileHandle
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Conexão com Arquivo Local do Computador
              </span>
              {localFileHandle ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Conectado ({connectedFileName || 'CONSUMO MATERIAL CPLU.xlsx'})
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">Não conectado</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {localFileHandle
                ? 'Você pode gravar atualizações de estoque e retiradas diretamente no arquivo Excel do seu computador com autorização do navegador.'
                : 'Conecte o arquivo "CONSUMO MATERIAL CPLU.xlsx" de sua máquina para permitir gravação autorizada com 1 clique.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {localFileHandle ? (
            <>
              <button
                onClick={handleSaveToLocalFile}
                disabled={isSavingToLocalFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isSavingToLocalFile ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Gravar no Arquivo Local (.xlsx)
              </button>
              <button
                onClick={handleDisconnectLocalFile}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectLocalFile}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Laptop className="w-4 h-4" />
              Conectar Arquivo Local do PC
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : feedback.type === 'info'
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedback.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* TWO-COLUMN WORKSPACE: LEFT (UPLOAD & INSPECT), RIGHT (CLOUD & ARCHITECTURE GUIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: FILE DROPZONE & ANALYSIS (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="bg-white rounded-3xl border-2 border-dashed border-orange-300 hover:border-orange-500 p-6 text-center transition cursor-pointer shadow-xs group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Arraste e solte o arquivo CONSUMO MATERIAL CPLU.xlsx aqui
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              O sistema lê automaticamente as abas <strong>LIST. COD. IKKI</strong>, <strong>LANÇAMENTO DE CONSUMO</strong>, <strong>ENTRADAS</strong>, <strong>SALDO AGOSTO</strong> e <strong>EPI</strong>.
            </p>
            <span className="inline-block mt-3 px-3.5 py-1.5 bg-orange-100/80 text-orange-800 font-bold text-xs rounded-xl">
              Procurar arquivo no computador
            </span>
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                Lendo abas oficiais, mapeando códigos IKKI e conferindo fórmulas e dados...
              </p>
            </div>
          )}

          {/* Analysis Result Card */}
          {analysis && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Análise Pré-Importação: {analysis.fileName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(analysis.fileSizeBytes / 1024).toFixed(1)} KB • {analysis.sheets.length} abas identificadas
                      {analysis.detectedOfficialIkkiSheet && ' • Aba LIST. COD. IKKI reconhecida'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setAnalysis(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
              </div>

              {/* Detected Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Itens IKKI</span>
                  <span className="text-lg font-black text-slate-900">{analysis.materialsFound}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Colaboradores</span>
                  <span className="text-lg font-black text-slate-900">{analysis.employeesFound}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Movimentações</span>
                  <span className="text-lg font-black text-slate-900">{analysis.movementsFound}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Erros/Fórmulas</span>
                  <span className={`text-lg font-black ${analysis.totalErrors > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {analysis.totalErrors}
                  </span>
                </div>
              </div>

              {/* Sheets Breakdown with Preview */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Abas Identificadas e Validadas:
                </span>
                <div className="space-y-2">
                  {analysis.sheets.map((sh, idx) => {
                    const isOfficial =
                      sh.detectedType === 'LIST_IKKI' ||
                      sh.detectedType === 'CONSUMO' ||
                      sh.detectedType === 'ENTRADAS' ||
                      sh.detectedType === 'SALDO_AGOSTO' ||
                      sh.detectedType === 'CONSOLIDADO' ||
                      sh.detectedType === 'EPI';

                    const isExpanded = activePreviewSheet === sh.name;

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 text-xs"
                      >
                        <div
                          onClick={() => setActivePreviewSheet(isExpanded ? null : sh.name)}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                            <Layers className="w-4 h-4 text-orange-600" />
                            <span className="font-bold text-slate-900">{sh.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              ({sh.validRowsCount} válidos, {sh.ignoredRowsCount} ignorados)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {sh.errorCount > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                {sh.errorCount} alerta(s)
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isOfficial
                                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                  : 'bg-white border border-slate-200 text-slate-700'
                              }`}
                            >
                              {sh.detectedType}
                            </span>
                          </div>
                        </div>

                        {/* Expanded details & preview */}
                        {isExpanded && (
                          <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
                            {sh.sampleErrors.length > 0 && (
                              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 space-y-1">
                                <span className="font-bold block">Alertas detectados na aba:</span>
                                {sh.sampleErrors.map((err, eIdx) => (
                                  <div key={eIdx}>• {err}</div>
                                ))}
                              </div>
                            )}

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Pré-visualização dos primeiros registros:
                              </span>
                              {sh.samplePreview.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">Nenhum dado legível na aba.</span>
                              ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                  <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                      <tr>
                                        {Object.keys(sh.samplePreview[0]).map((h, hIdx) => (
                                          <th key={hIdx} className="py-1 px-2 font-bold whitespace-nowrap">
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {sh.samplePreview.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-slate-50 font-mono">
                                          {Object.values(row).map((val: any, vIdx) => (
                                            <td key={vIdx} className="py-1 px-2 whitespace-nowrap">
                                              {String(val)}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Protection & Conflict Options */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Opções de Importação & Proteção de Dados:
                </span>
                <div className="space-y-1.5 text-slate-700 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={updateExistingStock}
                      onChange={(e) => setUpdateExistingStock(e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span>
                      Conciliar saldos de materiais já cadastrados (gera movimentação auditada)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={importNewEmployees}
                      onChange={(e) => setImportNewEmployees(e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span>
                      Importar colaboradores e vincular às suas respectivas regiões (Paulista, Taquá, Penha)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={syncMovements}
                      onChange={(e) => setSyncMovements(e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span>
                      Importar histórico de entradas e consumos evitando duplicidades de requisição
                    </span>
                  </label>
                  <p className="text-[10px] text-amber-800 italic pt-1">
                    * Os códigos oficiais IKKI (inclusive zeros à esquerda) e números de requisição são preservados exatamente como constam no arquivo.
                  </p>
                </div>
              </div>

              {/* Confirm Sync Button */}
              <button
                onClick={handleExecuteSync}
                disabled={isSyncing}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/30 flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processando Sincronização e Criando Cópia de Segurança...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar e Importar Planilha no CPL Log
                  </>
                )}
              </button>
            </div>
          )}

          {/* Sync History Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-orange-600" />
                Histórico de Sincronizações & Cópias de Segurança
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {syncLogs.length} registro(s)
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {syncLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma sincronização realizada nesta sessão.
                </div>
              ) : (
                syncLogs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50 transition space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.fileName}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatDateTimeBR(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.details}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-1 flex-wrap">
                      <span>Operador: {log.userName}</span>
                      <span>• Itens: {log.materialsProcessed}</span>
                      <span>• Colaboradores: {log.employeesProcessed}</span>
                      <span>• Movimentações: {log.movementsSynced}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TECHNICAL ARCHITECTURE & ENTERPRISE INTEGRATION (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Official Spreadsheet Mapping Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-orange-600" />
              Mapeamento Oficial da Planilha CPLU
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              O sistema reconhece a nomenclatura oficial utilizada pela equipe no dia a dia:
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block font-mono">LIST. COD. IKKI</strong>
                  <span className="text-[10px] text-slate-500">Catálogo oficial de códigos, descrições e unidades</span>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">Oficial</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block font-mono">LANÇAMENTO DE CONSUMO</strong>
                  <span className="text-[10px] text-slate-500">Retiradas por requisição, colaborador e região</span>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">Oficial</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block font-mono">ENTRADAS</strong>
                  <span className="text-[10px] text-slate-500">Recebimento com fornecedor, NF e local</span>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">Oficial</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block font-mono">SALDO AGOSTO / CONSOLIDADADO</strong>
                  <span className="text-[10px] text-slate-500">Conciliações físicas e matriz comparativa</span>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">Oficial</span>
              </div>
            </div>
          </div>

          {/* Cloud & Local File Sync Guide */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-sm border border-slate-700 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Cloud className="w-5 h-5 text-amber-400" />
              Como Funciona a Conexão com o Arquivo Excel
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">
              O CPL Log oferece duas vias reais para sincronizar a planilha oficial:
            </p>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-white block">1. File System Access API (Arquivo Local no PC)</span>
                <p className="text-[10px] text-slate-300">
                  O almoxarife clica em "Conectar Arquivo Local do PC", seleciona o arquivo <code>CONSUMO MATERIAL CPLU.xlsx</code> em sua máquina e concede permissão. O sistema salva a referência e permite gravar atualizações diretamente no arquivo físico.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-white block">2. Nuvem Corporativa (OneDrive / Google Drive)</span>
                <p className="text-[10px] text-slate-300">
                  Para sincronização remota entre computadores de bases operacionais diferentes sem depender da máquina local ligada, a planilha pode residir em pasta compartilhada do Microsoft 365 (OneDrive/SharePoint via Graph API) ou Google Drive.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-200">
              <strong>Importante:</strong> Antes de qualquer gravação ou importação, o sistema gera automaticamente uma cópia de segurança na auditoria, impedindo corrupção acidental ou perda de fórmulas da empresa.
            </div>
          </div>

          {/* Data Protection Guarantee */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-4 h-4 text-orange-600" />
              Garantias de Integridade Operacional
            </h4>

            <ul className="space-y-2 text-[11px] text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Preservação Estrita de Zeros à Esquerda:</strong> Códigos como <code>001420</code> não perdem os zeros e não são convertidos para números simples.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tratamento de Fórmulas e Erros:</strong> Células com erros como <code>#REF!</code> ou <code>#VALOR!</code> são identificadas e reportadas antes da gravação.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Proteção contra Duplicidade:</strong> Chaves transacionais de conferência garantem que a mesma entrega ou entrada não seja contabilizada duas vezes.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
