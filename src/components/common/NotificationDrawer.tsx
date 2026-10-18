import React from 'react';
import { X, AlertTriangle, AlertCircle, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SystemAlert } from '../../types';
import { formatDateTimeBR } from '../../utils/formatters';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SystemAlert[];
  onNavigate: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">Alertas & Notificações do Almoxarifado</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 stroke-1" />
              <p className="text-sm font-semibold text-slate-700">Tudo em conformidade!</p>
              <p className="text-xs text-slate-400 mt-1">
                Nenhum alerta de estoque crítico ou requisição pendente no momento.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border text-xs transition shadow-2xs ${
                  alert.severity === 'danger'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-blue-50/70 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {alert.severity === 'danger' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs">{alert.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTimeBR(alert.date)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                      {alert.message}
                    </p>
                    {alert.type.includes('REQ') ? (
                      <button
                        onClick={() => {
                          onNavigate('fulfillment');
                          onClose();
                        }}
                        className="mt-2 inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 text-[11px]"
                      >
                        Atender requisição agora <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onNavigate('movements');
                          onClose();
                        }}
                        className="mt-2 inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 text-[11px]"
                      >
                        Registrar entrada de reposição <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Notificações internas operacionais atualizadas em tempo real.
        </div>
      </div>
    </div>
  );
};
