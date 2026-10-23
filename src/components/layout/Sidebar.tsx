import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Layers,
  MapPin,
  Truck,
  Fuel,
  CalendarClock,
  Wrench,
  History,
  BarChart3,
  Settings2,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'almoxarifado_panel'
  | 'requisitions'
  | 'materials'
  | 'regional_comparison'
  | 'fleet'
  | 'fuel'
  | 'preventive'
  | 'service_orders'
  | 'vehicle_history'
  | 'reports'
  | 'admin_integrations'
  // Deep-linking / internal routes
  | 'tecnico_panel'
  | 'fulfillment'
  | 'excel_sync'
  | 'movements'
  | 'qrcodes'
  | 'employees'
  | 'epi_history'
  | 'audit'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingReqCount: number;
  newReqCount?: number;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingReqCount,
  newReqCount = 0,
  lowStockCount,
}) => {
  const { canManageUsers } = useAuth();

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    adminOnly?: boolean;
    numberTag: number;
  }[] = [
    {
      id: 'dashboard',
      label: '1. Visão Geral',
      icon: LayoutDashboard,
      numberTag: 1,
    },
    {
      id: 'almoxarifado_panel',
      label: '2. Almoxarifado',
      icon: Boxes,
      badge: newReqCount > 0 ? `${newReqCount} Nova(s)` : pendingReqCount > 0 ? pendingReqCount : undefined,
      badgeColor: newReqCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-white',
      numberTag: 2,
    },
    {
      id: 'requisitions',
      label: '3. Requisições',
      icon: ClipboardList,
      numberTag: 3,
    },
    {
      id: 'materials',
      label: '4. Estoque e Consolidado',
      icon: Layers,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
      numberTag: 4,
    },
    {
      id: 'regional_comparison',
      label: '5. Postos e Sub-regiões',
      icon: MapPin,
      numberTag: 5,
    },
    {
      id: 'fleet',
      label: '6. Mecânica e Frota',
      icon: Truck,
      numberTag: 6,
    },
    {
      id: 'fuel',
      label: '7. Abastecimento',
      icon: Fuel,
      numberTag: 7,
    },
    {
      id: 'preventive',
      label: '8. Manutenção Preventiva',
      icon: CalendarClock,
      numberTag: 8,
    },
    {
      id: 'service_orders',
      label: '9. Ordens de Serviço',
      icon: Wrench,
      numberTag: 9,
    },
    {
      id: 'vehicle_history',
      label: '10. Histórico de Veículos',
      icon: History,
      numberTag: 10,
    },
    {
      id: 'reports',
      label: '11. Relatórios Gerenciais',
      icon: BarChart3,
      numberTag: 11,
    },
    {
      id: 'admin_integrations',
      label: '12. Administração & Integrações',
      icon: Settings2,
      numberTag: 12,
    },
  ];

  const handleNav = (tab: NavigationTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-40 lg:z-10 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-sm">
              C
            </div>
            <span className="font-extrabold text-white text-base">CPLU Almoxarifado</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Módulos Operacionais
          </div>

          {navItems.map((item) => {
            if (item.adminOnly && !canManageUsers) return null;
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition group ${
                  isActive
                    ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Operational Status Footer Widget */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-slate-300">Status Operacional</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Ativo
              </span>
            </div>
            <div className="space-y-1 text-[10px] text-slate-400">
              <div className="flex justify-between">
                <span>Itens com Estoque Baixo:</span>
                <span className={`font-mono font-bold ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {lowStockCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Requisições Pendentes:</span>
                <span className={`font-mono font-bold ${pendingReqCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {pendingReqCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
