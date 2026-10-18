import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  FileEdit,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Boxes,
  Users,
  Search,
  Filter,
  X,
  Eye,
  Radio,
  FileText,
  BadgeAlert,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { dbService } from '../services/db';
import {
  Requisition,
  Material,
  Employee,
  RequisitionPriority,
  RequisitionStatus,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  formatDateTimeBR,
  formatDateBR,
  getRequisitionStatusBadge,
  getPriorityBadge,
} from '../utils/formatters';

interface TechnicianDashboardPageProps {
  onNavigateToAlmoxarifado?: () => void;
}

export const TechnicianDashboardPage: React.FC<TechnicianDashboardPageProps> = ({
  onNavigateToAlmoxarifado,
}) => {
  const { currentUser, role } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Search and status filter for the tracker
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // New Requisition Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [priority, setPriority] = useState<RequisitionPriority>('alta');
  const [justification, setJustification] = useState('');
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<{ materialId: string; quantity: number }[]>([
    { materialId: '', quantity: 1 },
  ]);

  // Action status feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal / Drawer inspect
  const [inspectingReq, setInspectingReq] = useState<Requisition | null>(null);
  const [cancelModalReq, setCancelModalReq] = useState<Requisition | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

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

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Add and remove items in requisition builder
  const handleAddItem = () => {
    setItems([...items, { materialId: materials[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: 'materialId' | 'quantity', val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  // Submit Requisition: Either as Draft or Immediate Send
  const handleSaveRequisition = (isDraft: boolean) => {
    if (!currentUser) return;
    setFormError(null);
    setFormSuccess(null);

    if (!selectedEmployeeId) {
      setFormError('Selecione o funcionário destinatário da equipe de limpeza urbana.');
      return;
    }

    if (!isDraft && (!justification.trim() || justification.trim().length < 5)) {
      setFormError('A justificativa técnica do TST é obrigatória para envio ao almoxarifado.');
      return;
    }

    const validItems = items.filter((i) => i.materialId && i.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Adicione pelo menos um EPI/Material com quantidade válida.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = dbService.createRequisition(
        {
          employeeId: selectedEmployeeId,
          priority,
          justification: justification.trim() || 'Rascunho de requisição técnica',
          observations: observations.trim() || undefined,
          isDraft,
          items: validItems.map((i) => ({
            materialId: i.materialId,
            quantityRequested: Number(i.quantity),
          })),
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          matricula: currentUser.matricula,
        }
      );

      if (!res.success) {
        setFormError(res.message);
      } else {
        setFormSuccess(res.message);
        // Reset form
        setSelectedEmployeeId('');
        setJustification('');
        setObservations('');
        setPriority('alta');
        setItems([{ materialId: materials[0]?.id || '', quantity: 1 }]);
        setTimeout(() => setFormSuccess(null), 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send a saved draft
  const handleSendDraft = (reqId: string) => {
    if (!currentUser) return;
    const res = dbService.sendDraftRequisition(reqId, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      matricula: currentUser.matricula,
    });
    alert(res.message);
  };

  // Cancel requisition
  const handleConfirmCancel = () => {
    if (!currentUser || !cancelModalReq) return;
    if (!cancellationReason.trim()) {
      alert('Informe o motivo do cancelamento.');
      return;
    }

    const res = dbService.cancelRequisition(cancelModalReq.id, cancellationReason, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    alert(res.message);
    setCancelModalReq(null);
    setCancellationReason('');
  };

  // Filter requisitions
  const filteredRequisitions = requisitions.filter((req) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      req.number.toLowerCase().includes(q) ||
      req.employeeName.toLowerCase().includes(q) ||
      req.employeeMatricula.toLowerCase().includes(q) ||
      req.sector.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'novas_enviadas' && (req.status === 'enviada' || req.status === 'pendente')) ||
      req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate my stats
  const draftsCount = requisitions.filter((r) => r.status === 'rascunho').length;
  const pendingCount = requisitions.filter((r) => r.status === 'enviada' || r.status === 'pendente').length;
  const partialCount = requisitions.filter((r) => r.status === 'parcialmente_atendida').length;
  const fulfilledCount = requisitions.filter((r) => r.status === 'atendida').length;

  return (
    <div className="space-y-6">
      {/* Top Header with Authenticated Tech Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              Conexão em Tempo Real Ativa com Almoxarifado
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Painel do Técnico de Segurança do Trabalho (TST)
          </h1>
          <p className="text-xs text-emerald-200 mt-1 max-w-xl">
            Emissão oficial de requisições de EPIs, controle de rascunhos e acompanhamento do atendimento pela equipe do almoxarifado em tempo real.
          </p>
        </div>

        {/* Authenticated Technician Identity Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3.5 shrink-0 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md">
            {currentUser?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
              Técnico(a) Autenticado(a)
            </div>
            <div className="font-extrabold text-sm text-white">{currentUser?.name}</div>
            <div className="text-xs text-emerald-100 font-mono flex items-center gap-2">
              <span>Matrícula: {currentUser?.matricula || 'TST-045'}</span>
              <span>• Perfil: {currentUser?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Rascunhos Salvos
          </span>
          <div className="text-2xl font-black text-slate-800">{draftsCount}</div>
          <span className="text-[10px] text-slate-500">não enviados ao almoxarifado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
            Enviadas / Aguardando
          </span>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          <span className="text-[10px] text-amber-700">na fila do almoxarifado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
            Atendimento Parcial
          </span>
          <div className="text-2xl font-black text-blue-600">{partialCount}</div>
          <span className="text-[10px] text-blue-700">itens entregues parcialmente</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Atendidas Totalmente
          </span>
          <div className="text-2xl font-black text-emerald-700">{fulfilledCount}</div>
          <span className="text-[10px] text-emerald-600">comprovantes NR-6 assinados</span>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE: LEFT (Form Builder), RIGHT (Live Tracker) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (5 cols): FORMULÁRIO DE REQUISIÇÃO */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-emerald-700" />
                Nova Requisição Digital de EPI
              </h2>
              <p className="text-xs text-slate-500">
                Identificação automática pelo usuário logado no sistema
              </p>
            </div>
            <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Sistema CPLU
            </span>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Responsible Tech (Immutable) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Técnico Responsável (Autenticado):
                </span>
                <span className="font-bold text-slate-900 text-xs">{currentUser?.name}</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                {currentUser?.matricula || 'TST-045'}
              </span>
            </div>

            {/* Employee Select */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Funcionário Destinatário da Operação *
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="">Selecione o colaborador...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.matricula} — {emp.name} ({emp.sector})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected employee info badge */}
            {selectedEmployee && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-emerald-950">
                  <span>{selectedEmployee.name}</span>
                  <span className="font-mono text-emerald-800">{selectedEmployee.matricula}</span>
                </div>
                <div className="text-[11px] text-emerald-800 flex justify-between">
                  <span>Setor: {selectedEmployee.sector}</span>
                  <span>Função: {selectedEmployee.role}</span>
                </div>
                <div className="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200 flex gap-2 font-mono font-medium">
                  <span>Bota: {selectedEmployee.shoeSize || '-'}</span>
                  <span>• Luva: {selectedEmployee.gloveSize || '-'}</span>
                  <span>• Uniforme: {selectedEmployee.uniformSize || '-'}</span>
                </div>
              </div>
            )}

            {/* Priority & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Prioridade *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="critica">Crítica (Substituição Imediata)</option>
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Data da Solicitação</label>
                <input
                  type="text"
                  disabled
                  value={new Date().toLocaleDateString('pt-BR')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 font-mono text-slate-600"
                />
              </div>
            </div>

            {/* Multi-Item Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  EPIs & Materiais Solicitados
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Item
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((it, idx) => {
                  const mat = materials.find((m) => m.id === it.materialId);
                  const isStockLow = mat && mat.currentStock <= mat.minStock;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={it.materialId}
                          onChange={(e) => handleItemChange(idx, 'materialId', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                        >
                          <option value="">Selecione o EPI...</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.code} — {m.name} (Disp: {m.currentStock} {m.unit})
                            </option>
                          ))}
                        </select>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'quantity',
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Real-time stock indicator */}
                      {mat && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                          <span>
                            CA: <strong>{mat.caNumber || 'N/A'}</strong> • Prateleira:{' '}
                            <strong>{mat.shelf}</strong>
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              mat.currentStock === 0
                                ? 'text-rose-600'
                                : isStockLow
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            Estoque disponível no almoxarifado: {mat.currentStock} {mat.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Justification */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Justificativa Técnica do TST *
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={2}
                placeholder="Ex: Troca periódica de luvas danificadas ou fornecimento para início em nova rota viária."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Observations */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Observações para a Equipe do Almoxarifado
              </label>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Instruções de entrega ou horário de liberação..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Two Action Buttons: Draft vs Real Send */}
            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSaveRequisition(true)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FileEdit className="w-4 h-4 text-slate-600" />
                Salvar Rascunho
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSaveRequisition(false)}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Enviar ao Almoxarifado
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): ACOMPANHAMENTO DE STATUS & REQUISIÇÕES */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Acompanhamento de Requisições & Status de Atendimento
              </h2>
              <p className="text-xs text-slate-500">
                Visualização conectada ao mesmo banco do almoxarifado em tempo real
              </p>
            </div>

            {onNavigateToAlmoxarifado && (
              <button
                onClick={onNavigateToAlmoxarifado}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                Ver Painel do Almoxarifado <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nº requisição, matrícula ou funcionário..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="rascunho">Rascunhos</option>
              <option value="novas_enviadas">Enviadas / Pendentes</option>
              <option value="parcialmente_atendida">Parcialmente Atendidas</option>
              <option value="atendida">Atendidas Totalmente</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {/* Requisitions List */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[620px] pr-1">
            {filteredRequisitions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Nenhuma requisição encontrada com os filtros selecionados.
              </div>
            ) : (
              filteredRequisitions.map((req) => {
                const statusInfo = getRequisitionStatusBadge(req.status);
                const prioInfo = getPriorityBadge(req.priority);
                const totalReq = req.items.reduce((s, i) => s + i.quantityRequested, 0);
                const totalDel = req.items.reduce((s, i) => s + i.quantityDelivered, 0);
                const progressPct = totalReq > 0 ? Math.round((totalDel / totalReq) * 100) : 0;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    {/* Item Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-orange-700">
                            {req.number}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prioInfo.color}`}>
                            {prioInfo.label}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1">
                          {req.employeeName}{' '}
                          <span className="font-mono text-slate-500 font-semibold">
                            ({req.employeeMatricula})
                          </span>
                          <span className="text-slate-500 font-normal"> • {req.sector}</span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        {req.sentAt ? (
                          <span>Enviado: {formatDateTimeBR(req.sentAt)}</span>
                        ) : (
                          <span>Criado: {formatDateBR(req.createdAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar of Delivered Items */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>
                          Itens: <strong>{totalDel} de {totalReq} entregues</strong> ({progressPct}%)
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {req.items.length} tipo(s) de item
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            req.status === 'atendida'
                              ? 'bg-emerald-600'
                              : req.status === 'parcialmente_atendida'
                              ? 'bg-blue-600'
                              : req.status === 'rascunho'
                              ? 'bg-slate-400'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Items chips */}
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {req.items.map((it) => (
                        <span
                          key={it.id}
                          className={`px-2 py-0.5 rounded font-medium border ${
                            it.status === 'entregue'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : it.status === 'parcial'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {it.materialName}: {it.quantityDelivered}/{it.quantityRequested} {it.unit}
                        </span>
                      ))}
                    </div>

                    {/* Actions on this item */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setInspectingReq(req)}
                        className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                      </button>

                      <div className="flex items-center gap-2">
                        {req.status === 'rascunho' && (
                          <button
                            onClick={() => handleSendDraft(req.id)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Enviar ao Almoxarifado
                          </button>
                        )}

                        {(req.status === 'rascunho' || req.status === 'enviada' || req.status === 'pendente') && (
                          <button
                            onClick={() => {
                              setCancelModalReq(req);
                              setCancellationReason('');
                            }}
                            className="text-rose-600 hover:text-rose-800 font-semibold text-xs"
                          >
                            Cancelar Solicitação
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* INSPECT REQUISITION MODAL */}
      {inspectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xl font-black text-orange-700">
                  {inspectingReq.number}
                </span>
                <div className="text-xs text-slate-500 mt-0.5">
                  Emitida por: {inspectingReq.requestedByName} (Matrícula: {inspectingReq.requestedByMatricula || 'N/A'})
                </div>
              </div>
              <button
                onClick={() => setInspectingReq(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div>
                <strong>Destinatário:</strong> {inspectingReq.employeeName} ({inspectingReq.employeeMatricula})
              </div>
              <div>
                <strong>Setor:</strong> {inspectingReq.sector}
              </div>
              <div>
                <strong>Justificativa do TST:</strong> "{inspectingReq.justification}"
              </div>
              {inspectingReq.observations && (
                <div>
                  <strong>Obs:</strong> {inspectingReq.observations}
                </div>
              )}
              {inspectingReq.cancellationReason && (
                <div className="text-rose-800 font-medium">
                  <strong>Motivo do Cancelamento:</strong> {inspectingReq.cancellationReason}
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Itens Solicitados:</h4>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {inspectingReq.items.map((it) => (
                  <div key={it.id} className="p-2.5 flex justify-between items-center bg-white">
                    <div>
                      <div className="font-semibold text-slate-900">{it.materialName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {it.materialCode} {it.caNumber ? `• CA: ${it.caNumber}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {it.quantityDelivered} de {it.quantityRequested} {it.unit}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700">
                        {it.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingReq(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">
                Cancelar Requisição {cancelModalReq.number}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Informe a justificativa técnica para cancelamento da solicitação de {cancelModalReq.employeeName}:
            </p>

            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              placeholder="Ex: Mudança de frente operacional ou solicitação duplicada pelo supervisor."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalReq(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
