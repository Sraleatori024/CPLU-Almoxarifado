import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  User,
  Boxes,
  X,
  Trash2,
  Send,
} from 'lucide-react';
import { dbService } from '../services/db';
import {
  Requisition,
  Material,
  Employee,
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

interface RequisitionsPageProps {
  onNavigate: (tab: NavigationTab, targetCode?: string) => void;
  targetInitialWorkerId?: string;
}

export const RequisitionsPage: React.FC<RequisitionsPageProps> = ({
  onNavigate,
  targetInitialWorkerId,
}) => {
  const { currentUser, role, canCreateRequisitions } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedPriority, setSelectedPriority] = useState<string>('todos');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectingReq, setInspectingReq] = useState<Requisition | null>(null);

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState(targetInitialWorkerId || '');
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
    setMaterials(dbService.getMaterials().filter((m) => m.status === 'ativo'));
    setEmployees(dbService.getEmployees().filter((e) => e.status === 'ativo'));
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (targetInitialWorkerId) {
      setFormEmployeeId(targetInitialWorkerId);
      setIsCreateModalOpen(true);
    }
  }, [targetInitialWorkerId]);

  const handleOpenCreate = () => {
    setFormEmployeeId(employees[0]?.id || '');
    setFormPriority('alta');
    setFormJustification('');
    setFormObservations('');
    setFormItems([{ materialId: materials[0]?.id || '', quantity: 1 }]);
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

    if (!formEmployeeId) {
      setFormError('Selecione o funcionário destinatário.');
      return;
    }

    if (!formJustification.trim() || formJustification.trim().length < 5) {
      setFormError('A justificativa técnica do TST é obrigatória.');
      return;
    }

    const validItems = formItems.filter((i) => i.materialId && i.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Adicione pelo menos um item com quantidade válida.');
      return;
    }

    const res = dbService.createRequisition(
      {
        employeeId: formEmployeeId,
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
      }, 900);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === formEmployeeId);

  // Filtered list
  const filteredRequisitions = requisitions.filter((req) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      req.number.toLowerCase().includes(q) ||
      req.employeeName.toLowerCase().includes(q) ||
      req.employeeMatricula.toLowerCase().includes(q) ||
      req.sector.toLowerCase().includes(q);

    const matchesStatus = selectedStatus === 'todos' || req.status === selectedStatus;
    const matchesPriority = selectedPriority === 'todos' || req.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-orange-600" />
            Requisições Digitais de EPI e Materiais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Emissão pelo Técnico de Segurança do Trabalho (TST) e acompanhamento de status
          </p>
        </div>

        {canCreateRequisitions && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Requisição Digital
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
            placeholder="Buscar por nº da requisição (REQ-2026-XXXX), funcionário ou matrícula..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente de Atendimento</option>
            <option value="parcialmente_atendida">Parcialmente Atendida</option>
            <option value="atendida">Atendida Totalmente</option>
            <option value="cancelada">Cancelada</option>
            <option value="rejeitada">Rejeitada</option>
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="critica">Crítica (Urgência Imediata)</option>
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
                <th className="py-3 px-4">Número da Requisição</th>
                <th className="py-3 px-4">Destinatário & Setor</th>
                <th className="py-3 px-4 text-center">Prioridade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Itens Solicitados / Entregues</th>
                <th className="py-3 px-4">Emitente / Data</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhuma requisição encontrada com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => {
                  const statusInfo = getRequisitionStatusBadge(req.status);
                  const prioInfo = getPriorityBadge(req.priority);

                  const totalItemsCount = req.items.length;
                  const deliveredCount = req.items.filter((i) => i.status === 'entregue').length;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-black text-orange-700 text-sm">
                        {req.number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{req.employeeName}</div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {req.employeeMatricula} • {req.sector}
                        </span>
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
                        <div className="text-slate-800 font-medium">
                          {deliveredCount} de {totalItemsCount} itens atendidos
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {req.items.map((i) => `${i.materialName} (${i.quantityRequested} ${i.unit})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{req.requestedByName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTimeBR(req.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingReq(req)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Detalhes
                          </button>
                          {(role === 'almoxarife' || role === 'administrador') &&
                            (req.status === 'pendente' || req.status === 'parcialmente_atendida') && (
                              <button
                                onClick={() => onNavigate('fulfillment', req.number)}
                                className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                              >
                                Atender <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
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

      {/* REQUISITION DETAILS DRAWER */}
      {inspectingReq && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setInspectingReq(null)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400">
                  Requisição Digital CPLU
                </span>
                <h3 className="font-black text-lg">{inspectingReq.number}</h3>
              </div>
              <button
                onClick={() => setInspectingReq(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Destinatário:</span>
                <span className="font-bold text-slate-900">
                  {inspectingReq.employeeName} ({inspectingReq.employeeMatricula})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Setor Operacional:</span>
                <span className="font-medium text-slate-800">{inspectingReq.sector}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Prioridade / Status:</span>
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
                <span className="text-slate-500">Emitido por:</span>
                <span className="text-slate-700">
                  {inspectingReq.requestedByName} em {formatDateTimeBR(inspectingReq.createdAt)}
                </span>
              </div>
              {inspectingReq.justification && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Justificativa do TST:</span>
                  <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                    "{inspectingReq.justification}"
                  </p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Itens Solicitados & Progresso de Entrega
              </h4>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {inspectingReq.items.map((item) => {
                  const remaining = item.quantityRequested - item.quantityDelivered;
                  return (
                    <div key={item.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">{item.materialName}</div>
                        <span className="font-mono text-[11px] text-orange-700 font-semibold">
                          {item.materialCode}
                        </span>
                      </div>
                      {item.caNumber && (
                        <span className="text-[10px] font-mono bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                          CA: {item.caNumber}
                        </span>
                      )}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-500">
                          Solicitado: <strong>{item.quantityRequested} {item.unit}</strong>
                        </span>
                        <span className="text-slate-500">
                          Entregue: <strong className="text-emerald-700">{item.quantityDelivered} {item.unit}</strong>
                        </span>
                        <span className={`font-bold ${remaining > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          Falta: {remaining} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer action */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              {(role === 'almoxarife' || role === 'administrador') &&
                (inspectingReq.status === 'pendente' || inspectingReq.status === 'parcialmente_atendida') && (
                  <button
                    onClick={() => {
                      onNavigate('fulfillment', inspectingReq.number);
                      setInspectingReq(null);
                    }}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
                  >
                    Atender no Balcão de EPIs Agora
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
                <h3 className="font-bold text-base">Nova Requisição Digital de EPIs (TST)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Funcionário Destinatário *
                  </label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-medium"
                  >
                    <option value="">Selecione o colaborador...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.matricula} - {emp.name} ({emp.sector})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade da Solicitação *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as RequisitionPriority)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="critica">Crítica (Substituição Imediata / Emergencial)</option>
                    <option value="alta">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              {selectedEmployee && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-slate-600">
                    Setor: <strong>{selectedEmployee.sector}</strong> • Função: <strong>{selectedEmployee.role}</strong>
                  </span>
                  <span className="font-mono text-slate-500">
                    Bota: {selectedEmployee.shoeSize || '-'} | Luva: {selectedEmployee.gloveSize || '-'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificativa Técnica do TST *
                </label>
                <textarea
                  value={formJustification}
                  onChange={(e) => setFormJustification(e.target.value)}
                  required
                  rows={2}
                  placeholder="Ex: Substituição periódica de luvas rasgadas durante a rota matutina de coleta ou admissão de novo agente."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itens e Equipamentos Solicitados
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
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
                        className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <div className="flex-1">
                          <select
                            value={item.materialId}
                            onChange={(e) => handleItemChange(idx, 'materialId', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                          >
                            <option value="">Selecione o material...</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.code} - {m.name} (Disp: {m.currentStock} {m.unit})
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
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                          />
                        </div>

                        <div className="w-12 text-center text-xs font-semibold text-slate-500">
                          {mat ? mat.unit : 'UN'}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={formItems.length === 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Complementares
                </label>
                <input
                  type="text"
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                  placeholder="Orientações de entrega para o almoxarife..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Emitir e Enviar Requisição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
