import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Wrench,
  Check,
  X,
  Gauge,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { dbService } from '../services/db';
import { MaintenancePlan, Vehicle } from '../types';

interface PreventiveMaintenancePageProps {
  onNavigateToOS?: (vehicleId: string) => void;
}

export const PreventiveMaintenancePage: React.FC<PreventiveMaintenancePageProps> = ({
  onNavigateToOS,
}) => {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [executingPlan, setExecutingPlan] = useState<MaintenancePlan | null>(null);

  // New Plan Form
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formServiceCategory, setFormServiceCategory] = useState('Troca de Óleo de Motor & Filtros');
  const [formDescription, setFormDescription] = useState('');
  const [formIntervalKm, setFormIntervalKm] = useState<number | ''>(10000);
  const [formIntervalHours, setFormIntervalHours] = useState<number | ''>('');
  const [formIntervalDays, setFormIntervalDays] = useState<number | ''>('');
  const [formNextDueDate, setFormNextDueDate] = useState('');

  // Execution Form
  const [execKm, setExecKm] = useState<number | ''>('');
  const [execHours, setExecHours] = useState<number | ''>('');
  const [execNotes, setExecNotes] = useState('');

  const loadData = () => {
    const p = dbService.getMaintenancePlans();
    setPlans(p);
    const v = dbService.getVehicles();
    setVehicles(v);
    if (!formVehicleId && v.length > 0) {
      setFormVehicleId(v[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleOpenExecution = (plan: MaintenancePlan) => {
    setExecutingPlan(plan);
    const veh = vehicles.find((v) => v.id === plan.vehicleId);
    setExecKm(veh ? veh.currentOdometerKm : plan.nextDueKm || 0);
    setExecHours(veh ? veh.currentHourmeterHours : plan.nextDueHours || 0);
    setExecNotes('');
  };

  const handleConfirmExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingPlan) return;

    const currentKm = Number(execKm) || 0;
    const currentHours = Number(execHours) || 0;
    const now = new Date();

    // Calculate next targets based on intervals
    let nextDueKm: number | undefined = undefined;
    if (executingPlan.intervalKm) {
      nextDueKm = currentKm + executingPlan.intervalKm;
    }

    let nextDueHours: number | undefined = undefined;
    if (executingPlan.intervalHours) {
      nextDueHours = currentHours + executingPlan.intervalHours;
    }

    let nextDueDate: string | undefined = undefined;
    if (executingPlan.intervalDays) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + executingPlan.intervalDays);
      nextDueDate = nextDate.toISOString().split('T')[0];
    }

    dbService.updateMaintenancePlan(executingPlan.id, {
      lastExecutedDate: now.toISOString(),
      lastExecutedKm: currentKm,
      lastExecutedHours: currentHours,
      nextDueKm,
      nextDueHours,
      nextDueDate,
      status: 'em_dia',
    });

    // Also update vehicle odometer/hours if higher
    dbService.updateVehicle(executingPlan.vehicleId, {
      currentOdometerKm: Math.max(currentKm, vehicles.find((v) => v.id === executingPlan.vehicleId)?.currentOdometerKm || 0),
      currentHourmeterHours: Math.max(currentHours, vehicles.find((v) => v.id === executingPlan.vehicleId)?.currentHourmeterHours || 0),
    });

    setExecutingPlan(null);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === formVehicleId);
    if (!veh) return;

    let nextDueKm: number | undefined = undefined;
    if (formIntervalKm) {
      nextDueKm = veh.currentOdometerKm + Number(formIntervalKm);
    }

    let nextDueHours: number | undefined = undefined;
    if (formIntervalHours) {
      nextDueHours = (veh.currentHourmeterHours || 0) + Number(formIntervalHours);
    }

    let nextDueDate = formNextDueDate || undefined;
    if (formIntervalDays && !nextDueDate) {
      const d = new Date();
      d.setDate(d.getDate() + Number(formIntervalDays));
      nextDueDate = d.toISOString().split('T')[0];
    }

    dbService.createMaintenancePlan({
      vehicleId: veh.id,
      fleetNumber: veh.fleetNumber,
      serviceCategory: formServiceCategory,
      description: formDescription || formServiceCategory,
      intervalKm: formIntervalKm ? Number(formIntervalKm) : undefined,
      intervalHours: formIntervalHours ? Number(formIntervalHours) : undefined,
      intervalDays: formIntervalDays ? Number(formIntervalDays) : undefined,
      lastExecutedKm: veh.currentOdometerKm,
      lastExecutedHours: veh.currentHourmeterHours,
      lastExecutedDate: new Date().toISOString(),
      nextDueKm,
      nextDueHours,
      nextDueDate,
    });

    setIsNewPlanModalOpen(false);
    setFormDescription('');
  };

  const filteredPlans = plans.filter((p) => {
    const matchesVehicle = selectedVehicleFilter === 'all' || p.vehicleId === selectedVehicleFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch =
      p.fleetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.serviceCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesVehicle && matchesStatus && matchesSearch;
  });

  const overdueCount = plans.filter((p) => p.status === 'vencida').length;
  const upcomingCount = plans.filter((p) => p.status === 'proxima').length;
  const onTimeCount = plans.filter((p) => p.status === 'em_dia').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Manutenção Preventiva
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Planos periódicos por quilometragem, horímetro ou dias para a frota de limpeza urbana.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewPlanModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Novo Plano Preventivo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Manutenções Vencidas</p>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-1">{overdueCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Requer atenção imediata na oficina</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Próximas do Vencimento</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{upcomingCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Dentro de 500 km ou 7 dias</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Em Dia</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{onTimeCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Planos regulares com folga</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por prefixo, serviço ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          >
            <option value="all">Todos os Veículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.fleetNumber} ({v.plate})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="vencida">Vencida</option>
            <option value="proxima">Próxima</option>
            <option value="em_dia">Em Dia</option>
          </select>
        </div>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            Nenhum plano preventivo encontrado com os filtros aplicados.
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const veh = vehicles.find((v) => v.id === plan.vehicleId);
            const isOverdue = plan.status === 'vencida';
            const isUpcoming = plan.status === 'proxima';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                  isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-300/50'
                    : isUpcoming
                    ? 'border-amber-300 ring-1 ring-amber-300/50'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-black text-slate-900 text-lg px-2.5 py-1 bg-slate-100 rounded-lg">
                      {plan.fleetNumber}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertCircle className="w-3.5 h-3.5" /> VENCIDA
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3.5 h-3.5" /> PRÓXIMA
                      </span>
                    )}
                    {!isOverdue && !isUpcoming && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> EM DIA
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">{plan.serviceCategory}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>

                  {/* Interval specifications */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Intervalo programado:</span>
                      <span className="font-semibold text-slate-900">
                        {[
                          plan.intervalKm ? `${plan.intervalKm.toLocaleString()} km` : null,
                          plan.intervalHours ? `${plan.intervalHours} h` : null,
                          plan.intervalDays ? `${plan.intervalDays} dias` : null,
                        ]
                          .filter(Boolean)
                          .join(' ou ')}
                      </span>
                    </div>

                    {plan.nextDueKm && (
                      <div className="flex justify-between text-slate-600">
                        <span>Vence no km:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {plan.nextDueKm.toLocaleString()} km
                          {veh && (
                            <span className="text-[10px] text-slate-500 font-normal ml-1">
                              (atual: {veh.currentOdometerKm.toLocaleString()})
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {plan.nextDueHours && (
                      <div className="flex justify-between text-slate-600">
                        <span>Vence no horímetro:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {plan.nextDueHours.toLocaleString()} h
                        </span>
                      </div>
                    )}

                    {plan.nextDueDate && (
                      <div className="flex justify-between text-slate-600">
                        <span>Data limite:</span>
                        <span className="font-medium text-slate-900">
                          {new Date(plan.nextDueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenExecution(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Registrar Execução
                  </button>

                  {onNavigateToOS && (
                    <button
                      onClick={() => onNavigateToOS(plan.vehicleId)}
                      className="inline-flex items-center justify-center p-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition"
                      title="Gerar Ordem de Serviço na oficina"
                    >
                      <Wrench className="w-4 h-4 text-slate-600" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Execution Confirmation Modal */}
      {executingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Registrar Conclusão de Preventiva</h3>
              </div>
              <button
                onClick={() => setExecutingPlan(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmExecution} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {executingPlan.fleetNumber}
                </span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{executingPlan.serviceCategory}</p>
                <p className="text-slate-500 mt-1">{executingPlan.description}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Quilometragem no Momento da Troca/Serviço (km) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={execKm}
                  onChange={(e) => setExecKm(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Horímetro no Momento do Serviço (h)
                </label>
                <input
                  type="number"
                  min="0"
                  value={execHours}
                  onChange={(e) => setExecHours(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                O sistema atualizará automaticamente a data de execução para hoje e calculará o próximo vencimento
                baseado nos intervalos do plano.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExecutingPlan(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Confirmar Execução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm">Criar Novo Plano Preventivo</h3>
              </div>
              <button
                onClick={() => setIsNewPlanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Veículo *</label>
                <select
                  required
                  value={formVehicleId}
                  onChange={(e) => setFormVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.fleetNumber} ({v.plate}) - {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Categoria do Serviço *</label>
                <select
                  value={formServiceCategory}
                  onChange={(e) => setFormServiceCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Troca de Óleo de Motor & Filtros">Troca de Óleo de Motor & Filtros</option>
                  <option value="Engraxamento de Chassi e Pinos da Prensa">Engraxamento de Chassi e Pinos da Prensa</option>
                  <option value="Revisão do Sistema de Freios e Cuícas">Revisão do Sistema de Freios e Cuícas</option>
                  <option value="Troca de Filtro de Ar e Sedimentador">Troca de Filtro de Ar e Sedimentador</option>
                  <option value="Revisão do Sistema Hidráulico da Caçamba">Revisão do Sistema Hidráulico da Caçamba</option>
                  <option value="Alinhamento e Rodízio de Pneus">Alinhamento e Rodízio de Pneus</option>
                  <option value="Revisão Geral de Motor e Turbina">Revisão Geral de Motor e Turbina</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Descrição / Instruções</label>
                <input
                  type="text"
                  placeholder="Ex: Troca de 28L de 15W40, filtro blindado e anel de vedação"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Intervalo (km)</label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={formIntervalKm}
                    onChange={(e) => setFormIntervalKm(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Intervalo (Horas)</label>
                  <input
                    type="number"
                    placeholder="250"
                    value={formIntervalHours}
                    onChange={(e) => setFormIntervalHours(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Intervalo (Dias)</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={formIntervalDays}
                    onChange={(e) => setFormIntervalDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPlanModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
