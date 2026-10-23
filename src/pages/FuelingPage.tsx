import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Gauge,
  Clock,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  X,
  Truck,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { dbService } from '../services/db';
import { FuelingRecord, Vehicle, VehicleFuelType } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface FuelingPageProps {
  initialVehicleId?: string;
}

export const FuelingPage: React.FC<FuelingPageProps> = ({ initialVehicleId }) => {
  const { currentUser } = useAuth();
  const [fuelings, setFuelings] = useState<FuelingRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Form State
  const [formVehicleId, setFormVehicleId] = useState<string>('');
  const [formDateTime, setFormDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [formDriverName, setFormDriverName] = useState('');
  const [formFuelType, setFormFuelType] = useState<VehicleFuelType>('diesel_s10');
  const [formLiters, setFormLiters] = useState<number | ''>('');
  const [formUnitPrice, setFormUnitPrice] = useState<number | ''>(5.89);
  const [formOdometerKm, setFormOdometerKm] = useState<number | ''>('');
  const [formHourmeterHours, setFormHourmeterHours] = useState<number | ''>('');
  const [formPumpMeterVolume, setFormPumpMeterVolume] = useState<number | ''>('');
  const [formPumpId, setFormPumpId] = useState('Bomba 01 - Diesel S10 Central');
  const [formStationLocation, setFormStationLocation] = useState('Posto Interno CPLU Almoxarifado');
  const [formDocumentNumber, setFormDocumentNumber] = useState('');
  const [formFullTank, setFormFullTank] = useState(true);
  const [formNotes, setFormNotes] = useState('');
  const [allowOverride, setAllowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setFuelings(dbService.getFuelings());
    const vehs = dbService.getVehicles();
    setVehicles(vehs);
    if (!formVehicleId && vehs.length > 0) {
      setFormVehicleId(vehs[0].id);
      setFormFuelType(vehs[0].fuelType);
      setFormOdometerKm(vehs[0].currentOdometerKm);
      setFormHourmeterHours(vehs[0].currentHourmeterHours || 0);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  const selectedVehicleObj = vehicles.find((v) => v.id === formVehicleId);

  const handleVehicleChange = (vehId: string) => {
    setFormVehicleId(vehId);
    const v = vehicles.find((item) => item.id === vehId);
    if (v) {
      setFormFuelType(v.fuelType);
      setFormOdometerKm(v.currentOdometerKm);
      setFormHourmeterHours(v.currentHourmeterHours || 0);
    }
  };

  const handleLitersChange = (val: number | '') => {
    setFormLiters(val);
    if (typeof val === 'number') {
      setFormPumpMeterVolume(val);
    }
  };

  const calculatedTotal =
    typeof formLiters === 'number' && typeof formUnitPrice === 'number'
      ? Number((formLiters * formUnitPrice).toFixed(2))
      : 0;

  const handleSubmitFueling = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formVehicleId) {
      setFormError('Selecione o veículo a ser abastecido.');
      return;
    }

    if (!formLiters || Number(formLiters) <= 0) {
      setFormError('Informe a quantidade de litros abastecida.');
      return;
    }

    if (formOdometerKm === '' || Number(formOdometerKm) < 0) {
      setFormError('Informe a leitura atual do odômetro do veículo.');
      return;
    }

    const veh = vehicles.find((v) => v.id === formVehicleId);
    if (!veh) {
      setFormError('Veículo não encontrado.');
      return;
    }

    const res = dbService.registerFueling({
      vehicleId: veh.id,
      fleetNumber: veh.fleetNumber,
      plate: veh.plate,
      dateTime: formDateTime ? new Date(formDateTime).toISOString() : new Date().toISOString(),
      driverName: formDriverName.trim() || undefined,
      fuelType: formFuelType,
      liters: Number(formLiters),
      unitPrice: Number(formUnitPrice) || 5.89,
      totalCost: calculatedTotal,
      odometerKm: Number(formOdometerKm),
      hourmeterHours: Number(formHourmeterHours) || 0,
      pumpMeterVolume: Number(formPumpMeterVolume) || Number(formLiters),
      pumpId: formPumpId,
      stationLocation: formStationLocation,
      documentNumber: formDocumentNumber.trim() || undefined,
      fullTank: formFullTank,
      notes: overrideReason ? `[OVERRIDE ODÔMETRO: ${overrideReason}] ${formNotes}` : formNotes,
      createdByUserName: currentUser?.name || 'Almoxarifado / Mecânica',
      allowOdometerOverride: allowOverride,
    });

    if (!res.success) {
      setFormError(res.error || 'Erro ao registrar abastecimento.');
      return;
    }

    setIsRegisterModalOpen(false);
    // Reset form
    setFormLiters('');
    setFormDriverName('');
    setFormDocumentNumber('');
    setFormNotes('');
    setAllowOverride(false);
    setOverrideReason('');
  };

  // Filter fuelings
  const filteredFuelings = fuelings.filter((f) => {
    const matchesVehicle = selectedVehicleId === 'all' || f.vehicleId === selectedVehicleId;
    const matchesSearch =
      f.fleetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.driverName && f.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.documentNumber && f.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.stationLocation.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesVehicle && matchesSearch;
  });

  // Calculate metrics for current filter
  const totalLiters = filteredFuelings.reduce((sum, f) => sum + f.liters, 0);
  const totalSpent = filteredFuelings.reduce((sum, f) => sum + f.totalCost, 0);
  const fuelingsWithKmL = filteredFuelings.filter((f) => f.calculatedKmPerLiter && f.calculatedKmPerLiter > 0);
  const avgKmL =
    fuelingsWithKmL.length > 0
      ? Number(
          (
            fuelingsWithKmL.reduce((sum, f) => sum + (f.calculatedKmPerLiter || 0), 0) / fuelingsWithKmL.length
          ).toFixed(2)
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Controle de Abastecimento
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Registro de odômetro, horímetro e volume da bomba com cálculo de consumo (km/L e R$/km).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsRegisterModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Novo Abastecimento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Abastecido</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalLiters.toLocaleString()} L</p>
          <span className="text-[10px] text-slate-400">nos registros filtrados</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valor Total (R$)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">gasto com combustível</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Média Geral da Frota</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {avgKmL > 0 ? `${avgKmL} km/L` : '—'}
          </p>
          <span className="text-[10px] text-slate-400">tanque cheio com intervalo</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Alertas de Anomalia</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {filteredFuelings.filter((f) => f.anomalyAlert).length}
          </p>
          <span className="text-[10px] text-slate-400">desvios de consumo detectados</span>
        </div>
      </div>

      {/* Search and Vehicle Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por prefixo, placa, cupom ou motorista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            >
              <option value="all">Todos os Veículos da Frota</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.fleetNumber} ({v.plate}) - {v.model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fueling History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Veículo</th>
                <th className="py-3.5 px-4">Motorista / Cupom</th>
                <th className="py-3.5 px-4 text-right">Odômetro</th>
                <th className="py-3.5 px-4 text-right">Horímetro</th>
                <th className="py-3.5 px-4 text-right">Bomba (L)</th>
                <th className="py-3.5 px-4 text-right">Volume</th>
                <th className="py-3.5 px-4 text-right">Média km/L</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFuelings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum registro de abastecimento encontrado.
                  </td>
                </tr>
              ) : (
                filteredFuelings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {new Date(f.dateTime).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(f.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{f.fleetNumber}</div>
                      <div className="text-xs text-slate-500 font-mono">{f.plate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{f.driverName || 'Não especificado'}</div>
                      <div className="text-xs text-slate-400">{f.documentNumber || f.stationLocation}</div>
                      {f.anomalyAlert && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{f.anomalyAlert}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {f.odometerKm.toLocaleString()} km
                      {f.kmDistanceSinceLast !== undefined && f.kmDistanceSinceLast > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-normal">
                          +{f.kmDistanceSinceLast.toLocaleString()} km
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {f.hourmeterHours > 0 ? `${f.hourmeterHours.toLocaleString()} h` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {f.pumpMeterVolume ? `${f.pumpMeterVolume.toLocaleString()} L` : `${f.liters} L`}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900 font-mono">{f.liters.toLocaleString()} L</div>
                      <div className="text-[10px] text-slate-500 uppercase">{f.fuelType.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {f.calculatedKmPerLiter ? (
                        <div>
                          <span className="font-bold text-emerald-700 font-mono">
                            {f.calculatedKmPerLiter} km/L
                          </span>
                          {f.costPerKm && (
                            <span className="block text-[10px] text-slate-400">
                              R$ {f.costPerKm.toFixed(2)}/km
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Parcial</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      R$ {f.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        R$ {f.unitPrice.toFixed(2)}/L
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Fueling Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Fuel className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-base">Registrar Abastecimento de Veículo</h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFueling} className="p-6 overflow-y-auto space-y-4 text-sm">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Veículo da Frota *
                </label>
                <select
                  required
                  value={formVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white font-medium"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.fleetNumber} ({v.plate}) — {v.model} [Odômetro atual: {v.currentOdometerKm.toLocaleString()} km]
                    </option>
                  ))}
                </select>
              </div>

              {/* Odometers & Hourmeter Distinction Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-600 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-orange-600" />
                    Leituras do Veículo e da Bomba
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Último odômetro: {selectedVehicleObj?.currentOdometerKm.toLocaleString()} km
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Odômetro do Caminhão (km) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ex: 48550"
                      value={formOdometerKm}
                      onChange={(e) => setFormOdometerKm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Horímetro do Motor (h)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 3825"
                      value={formHourmeterHours}
                      onChange={(e) => setFormHourmeterHours(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Medidor da Bomba (Litros)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Contador da bomba"
                      value={formPumpMeterVolume}
                      onChange={(e) => setFormPumpMeterVolume(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                {/* Warning if odometer is lower */}
                {typeof formOdometerKm === 'number' &&
                  selectedVehicleObj &&
                  formOdometerKm < selectedVehicleObj.currentOdometerKm && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Atenção: Odômetro digitado é menor que a leitura anterior registrada!</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={allowOverride}
                          onChange={(e) => setAllowOverride(e.target.checked)}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span>Autorizar justificativa / override manual de odômetro</span>
                      </label>
                      {allowOverride && (
                        <input
                          type="text"
                          required
                          placeholder="Motivo (ex: Troca de velocímetro ou reset do painel na oficina)"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded bg-white"
                        />
                      )}
                    </div>
                  )}
              </div>

              {/* Fuel Volume & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Litros Abastecidos *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.01"
                    placeholder="Ex: 140.5"
                    value={formLiters}
                    onChange={(e) => handleLitersChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Preço por Litro (R$)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.001"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Valor Total Calculado
                  </label>
                  <div className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-black text-slate-900">
                    R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Station & Pump */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Posto / Local</label>
                  <input
                    type="text"
                    value={formStationLocation}
                    onChange={(e) => setFormStationLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bomba de Abastecimento</label>
                  <input
                    type="text"
                    value={formPumpId}
                    onChange={(e) => setFormPumpId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Driver & Cupom (Non-employee logic) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome do Motorista (Opcional - Apenas texto)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do condutor no momento do abastecimento"
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número do Cupom / NF / Ticket
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NF-66490 ou CUPOM-9921"
                    value={formDocumentNumber}
                    onChange={(e) => setFormDocumentNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Tanque Cheio checkbox for precise km/l */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="fullTank"
                  checked={formFullTank}
                  onChange={(e) => setFormFullTank(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <label htmlFor="fullTank" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Tanque completado (Permite cálculo preciso de consumo médio km/L)
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais do abastecimento..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  Confirmar e Salvar Abastecimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
