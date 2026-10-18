import React, { useState } from 'react';
import {
  Bell,
  Search,
  QrCode,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { dbService } from '../../services/db';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQRScanner: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenQRScanner,
  onOpenSearch,
  onOpenNotifications,
  unreadAlertCount,
}) => {
  const { currentUser, role, loginAs, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const isDemo = dbService.isDemoData();

  const roleLabels: Record<UserRole, { label: string; badgeColor: string }> = {
    administrador: { label: 'Administrador', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300' },
    almoxarife: { label: 'Almoxarife', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300' },
    tecnico_seguranca: { label: 'Técnico de Segurança', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    gestor: { label: 'Gestor / Consulta', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' },
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Demo Banner if demo data is active */}
      {isDemo && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ambiente com Dados de Demonstração CPLU</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDemoModal(true)}
              className="text-[11px] underline hover:text-black font-bold transition"
            >
              Gerenciar Base de Dados (Limpar / Restaurar)
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">CPLU</span>
                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded border border-orange-200">
                  Almoxarifado
                </span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider hidden sm:block">
                Operação de Limpeza Urbana
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-lg hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-400 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl transition cursor-text group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition" />
              <span>Buscar material, matrícula, requisição...</span>
            </div>
            <kbd className="hidden lg:inline-block text-[10px] bg-white border border-slate-300 text-slate-500 px-1.5 py-0.5 rounded font-mono shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Scanner & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
            title="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Quick QR Scanner Button */}
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold transition shadow-2xs"
            title="Abrir Câmera para Leitura de QR Code"
          >
            <QrCode className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">Escanear QR</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Alertas e Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </span>
            )}
          </button>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 text-xs transition"
              title="Alternar Perfil para Testes"
            >
              <Shield className="w-3.5 h-3.5 text-orange-600" />
              <span className="font-semibold text-slate-800 hidden sm:inline">
                {roleLabels[role]?.label || role}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* Role dropdown */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Simular Perfil de Acesso:
                  </p>
                </div>
                {(['administrador', 'almoxarife', 'tecnico_seguranca', 'gestor'] as UserRole[]).map(
                  (targetRole) => (
                    <button
                      key={targetRole}
                      onClick={() => {
                        loginAs(targetRole);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-orange-50 transition ${
                        role === targetRole ? 'bg-orange-50/70 font-bold text-orange-900' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{roleLabels[targetRole].label}</div>
                        <div className="text-[10px] text-slate-500">
                          {targetRole === 'administrador' && 'Acesso total, usuários e estoque'}
                          {targetRole === 'almoxarife' && 'Entradas, saídas e entregas de EPI'}
                          {targetRole === 'tecnico_seguranca' && 'Requisições e cadastro de equipe'}
                          {targetRole === 'gestor' && 'Visualização e relatórios operacionais'}
                        </div>
                      </div>
                      {role === targetRole && (
                        <span className="w-2 h-2 rounded-full bg-orange-600" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {currentUser?.name || 'Usuário'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser?.matricula}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Demo Data Management Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">Base de Dados & Demonstração</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              O sistema oferece dados representativos da rotina de limpeza urbana (materiais, EPIs, requisições e histórico) para testes imediatos. Você pode alternar entre a base de demonstração ou iniciar um banco limpo de produção.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  dbService.clearAllData();
                  setShowDemoModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Dados Fictícios (Iniciar Banco Vazio)
              </button>

              <button
                onClick={() => {
                  dbService.resetToSeedData();
                  setShowDemoModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar Dados Padrão de Limpeza Urbana
              </button>
            </div>

            <button
              onClick={() => setShowDemoModal(false)}
              className="w-full mt-4 text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
