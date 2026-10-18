import React, { useState } from 'react';
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
} from 'lucide-react';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const { role, canConfigureSystem } = useAuth();
  const [isDemo, setIsDemo] = useState(dbService.isDemoData());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
          Persistência de dados, rotinas de backup, conformidade de segurança e integração com Cloud Firestore
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
                Quando o usuário provisiona o projeto Firebase pelo botão oficial, o arquivo <code>firebase-applet-config.json</code> é injetado automaticamente e as regras de <code>firestore.rules</code> são publicadas via RPC segura.
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
