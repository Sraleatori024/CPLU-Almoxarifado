import React, { useState, useEffect } from 'react';
import {
  History,
  Truck,
  Fuel,
  Wrench,
  CalendarClock,
  Search,
  Filter,
  DollarSign,
  Gauge,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Vehicle, VehicleTimelineEvent, FuelingRecord, ServiceOrder } from '../types';

interface VehicleHistoryPageProps {
  initialVehicleId?: string;
}

export const VehicleHistoryPage: React.FC<VehicleHistoryPageProps> = ({ initialVehicleId }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [timelineEvents, setTimelineEvents] = useState<VehicleTimelineEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    const list = dbService.getVehicles();
    setVehicles(list);

    let activeId = selectedVehicleId;
    if (!activeId) {
      if (initialVehicleId && list.some((v) => v.id === initialVehicleId)) {
        activeId = initialVehicleId;
      } else if (list.length > 0) {
        activeId = list[0].id;
      }
      setSelectedVehicleId(activeId);
    }

    if (activeId) {
      setTimelineEvents(dbService.getVehicleTimeline(activeId));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    setTimelineEvents(dbService.getVehicleTimeline(id));
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Statistics for selected vehicle
  const vehicleFuelings = selectedVehicleId ? dbService.getFuelings(selectedVehicleId) : [];
  const vehicleOrders = selectedVehicleId ? dbService.getServiceOrders(selectedVehicleId) : [];

  const totalFuelCost = vehicleFuelings.reduce((sum, f) => sum + f.totalCost, 0);
  const totalFuelLiters = vehicleFuelings.reduce((sum, f) => sum + f.liters, 0);
  const totalMaintCost = vehicleOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalOverallCost = totalFuelCost + totalMaintCost;

  const validKmLRecords = vehicleFuelings.filter((f) => f.calculatedKmPerLiter && f.calculatedKmPerLiter > 0);
  const avgKmL =
    validKmLRecords.length > 0
      ? Number(
          (
            validKmLRecords.reduce((sum, f) => sum + (f.calculatedKmPerLiter || 0), 0) /
            validKmLRecords.length
          ).toFixed(2)
        )
      : null;

  const filteredEvents = timelineEvents.filter((evt) => {
    const matchesType = filterType === 'all' || evt.type === filterType;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getEventIcon = (type: VehicleTimelineEvent['type']) => {
    switch (type) {
      case 'abastecimento':
        return <Fuel className="w-4 h-4 text-orange-600" />;
      case 'ordem_servico':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'preventiva':
        return <CalendarClock className="w-4 h-4 text-emerald-600" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Histórico & Linha do Tempo do Veículo
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Linha do tempo consolidada: abastecimentos, serviços mecânicos, custos e consumo acumulado.
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Quick Switcher */}
        <div className="w-full sm:w-72">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Selecione o Veículo:
          </label>
          <select
            value={selectedVehicleId}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.fleetNumber} ({v.plate}) — {v.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedVehicle && (
        <>
          {/* Vehicle Profile Strip */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-600 rounded-xl">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-black">{selectedVehicle.fleetNumber}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 font-mono font-bold text-xs">
                    {selectedVehicle.plate}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase">
                    {selectedVehicle.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year}) • Sub-região: {selectedVehicle.subRegion}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Odômetro Atual</span>
                <span className="font-bold text-sm text-white">
                  {selectedVehicle.currentOdometerKm.toLocaleString()} km
                </span>
              </div>
              <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Horímetro Atual</span>
                <span className="font-bold text-sm text-white">
                  {selectedVehicle.currentHourmeterHours > 0 ? `${selectedVehicle.currentHourmeterHours.toLocaleString()} h` : '—'}
                </span>
              </div>
              <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Média Histórica</span>
                <span className="font-bold text-sm text-emerald-400">
                  {avgKmL ? `${avgKmL} km/L` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Aggregated Cost Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Custo Combustível</p>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                R$ {totalFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-400">{totalFuelLiters.toLocaleString()} L abastecidos</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Custo Manutenção</p>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                R$ {totalMaintCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-400">{vehicleOrders.length} ordens de serviço</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Custo Total Operacional</p>
              <p className="text-xl font-black text-orange-600 mt-1 font-mono">
                R$ {totalOverallCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-400">combustível + peças + serviços</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Eventos</p>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">{timelineEvents.length}</p>
              <span className="text-[10px] text-slate-400">registros na linha do tempo</span>
            </div>
          </div>

          {/* Timeline Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filtrar eventos por texto, posto, mecânico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="w-full sm:w-60">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              >
                <option value="all">Todos os Tipos de Eventos</option>
                <option value="abastecimento">Apenas Abastecimentos</option>
                <option value="ordem_servico">Apenas Ordens de Serviço</option>
              </select>
            </div>
          </div>

          {/* Chronological Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Linha do Tempo Cronológica
            </h3>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhum evento registrado para este veículo até o momento.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-6">
                {filteredEvents.map((evt) => (
                  <div key={evt.id} className="relative group">
                    {/* Event Dot */}
                    <div className="absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center shadow-xs">
                      {getEventIcon(evt.type)}
                    </div>

                    {/* Event Card */}
                    <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(evt.date).toLocaleString('pt-BR')}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">{evt.description}</p>

                      {/* Odometers & Cost Pills */}
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                        {evt.odometerKm !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Odômetro: {evt.odometerKm.toLocaleString()} km
                          </span>
                        )}
                        {evt.hourmeterHours !== undefined && evt.hourmeterHours > 0 && (
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Horímetro: {evt.hourmeterHours.toLocaleString()} h
                          </span>
                        )}
                        {evt.cost !== undefined && evt.cost > 0 && (
                          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">
                            Custo: R$ {evt.cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
