import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  X,
  Truck,
  DollarSign,
  Package,
  Layers,
  ChevronRight,
  User,
  FileText,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { dbService } from '../services/db';
import {
  ServiceOrder,
  ServiceOrderStatus,
  ServiceOrderType,
  ServiceOrderPriority,
  Vehicle,
  Material,
  ServiceOrderPartItem,
} from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ServiceOrdersPageProps {
  initialVehicleId?: string;
}

export const ServiceOrdersPage: React.FC<ServiceOrdersPageProps> = ({ initialVehicleId }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mechanicalParts, setMechanicalParts] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>(initialVehicleId || 'all');

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<ServiceOrder | null>(null);
  const [selectedOrderForCompletion, setSelectedOrderForCompletion] = useState<ServiceOrder | null>(null);
  const [printableOrder, setPrintableOrder] = useState<ServiceOrder | null>(null);

  // New Order Form
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formType, setFormType] = useState<ServiceOrderType>('corretiva');
  const [formPriority, setFormPriority] = useState<ServiceOrderPriority>('normal');
  const [formDescription, setFormDescription] = useState('');
  const [formWorkshop, setFormWorkshop] = useState('Oficina Interna CPLU');
  const [formMechanicName, setFormMechanicName] = useState('');
  const [formOdometerKm, setFormOdometerKm] = useState<number | ''>('');
  const [formHourmeterHours, setFormHourmeterHours] = useState<number | ''>('');

  // Completion Form
  const [compDiagnosis, setCompDiagnosis] = useState('');
  const [compServicesRendered, setCompServicesRendered] = useState('');
  const [compLaborCost, setCompLaborCost] = useState<number | ''>(0);
  const [compExternalCost, setCompExternalCost] = useState<number | ''>(0);
  const [compDowntimeHours, setCompDowntimeHours] = useState<number | ''>(4);
  const [compMechanicName, setCompMechanicName] = useState('');
  const [compPartsUsed, setCompPartsUsed] = useState<ServiceOrderPartItem[]>([]);

  // Parts selector temporary state
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState<number | ''>(1);

  const loadData = () => {
    setOrders(dbService.getServiceOrders());
    const vehs = dbService.getVehicles();
    setVehicles(vehs);
    const mats = dbService.getMaterials().filter(
      (m) => m.category === 'Peças & Mecânica' || m.category === 'Manutenção'
    );
    setMechanicalParts(mats);

    if (!formVehicleId && vehs.length > 0) {
      setFormVehicleId(vehs[0].id);
      setFormOdometerKm(vehs[0].currentOdometerKm);
      setFormHourmeterHours(vehs[0].currentHourmeterHours || 0);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleVehicleSelect = (id: string) => {
    setFormVehicleId(id);
    const v = vehicles.find((item) => item.id === id);
    if (v) {
      setFormOdometerKm(v.currentOdometerKm);
      setFormHourmeterHours(v.currentHourmeterHours || 0);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === formVehicleId);
    if (!veh || !formDescription.trim()) return;

    dbService.createServiceOrder({
      vehicleId: veh.id,
      fleetNumber: veh.fleetNumber,
      plate: veh.plate,
      openedAt: new Date().toISOString(),
      type: formType,
      priority: formPriority,
      status: 'aberta',
      description: formDescription,
      odometerKm: Number(formOdometerKm) || veh.currentOdometerKm,
      hourmeterHours: Number(formHourmeterHours) || veh.currentHourmeterHours,
      partsUsed: [],
      laborCost: 0,
      externalCost: 0,
      totalCost: 0,
      mechanicName: formMechanicName.trim() || undefined,
      workshop: formWorkshop,
      createdByUserName: currentUser?.name || 'Administrador',
    });

    setIsNewOrderModalOpen(false);
    setFormDescription('');
  };

  const handleOpenCompletion = (order: ServiceOrder) => {
    setSelectedOrderForCompletion(order);
    setCompDiagnosis(order.diagnosis || '');
    setCompServicesRendered(order.servicesRendered || '');
    setCompLaborCost(order.laborCost || 0);
    setCompExternalCost(order.externalCost || 0);
    setCompDowntimeHours(order.downtimeHours || 4);
    setCompMechanicName(order.mechanicName || 'Oficina Mecânica CPLU');
    setCompPartsUsed([...order.partsUsed]);
  };

  const handleAddPartToCompletion = () => {
    if (!selectedPartId || !selectedPartQty || Number(selectedPartQty) <= 0) return;
    const partMat = mechanicalParts.find((m) => m.id === selectedPartId);
    if (!partMat) return;

    // Estimate realistic unit cost from items or default
    const unitPriceMap: Record<string, number> = {
      '008120': 28.5,
      '008121': 95.0,
      '008122': 145.0,
      '008123': 380.0,
      '008124': 1200.0,
      '008125': 1850.0,
      '008126': 42.0,
    };
    const unitCost = unitPriceMap[partMat.code] || 85.0;
    const qty = Number(selectedPartQty);

    const existingIndex = compPartsUsed.findIndex((p) => p.materialId === partMat.id);
    if (existingIndex !== -1) {
      const updated = [...compPartsUsed];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].totalCost = updated[existingIndex].quantity * unitCost;
      setCompPartsUsed(updated);
    } else {
      setCompPartsUsed([
        ...compPartsUsed,
        {
          materialId: partMat.id,
          code: partMat.code,
          name: partMat.name,
          quantity: qty,
          unitCost,
          totalCost: qty * unitCost,
        },
      ]);
    }

    setSelectedPartId('');
    setSelectedPartQty(1);
  };

  const handleRemovePartFromCompletion = (idx: number) => {
    const updated = [...compPartsUsed];
    updated.splice(idx, 1);
    setCompPartsUsed(updated);
  };

  const handleFinalizeCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForCompletion) return;

    dbService.completeServiceOrder(selectedOrderForCompletion.id, {
      diagnosis: compDiagnosis,
      servicesRendered: compServicesRendered,
      mechanicName: compMechanicName,
      laborCost: Number(compLaborCost) || 0,
      externalCost: Number(compExternalCost) || 0,
      downtimeHours: Number(compDowntimeHours) || 0,
      partsUsed: compPartsUsed,
      deductPartsFromStock: true, // Atomic deduction from materials stock
    });

    setSelectedOrderForCompletion(null);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesVehicle = selectedVehicleFilter === 'all' || o.vehicleId === selectedVehicleFilter;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesType = typeFilter === 'all' || o.type === typeFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.fleetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.mechanicName && o.mechanicName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesVehicle && matchesStatus && matchesType && matchesSearch;
  });

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'aberta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Aberta
          </span>
        );
      case 'em_diagnostico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Diagnóstico
          </span>
        );
      case 'aguardando_pecas':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            Aguardando Peças
          </span>
        );
      case 'em_execucao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Em Execução
          </span>
        );
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Concluída
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            Cancelada
          </span>
        );
    }
  };

  const getPriorityBadge = (p: ServiceOrderPriority) => {
    switch (p) {
      case 'critica':
        return <span className="text-xs font-bold text-rose-700 uppercase">Crítica</span>;
      case 'alta':
        return <span className="text-xs font-bold text-orange-700 uppercase">Alta</span>;
      case 'normal':
        return <span className="text-xs text-slate-600 font-medium uppercase">Normal</span>;
      case 'baixa':
        return <span className="text-xs text-slate-400 font-medium uppercase">Baixa</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ordens de Serviço (OS)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Abertura, diagnóstico mecânico, aplicação de peças com baixa no estoque e cálculo de custos.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Abrir Nova OS
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Ordens</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">OS Abertas / Oficina</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {orders.filter((o) => o.status !== 'concluida' && o.status !== 'cancelada').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">OS Concluídas</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {orders.filter((o) => o.status === 'concluida').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Custo Total em Peças/Serviços</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            R$ {orders.reduce((sum, o) => sum + o.totalCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por número, placa, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div>
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

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="aberta">Aberta</option>
            <option value="em_diagnostico">Em Diagnóstico</option>
            <option value="aguardando_pecas">Aguardando Peças</option>
            <option value="em_execucao">Em Execução</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          >
            <option value="all">Todos os Tipos</option>
            <option value="preventiva">Preventiva</option>
            <option value="corretiva">Corretiva</option>
            <option value="inspecao">Inspeção</option>
            <option value="emergencia">Emergência</option>
          </select>
        </div>
      </div>

      {/* OS Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Número da OS</th>
                <th className="py-3.5 px-4">Veículo</th>
                <th className="py-3.5 px-4">Tipo / Prioridade</th>
                <th className="py-3.5 px-4">Descrição do Problema / Serviço</th>
                <th className="py-3.5 px-4 text-right">Peças & Custo Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma Ordem de Serviço encontrada com os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((os) => (
                  <tr key={os.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-black text-slate-900 text-sm">{os.orderNumber}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(os.openedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{os.fleetNumber}</div>
                      <div className="text-xs text-slate-500 font-mono">{os.plate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold uppercase text-slate-800">{os.type}</div>
                      <div className="mt-0.5">{getPriorityBadge(os.priority)}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-800 text-xs">{os.description}</p>
                      {os.mechanicName && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Mecânico: {os.mechanicName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">
                        R$ {os.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {os.partsUsed.length} peça(s) aplicada(s)
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(os.status)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {os.status !== 'concluida' && os.status !== 'cancelada' && (
                          <button
                            onClick={() => handleOpenCompletion(os)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Finalizar OS
                          </button>
                        )}
                        <button
                          onClick={() => setPrintableOrder(os)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                          title="Imprimir Ordem de Serviço"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* Completion Modal with Parts Deduction */}
      {selectedOrderForCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  Finalizar Ordem de Serviço: {selectedOrderForCompletion.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForCompletion(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeCompletion} className="p-6 overflow-y-auto space-y-5 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {selectedOrderForCompletion.fleetNumber} ({selectedOrderForCompletion.plate})
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedOrderForCompletion.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Odômetro:</span>
                  <div className="font-mono font-bold text-slate-900">
                    {selectedOrderForCompletion.odometerKm.toLocaleString()} km
                  </div>
                </div>
              </div>

              {/* Diagnosis & Services Rendered */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Diagnóstico Técnico do Mecânico *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Diagnóstico conclusivo do defeito ou inspeção preventiva..."
                    value={compDiagnosis}
                    onChange={(e) => setCompDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Serviços Mecânicos Executados *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Descrição detalhada das reparações e regulagens realizadas..."
                    value={compServicesRendered}
                    onChange={(e) => setCompServicesRendered(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Parts Selection from Stock with Atomic Deduction */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-orange-600" />
                    Peças & Lubrificantes Utilizados (Baixa Automática no Almoxarifado)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">Selecione uma peça do catálogo de mecânica...</option>
                    {mechanicalParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name} (Saldo Atual: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={selectedPartQty}
                      onChange={(e) => setSelectedPartQty(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />

                    <button
                      type="button"
                      onClick={handleAddPartToCompletion}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 transition"
                    >
                      Adicionar Peça
                    </button>
                  </div>
                </div>

                {/* Parts Table */}
                {compPartsUsed.length > 0 && (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mt-2">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Código IKKI</th>
                          <th className="py-2 px-3">Descrição da Peça</th>
                          <th className="py-2 px-3 text-right">Qtd</th>
                          <th className="py-2 px-3 text-right">Valor Unit.</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                          <th className="py-2 px-3 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {compPartsUsed.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-bold text-slate-900">{p.code}</td>
                            <td className="py-2 px-3 font-sans text-slate-800">{p.name}</td>
                            <td className="py-2 px-3 text-right font-bold">{p.quantity}</td>
                            <td className="py-2 px-3 text-right">R$ {p.unitCost.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              R$ {p.totalCost.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePartFromCompletion(idx)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <X className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Labor, External Costs & Downtime */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mão de Obra (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={compLaborCost}
                    onChange={(e) => setCompLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Serviço Externo / Torno (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={compExternalCost}
                    onChange={(e) => setCompExternalCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Horas Parado (Downtime)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={compDowntimeHours}
                    onChange={(e) => setCompDowntimeHours(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mecânico Responsável
                  </label>
                  <input
                    type="text"
                    required
                    value={compMechanicName}
                    onChange={(e) => setCompMechanicName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Total Calculation Summary */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-800">Custo Total da OS</span>
                  <p className="text-[11px] text-emerald-600">Peças + Mão de Obra + Serviços Terceirizados</p>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-900">
                  R${' '}
                  {(
                    compPartsUsed.reduce((sum, p) => sum + p.totalCost, 0) +
                    (Number(compLaborCost) || 0) +
                    (Number(compExternalCost) || 0)
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForCompletion(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  Confirmar Baixa e Liberar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New OS Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-base">Abertura de Ordem de Serviço</h3>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Veículo da Frota *</label>
                <select
                  required
                  value={formVehicleId}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.fleetNumber} ({v.plate}) — {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tipo de Manutenção</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ServiceOrderType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="corretiva">Corretiva</option>
                    <option value="preventiva">Preventiva</option>
                    <option value="inspecao">Inspeção</option>
                    <option value="emergencia">Emergência</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Prioridade</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as ServiceOrderPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica (Veículo Parado)</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Odômetro Atual (km)</label>
                  <input
                    type="number"
                    value={formOdometerKm}
                    onChange={(e) => setFormOdometerKm(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Horímetro Atual (h)</label>
                  <input
                    type="number"
                    value={formHourmeterHours}
                    onChange={(e) => setFormHourmeterHours(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Sintomas e Descrição do Serviço *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o defeito apresentado, vazamento, ruído anormal ou serviço preventivo solicitado..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Oficina</label>
                  <input
                    type="text"
                    value={formWorkshop}
                    onChange={(e) => setFormWorkshop(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Mecânico Atribuído</label>
                  <input
                    type="text"
                    placeholder="Nome do mecânico"
                    value={formMechanicName}
                    onChange={(e) => setFormMechanicName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Abrir Ordem de Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable OS Modal */}
      {printableOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="font-bold text-sm">Visualização de Impressão — {printableOrder.orderNumber}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
                <button
                  onClick={() => setPrintableOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 text-xs">
              {/* Header CPLU */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black tracking-tight">CPL LOG — LIMPEZA URBANA</h2>
                  <p className="text-slate-600 font-semibold">ORDEM DE SERVIÇO MECÂNICA & FROTA</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-black border border-slate-900 px-3 py-1 rounded">
                    {printableOrder.orderNumber}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Data: {new Date(printableOrder.openedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Vehicle & Specs */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Prefixo</span>
                  <span className="font-mono font-black text-sm">{printableOrder.fleetNumber}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Placa</span>
                  <span className="font-mono font-bold text-sm">{printableOrder.plate}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Odômetro</span>
                  <span className="font-mono font-bold">{printableOrder.odometerKm.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Horímetro</span>
                  <span className="font-mono">{printableOrder.hourmeterHours || 0} h</span>
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <span className="font-bold uppercase text-slate-600 block mb-1">Motivo / Sintomas</span>
                <div className="p-3 border border-slate-300 rounded min-h-[50px]">
                  {printableOrder.description}
                </div>
              </div>

              {/* Diagnosis & Services */}
              <div>
                <span className="font-bold uppercase text-slate-600 block mb-1">Diagnóstico & Serviços Executados</span>
                <div className="p-3 border border-slate-300 rounded min-h-[60px]">
                  <p className="font-semibold">{printableOrder.diagnosis || 'Pendente de preenchimento pela oficina'}</p>
                  <p className="text-slate-600 mt-1">{printableOrder.servicesRendered}</p>
                </div>
              </div>

              {/* Parts */}
              <div>
                <span className="font-bold uppercase text-slate-600 block mb-1">Peças Aplicadas</span>
                <table className="w-full border border-slate-300 text-left">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                    <tr>
                      <th className="p-2">Código</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2 text-right">Qtd</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printableOrder.partsUsed.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-slate-400">
                          Nenhuma peça aplicada registrada
                        </td>
                      </tr>
                    ) : (
                      printableOrder.partsUsed.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono">{p.code}</td>
                          <td className="p-2">{p.name}</td>
                          <td className="p-2 text-right font-mono">{p.quantity}</td>
                          <td className="p-2 text-right font-mono">R$ {p.totalCost.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-slate-700">
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold">{printableOrder.mechanicName || 'Mecânico Responsável'}</p>
                  <span className="text-[10px] text-slate-400">Oficina Mecânica CPLU</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold">Coordenação de Transporte / Frota</p>
                  <span className="text-[10px] text-slate-400">Liberado para Operação</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
