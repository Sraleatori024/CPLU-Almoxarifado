import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Boxes,
  X,
  Trash2,
  Printer,
  MapPin,
  Tag,
  FileText,
} from 'lucide-react';
import { dbService } from '../services/db';
import {
  Requisition,
  Material,
  Region,
  RequisitionStatus,
  RequisitionPriority,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  formatDateTimeBR,
  getRequisitionStatusBadge,
  getPriorityBadge,
} from '../utils/formatters';
import { NavigationTab } from '../components/layout/Sidebar';
import { PrintableRequisitionModal } from '../components/common/PrintableRequisitionModal';

interface RequisitionsPageProps {
  onNavigate: (tab: NavigationTab, targetCode?: string) => void;
  targetInitialWorkerId?: string;
}

export const RequisitionsPage: React.FC<RequisitionsPageProps> = ({
  onNavigate,
}) => {
  const { currentUser, role, canCreateRequisitions } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedPriority, setSelectedPriority] = useState<string>('todos');
  const [selectedRegion, setSelectedRegion] = useState<string>('todos');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectingReq, setInspectingReq] = useState<Requisition | null>(null);
  const [printingReq, setPrintingReq] = useState<Requisition | null>(null);

  // Stamped Number registration modal
  const [stampingReq, setStampingReq] = useState<Requisition | null>(null);
  const [stampedNumberInput, setStampedNumberInput] = useState('');
  const [stampError, setStampError] = useState<string | null>(null);
  const [stampSuccess, setStampSuccess] = useState<string | null>(null);

  // Form State for New Requisition
  const [formRegionName, setFormRegionName] = useState('Ipiranga');
  const [formPriority, setFormPriority] = useState<RequisitionPriority>('alta');
  const [formJustification, setFormJustification] = useState('');
  const [formObservations, setFormObservations] = useState('');
  const [formItems, setFormItems] = useState<{ materialId: string; quantity: number }[]>([
    { materialId: '', quantity: 1 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadData = () => {
    setRequisitions(dbService.getRequisitions());
    const mats = dbService.getMaterials().filter((m) => m.status === 'ativo');
    setMaterials(mats);
    const regs = dbService.getRegions().filter((r) => r.active);
    setRegions(regs);
    if (regs.length > 0 && !formRegionName) {
      setFormRegionName(regs[0].name);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    const defaultRegion = regions.find((r) => r.name.toLowerCase() === 'ipiranga')?.name || regions[0]?.name || 'Ipiranga';
    setFormRegionName(defaultRegion);
    setFormPriority('alta');
    setFormJustification('');
    setFormObservations('');
    // Default to first material or 005230 if available
    const initialMat = materials.find((m) => m.code === '005230') || materials[0];
    setFormItems([{ materialId: initialMat?.id || '', quantity: 1 }]);
    setFormError(null);
    setFormSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    setFormItems([...formItems, { materialId: materials[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: 'materialId' | 'quantity', val: any) => {
    const updated = [...formItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormItems(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    setFormSuccess(null);

    if (!formRegionName.trim()) {
      setFormError('Selecione a região solicitante obrigatória.');
      return;
    }

    if (!formJustification.trim() || formJustification.trim().length < 4) {
      setFormError('A justificativa operacional do TST é obrigatória.');
      return;
    }

    const validItems = formItems.filter((i) => i.materialId && i.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Adicione pelo menos um item válido com quantidade maior que zero.');
      return;
    }

    const res = dbService.createRequisition(
      {
        regionName: formRegionName.trim(),
        priority: formPriority,
        justification: formJustification.trim(),
        observations: formObservations.trim() || undefined,
        items: validItems.map((i) => ({
          materialId: i.materialId,
          quantityRequested: Number(i.quantity),
        })),
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        if (res.requisition) {
          setInspectingReq(res.requisition);
        }
      }, 800);
    }
  };

  const handleOpenStampModal = (req: Requisition) => {
    setStampingReq(req);
    setStampedNumberInput(req.stampedNumber || '');
    setStampError(null);
    setStampSuccess(null);
  };

  const handleSaveStamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !stampingReq) return;
    setStampError(null);
    setStampSuccess(null);

    const res = dbService.setRequisitionStampedNumber(
      stampingReq.id,
      stampedNumberInput,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (!res.success) {
      setStampError(res.message);
    } else {
      setStampSuccess(res.message);
      setTimeout(() => {
        setStampingReq(null);
      }, 700);
    }
  };

  // Filtered list
  const filteredRequisitions = requisitions.filter((req) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      req.number.toLowerCase().includes(q) ||
      (req.stampedNumber && req.stampedNumber.toLowerCase().includes(q)) ||
      req.regionName.toLowerCase().includes(q) ||
      req.requestedByName.toLowerCase().includes(q) ||
      req.items.some((i) => i.materialName.toLowerCase().includes(q) || i.materialCode.toLowerCase().includes(q));

    const matchesStatus = selectedStatus === 'todos' || req.status === selectedStatus;
    const matchesPriority = selectedPriority === 'todos' || req.priority === selectedPriority;
    const matchesRegion = selectedRegion === 'todos' || req.regionName.toLowerCase() === selectedRegion.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-orange-600" />
            Requisições Oficiais de Materiais & EPIs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Emissão por Região Operacional, acompanhamento de status em tempo real e controle de carimbo oficial
          </p>
        </div>

        {canCreateRequisitions && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Requisição (TST)
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nº da requisição, nº carimbado (ex: 19-47), região ou material..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Region filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium"
          >
            <option value="todos">Todas as Regiões</option>
            {regions.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todos os Status</option>
            <option value="enviada">Enviada ao Almoxarifado</option>
            <option value="pendente">Pendente de Atendimento</option>
            <option value="parcialmente_atendida">Parcialmente Atendida</option>
            <option value="atendida">Atendida Totalmente</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="critica">Crítica (Emergencial)</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Requisitions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Requisição / Nº Carimbado</th>
                <th className="py-3 px-4">Região Solicitante</th>
                <th className="py-3 px-4 text-center">Prioridade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Itens Solicitados</th>
                <th className="py-3 px-4">TST Responsável</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhuma requisição encontrada com os filtros selecionados.</p>
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => {
                  const statusInfo = getRequisitionStatusBadge(req.status);
                  const prioInfo = getPriorityBadge(req.priority);

                  const totalItemsCount = req.items.length;
                  const deliveredCount = req.items.filter((i) => i.status === 'entregue' || i.quantityDelivered >= i.quantityRequested).length;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-orange-700 text-sm">
                          {req.number}
                        </div>
                        {req.stampedNumber ? (
                          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded bg-orange-100 border border-orange-300 text-orange-800 text-[10px] font-mono font-black">
                            <Tag className="w-3 h-3 text-orange-600" />
                            Carimbo: {req.stampedNumber}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block mt-0.5">
                            Aguardando carimbo físico
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>{req.regionName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${prioInfo.color}`}>
                          {prioInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-semibold">
                          {deliveredCount} de {totalItemsCount} atendidos
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {req.items.map((i) => `${i.quantityRequested}x ${i.materialName}`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-semibold text-slate-900">{req.requestedByName}</div>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTimeBR(req.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print button */}
                          <button
                            onClick={() => setPrintingReq(req)}
                            title="Imprimir Requisição Oficial"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Stamped number button */}
                          <button
                            onClick={() => handleOpenStampModal(req)}
                            title="Registrar / Alterar Número Carimbado"
                            className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              req.stampedNumber
                                ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            <Tag className="w-4 h-4" />
                          </button>

                          {/* Inspect details button */}
                          <button
                            onClick={() => setInspectingReq(req)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT REQUISITION DRAWER/MODAL */}
      {inspectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400">
                  Requisição Oficial de Materiais
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg">{inspectingReq.number}</h3>
                  {inspectingReq.stampedNumber && (
                    <span className="font-mono text-xs bg-orange-600 px-2 py-0.5 rounded text-white font-bold">
                      Nº Carimbado: {inspectingReq.stampedNumber}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintingReq(inspectingReq)}
                  className="p-1.5 hover:bg-white/20 text-orange-400 rounded-lg transition"
                  title="Imprimir"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setInspectingReq(null)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Região Solicitante:</span>
                <span className="font-black text-slate-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  {inspectingReq.regionName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Prioridade / Status:</span>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(inspectingReq.priority).color}`}>
                    {inspectingReq.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRequisitionStatusBadge(inspectingReq.status).color}`}>
                    {inspectingReq.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">TST Responsável:</span>
                <span className="text-slate-800 font-semibold">
                  {inspectingReq.requestedByName} • {formatDateTimeBR(inspectingReq.createdAt)}
                </span>
              </div>
              {inspectingReq.justification && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Justificativa Operacional do TST:</span>
                  <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    "{inspectingReq.justification}"
                  </p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Itens Solicitados & Progresso
              </h4>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {inspectingReq.items.map((item) => {
                  const remaining = item.quantityRequested - item.quantityDelivered;
                  const mat = materials.find((m) => m.id === item.materialId || m.code === item.materialCode);
                  const loc = mat?.shelf || mat?.location || 'Almoxarifado Central';
                  return (
                    <div key={item.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">{item.materialName}</div>
                        <span className="font-mono text-xs text-orange-700 font-black">
                          Cód: {item.materialCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Local físico: <strong className="text-slate-700">{loc}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-600">
                          Solicitado: <strong>{item.quantityRequested} {item.unit}</strong>
                        </span>
                        <span className="text-slate-600">
                          Atendido: <strong className="text-emerald-700">{item.quantityDelivered} {item.unit}</strong>
                        </span>
                        <span className={`font-bold ${remaining > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          Pendente: {remaining} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer action */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setPrintingReq(inspectingReq)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Requisição
              </button>

              {(role === 'almoxarife' || role === 'administrador') &&
                (inspectingReq.status === 'pendente' || inspectingReq.status === 'enviada' || inspectingReq.status === 'parcialmente_atendida') && (
                  <button
                    onClick={() => {
                      onNavigate('fulfillment', inspectingReq.number);
                      setInspectingReq(null);
                    }}
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Separar no Almoxarifado
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE REQUISITION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base">Nova Requisição Oficial (TST)</h3>
                  <p className="text-[11px] text-orange-100">
                    Vínculo direto com Região Operacional para controle real de consumo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mandatory Requesting Region */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    Região Solicitante (Obrigatória) *
                  </label>
                  <select
                    value={formRegionName}
                    onChange={(e) => setFormRegionName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 font-bold bg-orange-50/30 text-slate-900"
                  >
                    {regions.map((reg) => (
                      <option key={reg.id} value={reg.name}>
                        {reg.name} ({reg.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade da Requisição *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as RequisitionPriority)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="critica">Crítica (Substituição Imediata / Emergencial)</option>
                    <option value="alta">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              {/* TST Solicitante Tag */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <span className="text-slate-600">
                  Técnico de Segurança Responsável: <strong className="text-slate-900">{currentUser?.name}</strong>
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {currentUser?.matricula || 'TST Homologado'}
                </span>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificativa Operacional do TST *
                </label>
                <textarea
                  value={formJustification}
                  onChange={(e) => setFormJustification(e.target.value)}
                  required
                  rows={2}
                  placeholder="Ex: Fornecimento de uniforme e EPIs para nova rota operacional na Regional..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itens e Materiais Solicitados
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Outro Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => {
                    const mat = materials.find((m) => m.id === item.materialId);
                    return (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <select
                              value={item.materialId}
                              onChange={(e) => handleItemChange(idx, 'materialId', e.target.value)}
                              required
                              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                            >
                              <option value="">Selecione o material / código IKKI...</option>
                              {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  [{m.code}] {m.name} (Disp: {m.currentStock} {m.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-24">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  'quantity',
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              required
                              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-center font-bold"
                            />
                          </div>

                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Remover linha"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {mat && (
                          <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                            <span>
                              Cód. Oficial IKKI: <strong className="font-mono text-slate-800">{mat.code}</strong> • Und: <strong className="text-slate-800">{mat.unit}</strong>
                            </span>
                            <span>
                              Localização: <strong className="text-slate-700">{mat.shelf || mat.location}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20 cursor-pointer"
                >
                  Salvar e Enviar ao Almoxarifado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAMPED NUMBER REGISTRATION MODAL */}
      {stampingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm">Registrar Número Oficial Carimbado</h3>
              </div>
              <button
                onClick={() => setStampingReq(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStamp} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div>Requisição: <strong className="font-mono text-slate-900">{stampingReq.number}</strong></div>
                <div>Região: <strong className="text-slate-900">{stampingReq.regionName}</strong></div>
                <div>TST: <span className="text-slate-700">{stampingReq.requestedByName}</span></div>
              </div>

              {stampError && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
                  {stampError}
                </div>
              )}
              {stampSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  {stampSuccess}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Número Carimbado no Papel Físico *
                </label>
                <input
                  type="text"
                  value={stampedNumberInput}
                  onChange={(e) => setStampedNumberInput(e.target.value)}
                  placeholder="Ex: 19-47, 05-120, 0042"
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-orange-700 tracking-wider"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Armazenado como texto para preservar hífens e zeros à esquerda. Deve ser único por requisição.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStampingReq(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
                >
                  Salvar Carimbo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE REQUISITION MODAL */}
      <PrintableRequisitionModal
        requisition={printingReq}
        onClose={() => setPrintingReq(null)}
      />
    </div>
  );
};
