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
} from 'lucide-react';
import { dbService } from '../services/db';
import { excelSyncService } from '../services/excelSync';
import { ExcelSyncLog, ExcelImportAnalysis } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeBR } from '../utils/formatters';

export const ExcelSyncPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ExcelImportAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync options
  const [updateExistingStock, setUpdateExistingStock] = useState(true);
  const [importNewEmployees, setImportNewEmployees] = useState(true);

  // Status feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState<ExcelSyncLog[]>([]);

  const loadLogs = () => {
    setSyncLogs(dbService.getExcelSyncLogs());
  };

  useEffect(() => {
    loadLogs();
    const unsub = dbService.subscribe(loadLogs);
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

  // Execute Real Sync
  const handleExecuteSync = async () => {
    if (!selectedFile || !currentUser) return;

    setIsSyncing(true);
    setFeedback(null);

    try {
      const res = await excelSyncService.importFromExcel(
        selectedFile,
        { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        { updateExistingStock, importNewEmployees }
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setSelectedFile(null);
        setAnalysis(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-emerald-300" />
              Módulo de Integração com Planilhas Excel
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            Sincronização Bidirecional & Importação Excel
          </h1>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Importação inteligente de cadastros de materiais, funcionários e regiões sem duplicidades, com conciliação física de saldo e exportação atualizada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => excelSyncService.downloadStandardTemplate()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-xs font-bold text-white transition shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-300" />
            Baixar Modelo Padrão (.xlsx)
          </button>

          <button
            onClick={() => excelSyncService.downloadSynchronizedExcel()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Banco Atualizado (.xlsx)
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
              Arraste e solte sua planilha Excel aqui
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Compatível com arquivos <strong>.xlsx</strong> e <strong>.xls</strong> contendo abas de Materiais, Funcionários, Regiões ou Movimentações.
            </p>
            <span className="inline-block mt-3 px-3.5 py-1.5 bg-orange-100/80 text-orange-800 font-bold text-xs rounded-xl">
              Procurar arquivo no computador
            </span>
          </div>

          {/* Analysis Card */}
          {isAnalyzing && (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                Lendo estrutura de abas, mapeando colunas e conferindo integridade de dados...
              </p>
            </div>
          )}

          {analysis && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Análise do Arquivo: {analysis.fileName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Tamanho: {(analysis.fileSizeBytes / 1024).toFixed(1)} KB • {analysis.sheets.length} abas identificadas
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
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Materiais</span>
                  <span className="text-lg font-black text-slate-900">{analysis.materialsFound}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Funcionários</span>
                  <span className="text-lg font-black text-slate-900">{analysis.employeesFound}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Regiões</span>
                  <span className="text-lg font-black text-orange-600">
                    {analysis.regionsFound.length > 0 ? analysis.regionsFound.join(', ') : 'Paulista, Taquá, Penha'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Movimentações</span>
                  <span className="text-lg font-black text-slate-900">{analysis.movementsFound}</span>
                </div>
              </div>

              {/* Sheets Breakdown List */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Abas Detectadas e Mapeadas Automaticamente:
                </span>
                <div className="space-y-1.5">
                  {analysis.sheets.map((sh, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-600" />
                        <span className="font-bold text-slate-800">{sh.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({sh.rowCount} linhas)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                        Tipo: {sh.detectedType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protection & Conflict Options */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Regras de Prevenção de Conflitos e Duplicidade:
                </span>
                <div className="space-y-1 text-slate-700 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={updateExistingStock}
                      onChange={(e) => setUpdateExistingStock(e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span>
                      Conciliar saldos de materiais já cadastrados (gerando histórico de auditoria)
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
                  <p className="text-[10px] text-amber-800 italic pt-1">
                    * Códigos oficiais de materiais e números de matrícula são estritamente preservados; itens existentes não são duplicados.
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
                    Confirmar e Sincronizar com o Banco de Dados
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
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-1">
                      <span>Operador: {log.userName}</span>
                      <span>• Materiais: {log.materialsProcessed}</span>
                      <span>• Colaboradores: {log.employeesProcessed}</span>
                      <span>• Conciliações: {log.conflictsResolved}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TECHNICAL ARCHITECTURE & ENTERPRISE INTEGRATION (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Cloud Integration Instructions Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-sm border border-slate-700 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Cloud className="w-5 h-5 text-amber-400" />
              Arquitetura de Sincronização em Nuvem (OneDrive / SharePoint / Google Drive)
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">
              O sistema CPLU executa a leitura e gravação física de planilhas <strong>.xlsx</strong> nativamente no navegador utilizando a biblioteca <em>SheetJS</em>, preservando formatações, fórmulas e abas originais sem perdas.
            </p>

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
              <span className="font-bold text-white text-[11px] block">
                Por que a sincronização automática direta requer autenticação de API?
              </span>
              <p className="text-[10px] text-slate-300 leading-normal">
                Nenhum navegador web tem permissão de segurança para sobrescrever arquivos silenciosamente no disco rígido do usuário sem intervenção manual (sandbox de segurança).
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
                Configuração para Conexão Automática Contínua:
              </h4>

              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>1. Microsoft 365 (OneDrive / SharePoint)</span>
                    <span className="text-[9px] font-mono bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded">
                      Graph API
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Cadastrar um App no Microsoft Entra ID (Azure AD), conceder o escopo <code>Files.ReadWrite</code> e fornecer o ID da pasta corporativa compartilhada das regionais.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>2. Google Workspace (Google Drive)</span>
                    <span className="text-[9px] font-mono bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded">
                      Drive v3 API
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Habilitar a Google Drive API no projeto GCP, utilizar o escopo <code>https://www.googleapis.com/auth/drive.file</code> e autenticar via OAuth institucional.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400">
              * A alternativa operacional recomendada e já funcional é o fluxo de importação por upload e exportação com um clique do arquivo consolidado (.xlsx).
            </div>
          </div>

          {/* Data Loss Prevention Guarantee Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-4 h-4 text-orange-600" />
              Mecanismos Ativos de Proteção contra Perda de Dados
            </h4>

            <ul className="space-y-2 text-[11px] text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Backup Automático Pré-Sincronização:</strong> Um snapshot completo de todo o banco de dados é salvo no histórico antes de qualquer importação em lote.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Imutabilidade de Códigos Oficiais:</strong> Códigos de produtos existentes e matrículas funcionais nunca são sobrescritos com dados vazios.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Chave de Idempotência:</strong> Ações de baixa e retirada possuem token transacional único que impede duplicações em cliques repetidos.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
