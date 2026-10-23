import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCode,
  ExternalLink,
  Lock,
  Cloud,
  CloudUpload,
  CloudDownload,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { firebaseConfig, testFirestoreConnection } from '../services/firebase';
import { firebaseSyncService, FirebaseSyncStatus } from '../services/firebaseSync';

export const SettingsPage: React.FC = () => {
  const { currentUser, role, canConfigureSystem } = useAuth();
  const [isDemo, setIsDemo] = useState(dbService.isDemoData());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Firebase Live Sync States
  const [syncStatus, setSyncStatus] = useState<FirebaseSyncStatus>(firebaseSyncService.getSyncStatus());
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [connResult, setConnResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnResult({ status: 'idle', message: '' });
    try {
      const ok = await testFirestoreConnection();
      if (ok) {
        setConnResult({
          status: 'success',
          message: 'Conexão ativa com Google Cloud Firestore (Projeto: cplu-almxarifado).',
        });
      } else {
        setConnResult({
          status: 'error',
          message: 'Cliente Firestore offline ou sem resposta do cluster.',
        });
      }
    } catch (e: any) {
      setConnResult({
        status: 'error',
        message: 'Falha ao testar conexão: ' + (e?.message || String(e)),
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handlePushToFirestore = async () => {
    if (!currentUser) return;
    setIsPushing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await firebaseSyncService.pushAllToFirestore(currentUser);
      if (res.success) {
        setSuccessMsg(res.message);
        setSyncStatus(firebaseSyncService.getSyncStatus());
      } else {
        setErrorMsg(res.message);
      }
    } catch (e: any) {
      setErrorMsg('Erro na sincronização: ' + (e?.message || String(e)));
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromFirestore = async () => {
    if (!currentUser) return;
    if (
      !confirm(
        'Deseja baixar os dados do Cloud Firestore e sincronizar com o almoxarifado local? Os registros serão conciliados.'
      )
    ) {
      return;
    }
    setIsPulling(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await firebaseSyncService.pullAllFromFirestore(currentUser);
      if (res.success) {
        setSuccessMsg(res.message);
        setSyncStatus(firebaseSyncService.getSyncStatus());
      } else {
        setErrorMsg(res.message);
      }
    } catch (e: any) {
      setErrorMsg('Erro ao baixar: ' + (e?.message || String(e)));
    } finally {
      setIsPulling(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      materials: dbService.getMaterials(),
      movements: dbService.getMovements(),
      employees: dbService.getEmployees(),
      requisitions: dbService.getRequisitions(),
      epiDeliveries: dbService.getEPIDeliveries(),
      shelves: dbService.getShelves(),
      auditLogs: dbService.getAuditLogs(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CPLU_Backup_Completo_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg('Arquivo de backup completo exportado com sucesso!');
  };

  const handleRestoreDefault = () => {
    if (confirm('Deseja restaurar a base padrão de demonstração para a operação de limpeza urbana?')) {
      dbService.resetToSeedData();
      setIsDemo(true);
      setSuccessMsg('Base de dados restaurada com os materiais e funcionários padrão.');
    }
  };

  const handleClearDatabase = () => {
    if (
      confirm(
        'ATENÇÃO: Deseja apagar todos os materiais, movimentações e requisições para iniciar a operação em modo limpo (banco vazio de produção)?'
      )
    ) {
      dbService.clearAllData();
      setIsDemo(false);
      setSuccessMsg('Base limpa com sucesso. Sistema pronto para cadastros reais.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-orange-600" />
          Configurações do Sistema & Arquitetura Cloud
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Persistência de dados, sincronização com Cloud Firestore (Projeto: {firebaseConfig.projectId}) e rotinas de segurança
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs flex items-center justify-between font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs underline font-bold">
            Dispensar
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-xs flex items-center justify-between font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs underline font-bold">
            Dispensar
          </button>
        </div>
      )}

      {/* CLOUD FIRESTORE STATUS & SYNC CARD (Official User Firebase Project) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950 text-white rounded-3xl p-6 border border-orange-500/30 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600/30 text-orange-400 rounded-2xl border border-orange-500/40 shadow-inner">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Google Cloud Firestore</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Firebase Web SDK v12 Ativo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                Projeto: <strong className="text-orange-400">{firebaseConfig.projectId}</strong> • Auth: {firebaseConfig.authDomain}
              </p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition flex items-center gap-2 text-slate-200"
          >
            {isTestingConn ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            )}
            Testar Conexão
          </button>
        </div>

        {connResult.status !== 'idle' && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              connResult.status === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            {connResult.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{connResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[11px] block mb-1">Project ID:</span>
            <span className="font-mono font-bold text-orange-300 text-sm">{firebaseConfig.projectId}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Região: us-central / São Paulo</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[11px] block mb-1">Storage Bucket:</span>
            <span className="font-mono font-semibold text-slate-200 text-xs truncate block">{firebaseConfig.storageBucket}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Armazenamento de recibos e assinaturas</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[11px] block mb-1">Última Sincronização:</span>
            <span className="font-bold text-emerald-300 text-xs">
              {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleString('pt-BR') : 'Ainda não executada'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {syncStatus.syncedMaterialsCount} materiais no log
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[11px] block mb-1">Regras de Segurança:</span>
            <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> firestore.rules
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">ABAC com Zero-Trust e RBAC ativo</span>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handlePushToFirestore}
            disabled={isPushing || isPulling}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-orange-600/20"
          >
            {isPushing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            Enviar Dados para Cloud Firestore (Upload)
          </button>

          <button
            onClick={handlePullFromFirestore}
            disabled={isPushing || isPulling}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-white/20"
          >
            {isPulling ? (
              <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
            ) : (
              <CloudDownload className="w-4 h-4 text-orange-400" />
            )}
            Baixar Dados do Cloud Firestore (Download)
          </button>

          <span className="text-[11px] text-slate-400 ml-auto hidden md:inline">
            Sincronização bidirecional idempotente para produção contínua.
          </span>
        </div>
      </div>

      {/* Database State Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-orange-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Estado Atual da Persistência de Dados</h3>
              <p className="text-xs text-slate-500">
                Mecanismo transacional com trava de concorrência e armazenamento persistente
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isDemo ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}
          >
            {isDemo ? 'Modo Demonstração Ativo' : 'Modo Produção Limpo'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500 block mb-1">Mecanismo de Persistência:</span>
            <span className="font-bold text-slate-900 text-sm">IndexedStorage + Transaction Mutex</span>
            <p className="text-[11px] text-slate-500 mt-1">
              Garante consistência atômica, cálculos em tempo real e proteção contra saídas simultâneas.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500 block mb-1">Regras de Segurança Firestore:</span>
            <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> firestore.rules Ativo
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Regras ABAC com Zero-Trust, validação de tipos, tamanhos e bloqueio de orphan writes.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500 block mb-1">Modelo Intermediário (IR):</span>
            <span className="font-bold text-blue-700 text-sm flex items-center gap-1">
              <FileCode className="w-4 h-4 text-blue-600" /> firebase-blueprint.json
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              6 coleções mapeadas com schemas estritos e tipagem TypeScript sincronizada.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {canConfigureSystem && (
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-orange-400" />
              Exportar Backup Completo (.JSON)
            </button>

            <button
              onClick={handleClearDatabase}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Dados de Demonstração (Iniciar Vazio)
            </button>

            <button
              onClick={handleRestoreDefault}
              className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Base Padrão de Limpeza Urbana
            </button>
          </div>
        )}
      </div>

      {/* CLOUD FIRESTORE & DEPLOYMENT INSTRUCTIONS (Honest & clear configuration guidelines) */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2 bg-orange-600 text-white rounded-xl">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              Arquitetura & Configuração de Nuvem para Produção (Google Cloud / Firebase)
            </h3>
            <p className="text-xs text-slate-400">
              Passo a passo transparente para conexão com instâncias externas sem credenciais expostas
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            O sistema CPLU foi arquitetado para desacoplamento total entre o frontend React (TypeScript) e o backend de persistência. A segurança é reforçada pelas seguintes diretrizes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
              <span className="font-bold text-orange-400 block text-xs">
                1. Conexão do Firebase Firestore
              </span>
              <p className="text-[11px] text-slate-400">
                O arquivo <code>firebase-applet-config.json</code> está configurado para o projeto <code>cplu-almxarifado</code> e as regras de <code>firestore.rules</code> protegem as coleções contra acessos indevidos.
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
              <span className="font-bold text-orange-400 block text-xs">
                2. Zero Credenciais Administrativas no Cliente
              </span>
              <p className="text-[11px] text-slate-400">
                Chaves de serviço privadas (Service Accounts) nunca são embutidas no código cliente. Todas as regras de leitura e gravação são asseguradas no servidor Firestore através das regras ABAC configuradas.
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
              <span className="font-bold text-orange-400 block text-xs">
                3. Transações Atômicas de Estoque
              </span>
              <p className="text-[11px] text-slate-400">
                A entrega de EPI e a baixa de estoque ocorrem em lote indivisível. Se houver falha de rede ou saldo insuficiente, toda a transação é revertida, impedindo inconsistência contábil.
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
              <span className="font-bold text-orange-400 block text-xs">
                4. Câmera, WebRTC e HTTPS
              </span>
              <p className="text-[11px] text-slate-400">
                A leitura de QR Codes de prateleiras por câmera requer conexão segura SSL/HTTPS. Em redes corporativas ou dispositivos sem câmera, o sistema disponibiliza a digitação direta do código.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DISASTER RECOVERY & BACKUP PROTOCOL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 text-xs space-y-2">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Procedimentos de Backup & Recuperação de Desastres (DRP)
        </h4>
        <p className="text-slate-600 text-[11px] leading-relaxed">
          Recomenda-se realizar a exportação semanal do backup em arquivo JSON pelo botão acima antes de inventários periódicos. Em caso de substituição de equipamentos ou restauração de emergência, os dados podem ser recarregados de forma íntegra mantendo o histórico de números de requisições e termos assinados.
        </p>
      </div>
    </div>
  );
};
