import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Fuel,
  Gauge,
  History,
  X,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Vehicle, VehicleType, VehicleStatus, VehicleFuelType } from '../types';

interface FleetVehiclesPageProps {
  onNavigateToFuel?: (vehicleId: string) => void;
  onNavigateToOS?: (vehicleId: string) => void;
  onNavigateToHistory?: (vehicleId: string) => void;
}

export const FleetVehiclesPage: React.FC<FleetVehiclesPageProps> = ({
  onNavigateToFuel,
  onNavigateToOS,
  onNavigateToHistory,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fleetNumber: '',
    plate: '',
    type: 'compactador' as VehicleType,
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'diesel_s10' as VehicleFuelType,
    tankCapacityLiters: 210,
    currentOdometerKm: 0,
    currentHourmeterHours: 0,
    acquisitionDate: new Date().toISOString().split('T')[0],
    subRegion: 'Ipiranga',
    status: 'disponivel' as VehicleStatus,
    notes: '',
  });

  const loadData = () => {
    const list = dbService.getVehicles();
    setVehicles(list);
    const regs = dbService.getRegions().map((r) => r.name);
    setRegions(regs);
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const resetForm = () => {
    setFormData({
      fleetNumber: '',
      plate: '',
      type: 'compactador',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      fuelType: 'diesel_s10',
      tankCapacityLiters: 210,
      currentOdometerKm: 0,
      currentHourmeterHours: 0,
      acquisitionDate: new Date().toISOString().split('T')[0],
      subRegion: regions[0] || 'Ipiranga',
      status: 'disponivel',
      notes: '',
    });
    setEditingVehicle(null);
  };

  const handleOpenEdit = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setFormData({
      fleetNumber: veh.fleetNumber,
      plate: veh.plate,
      type: veh.type,
      brand: veh.brand,
      model: veh.model,
      year: veh.year,
      fuelType: veh.fuelType,
      tankCapacityLiters: veh.tankCapacityLiters,
      currentOdometerKm: veh.currentOdometerKm,
      currentHourmeterHours: veh.currentHourmeterHours,
      acquisitionDate: veh.acquisitionDate || '',
      subRegion: veh.subRegion,
      status: veh.status,
      notes: veh.notes || '',
    });
    setIsNewModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fleetNumber.trim() || !formData.plate.trim() || !formData.model.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Prefixo, Placa e Modelo).');
      return;
    }

    if (editingVehicle) {
      dbService.updateVehicle(editingVehicle.id, {
        ...formData,
        fleetNumber: formData.fleetNumber.toUpperCase(),
        plate: formData.plate.toUpperCase(),
      });
    } else {
      dbService.createVehicle({
        ...formData,
        fleetNumber: formData.fleetNumber.toUpperCase(),
        plate: formData.plate.toUpperCase(),
      });
    }

    setIsNewModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja remover o veículo ${name} da frota?`)) {
      dbService.deleteVehicle(id);
      if (selectedVehicle?.id === id) {
        setSelectedVehicle(null);
      }
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.fleetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.subRegion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || v.type === filterType;
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesRegion = filterRegion === 'all' || v.subRegion === filterRegion;

    return matchesSearch && matchesType && matchesStatus && matchesRegion;
  });

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'disponivel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disponível
          </span>
        );
      case 'em_operacao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Em Operação
          </span>
        );
      case 'em_manutencao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Wrench className="w-3.5 h-3.5" /> Em Manutenção
          </span>
        );
      case 'parado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" /> Parado
          </span>
        );
      case 'baixado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            Baixado
          </span>
        );
    }
  };

  const getTypeLabel = (type: VehicleType) => {
    switch (type) {
      case 'compactador':
        return 'Caminhão Compactador';
      case 'basculante':
        return 'Caminhão Basculante';
      case 'pipa':
        return 'Caminhão Pipa';
      case 'carroceria':
        return 'Caminhão Carroceria';
      case 'apoio':
        return 'Veículo de Apoio';
      case 'maquina':
        return 'Máquina / Trator';
      default:
        return 'Outro';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Mecânica & Gestão de Frota
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Cadastro e controle operacional de caminhões compactadores, pipas, basculantes e apoio.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Novo Veículo
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Veículos</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{vehicles.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Disponíveis / Operação</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {vehicles.filter((v) => v.status === 'disponivel' || v.status === 'em_operacao').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Em Manutenção</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {vehicles.filter((v) => v.status === 'em_manutencao').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Parados / Baixados</p>
          <p className="text-2xl font-black text-rose-700 mt-1">
            {vehicles.filter((v) => v.status === 'parado' || v.status === 'baixado').length}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por prefixo, placa, modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            >
              <option value="all">Todos os Tipos</option>
              <option value="compactador">Caminhão Compactador</option>
              <option value="basculante">Caminhão Basculante</option>
              <option value="pipa">Caminhão Pipa</option>
              <option value="carroceria">Caminhão Carroceria</option>
              <option value="apoio">Veículo de Apoio</option>
              <option value="maquina">Máquinas & Tratores</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            >
              <option value="all">Todos os Status</option>
              <option value="disponivel">Disponível</option>
              <option value="em_operacao">Em Operação</option>
              <option value="em_manutencao">Em Manutenção</option>
              <option value="parado">Parado</option>
              <option value="baixado">Baixado</option>
            </select>
          </div>

          <div>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            >
              <option value="all">Todas as Sub-regiões</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Veículo / Prefixo</th>
                <th className="py-3.5 px-4">Tipo & Modelo</th>
                <th className="py-3.5 px-4">Sub-região</th>
                <th className="py-3.5 px-4 text-right">Odômetro (km)</th>
                <th className="py-3.5 px-4 text-right">Horímetro (h)</th>
                <th className="py-3.5 px-4">Combustível</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum veículo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((veh) => (
                  <tr
                    key={veh.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setSelectedVehicle(veh)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-base">{veh.fleetNumber}</div>
                      <div className="text-xs text-slate-500 font-mono tracking-wider">{veh.plate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{veh.model}</div>
                      <div className="text-xs text-slate-500">
                        {getTypeLabel(veh.type)} • {veh.brand} ({veh.year})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        {veh.subRegion}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {veh.currentOdometerKm.toLocaleString()} km
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {veh.currentHourmeterHours > 0 ? `${veh.currentHourmeterHours.toLocaleString()} h` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {veh.fuelType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(veh.status)}</td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(veh)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Editar cadastro do veículo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(veh.id, veh.fleetNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remover veículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Profile Detail Drawer / Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-600 rounded-xl">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black font-mono tracking-tight">{selectedVehicle.fleetNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 font-mono font-bold">
                      {selectedVehicle.plate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedVehicle.model} • {selectedVehicle.brand}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">Status Operacional</span>
                  <div className="mt-1">{getStatusBadge(selectedVehicle.status)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Sub-região Base</span>
                  <div className="mt-1 font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    {selectedVehicle.subRegion}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Odômetro Atual</span>
                  <div className="mt-1 font-mono font-bold text-slate-900">
                    {selectedVehicle.currentOdometerKm.toLocaleString()} km
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Horímetro Atual</span>
                  <div className="mt-1 font-mono font-bold text-slate-900">
                    {selectedVehicle.currentHourmeterHours > 0 ? `${selectedVehicle.currentHourmeterHours.toLocaleString()} h` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Especificações Técnicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500">Tipo de Equipamento</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{getTypeLabel(selectedVehicle.type)}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500">Combustível & Tanque</span>
                    <p className="font-semibold text-slate-800 mt-0.5 uppercase">
                      {selectedVehicle.fuelType.replace('_', ' ')} • {selectedVehicle.tankCapacityLiters}L
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500">Ano de Fabricação</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedVehicle.year}</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedVehicle.notes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Observações Operacionais
                  </h4>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700">
                    {selectedVehicle.notes}
                  </div>
                </div>
              )}

              {/* Direct Actions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Ações Rápidas do Veículo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {onNavigateToFuel && (
                    <button
                      onClick={() => {
                        onNavigateToFuel(selectedVehicle.id);
                        setSelectedVehicle(null);
                      }}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100 text-orange-800 text-xs font-bold transition"
                    >
                      <Fuel className="w-4 h-4 text-orange-600" />
                      Registrar Abastecimento
                    </button>
                  )}
                  {onNavigateToOS && (
                    <button
                      onClick={() => {
                        onNavigateToOS(selectedVehicle.id);
                        setSelectedVehicle(null);
                      }}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-800 text-xs font-bold transition"
                    >
                      <Wrench className="w-4 h-4 text-blue-600" />
                      Abrir Ordem de Serviço (OS)
                    </button>
                  )}
                  {onNavigateToHistory && (
                    <button
                      onClick={() => {
                        onNavigateToHistory(selectedVehicle.id);
                        setSelectedVehicle(null);
                      }}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition"
                    >
                      <History className="w-4 h-4 text-slate-600" />
                      Ver Histórico Completo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const target = selectedVehicle;
                  setSelectedVehicle(null);
                  handleOpenEdit(target);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Editar Veículo
              </button>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Vehicle Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-base">
                  {editingVehicle ? `Editar Veículo ${editingVehicle.fleetNumber}` : 'Cadastrar Novo Veículo na Frota'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  resetForm();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Prefixo / Número de Frota *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: COMP-05, BASC-02, PIPA-01"
                    value={formData.fleetNumber}
                    onChange={(e) => setFormData({ ...formData, fleetNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRA2E19 ou CPL-1947"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Veículo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                  >
                    <option value="compactador">Caminhão Compactador</option>
                    <option value="basculante">Caminhão Basculante</option>
                    <option value="pipa">Caminhão Pipa</option>
                    <option value="carroceria">Caminhão Carroceria</option>
                    <option value="apoio">Veículo de Apoio</option>
                    <option value="maquina">Máquina / Trator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Ex: Mercedes-Benz, Volkswagen"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Atego 1729 Compactor"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ano de Fabricação</label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Combustível</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as VehicleFuelType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white uppercase"
                  >
                    <option value="diesel_s10">Diesel S10</option>
                    <option value="diesel_s500">Diesel S500</option>
                    <option value="gasolina">Gasolina</option>
                    <option value="etanol">Etanol</option>
                    <option value="arla32">Arla 32</option>
                    <option value="eletrico">Elétrico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanque (Litros)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.tankCapacityLiters}
                    onChange={(e) => setFormData({ ...formData, tankCapacityLiters: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Odômetro Atual (km) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentOdometerKm}
                    onChange={(e) => setFormData({ ...formData, currentOdometerKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Horímetro Atual (Horas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentHourmeterHours}
                    onChange={(e) => setFormData({ ...formData, currentHourmeterHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sub-região Base</label>
                  <select
                    value={formData.subRegion}
                    onChange={(e) => setFormData({ ...formData, subRegion: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                  >
                    {regions.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Operacional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_operacao">Em Operação</option>
                    <option value="em_manutencao">Em Manutenção</option>
                    <option value="parado">Parado</option>
                    <option value="baixado">Baixado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data de Aquisição</label>
                  <input
                    type="date"
                    value={formData.acquisitionDate}
                    onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações Gerais</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais sobre prensa, implementos ou restrições de rota..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  {editingVehicle ? 'Atualizar Veículo' : 'Cadastrar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
