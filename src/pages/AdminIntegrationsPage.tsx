import React, { useState } from 'react';
import {
  Settings,
  FileSpreadsheet,
  Cloud,
  ShieldAlert,
  UserCheck,
  Shield,
  Layers,
} from 'lucide-react';
import { ExcelSyncPage } from './ExcelSyncPage';
import { SettingsPage } from './SettingsPage';
import { AuditPage } from './AuditPage';
import { UsersPage } from './UsersPage';

export type AdminTab = 'excel' | 'firebase' | 'audit' | 'users';

interface AdminIntegrationsPageProps {
  initialTab?: AdminTab;
}

export const AdminIntegrationsPage: React.FC<AdminIntegrationsPageProps> = ({
  initialTab = 'excel',
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  return (
    <div className="space-y-6">
      {/* Module Header with Sub-tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Administração & Integrações
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Sincronização Excel, conexão Firebase/Nuvem, trilha de auditoria e controle de acesso.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition whitespace-nowrap ${
              activeTab === 'excel'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Sincronização Excel (CONSUMO MATERIAL CPLU.xlsx)
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Configurações & Firebase
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Trilha de Auditoria
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Usuários & Permissões
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'excel' && <ExcelSyncPage />}
        {activeTab === 'firebase' && <SettingsPage />}
        {activeTab === 'audit' && <AuditPage />}
        {activeTab === 'users' && <UsersPage />}
      </div>
    </div>
  );
};
