import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Radio,
  Printer,
  Sparkles,
  Lock,
  X,
  PackageCheck,
  Bell,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Requisition, Material, EPIDelivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SignaturePad } from '../components/common/SignaturePad';
import { PrintableEPIReceipt } from '../components/common/PrintableEPIReceipt';
import {
  formatDateTimeBR,
  formatDateBR,
  getRequisitionStatusBadge,
  getPriorityBadge,
} from '../utils/formatters';

interface AlmoxarifadoDashboardPageProps {
  onNavigateToTechnician?: () => void;
  onNavigateToDirectExit?: () => void;
}

export const AlmoxarifadoDashboardPage: React.FC<AlmoxarifadoDashboardPageProps> = ({
  onNavigateToTechnician,
  onNavigateToDirectExit,
}) => {
  const { currentUser, role, canFulfillRequisitions } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ativas');

  // Fulfillment Drawer / Modal
  const [activeFulfillReq, setActiveFulfillReq] = useState<Requisition | null>(null);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [signatureData, setSignatureData] = useState('');
  const [observations, setObservations] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<EPIDelivery | null>(null);

  const loadData = () => {
    setRequisitions(dbService.getRequisitions());
    setMaterials(dbService.getMaterials());

    // If a requisition was open, keep it in sync
    if (activeFulfillReq) {
      const fresh = dbService.getRequisitionById(activeFulfillReq.id);
      if (fresh) setActiveFulfillReq(fresh);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  // When clicking on a requisition to open fulfillment
  const handleOpenFulfillment = (req: Requisition) => {
    // Mark as viewed to clear the 'new' indicator
    dbService.markRequisitionViewed(req.id);
    setActiveFulfillReq(req);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowCloseConfirm(false);

    // Default each item's quantity to deliver to the remaining needed (capped by stock)
    const initialQty: Record<string, number> = {};
    req.items.forEach((item) => {
      const remaining = item.quantityRequested - item.quantityDelivered;
      const mat = dbService.getMaterialById(item.materialId);
      const stock = mat ? mat.currentStock : 0;
      initialQty[item.id] = Math.max(0, Math.min(remaining, stock));
    });
    setDeliveredQuantities(initialQty);
    setSignatureData('');
    setObservations('');
  };

  const handleQuantityChange = (itemId: string, val: number, maxAllowed: number, stock: number) => {
    setErrorMsg(null);
    if (val > stock) {
      setErrorMsg(`Aviso: Estoque insuficiente! O saldo físico no almoxarifado é de ${stock} unidades. Não é permitido saldo negativo.`);
    } else if (val > maxAllowed) {
      setErrorMsg(`Aviso: A quantidade não pode exceder o saldo pendente solicitado (${maxAllowed}).`);
    }
    const valid = Math.max(0, Math.min(val, maxAllowed, stock));
    setDeliveredQuantities((prev) => ({
      ...prev,
      [itemId]: valid,
    }));
  };

  const isFormDirty = () => {
    if (successMsg) return false;
    const hasNonZero = Object.values(deliveredQuantities).some((q) => q > 0);
    const hasSig = !!signatureData;
    const hasObs = !!observations.trim();
    return hasNonZero || hasSig || hasObs;
  };

  const handleRequestClose = () => {
    if (isFormDirty()) {
      setShowCloseConfirm(true);
    } else {
      handleForceClose();
    }
  };

  const handleForceClose = () => {
    setShowCloseConfirm(false);
    setActiveFulfillReq(null);
    setDeliveredQuantities({});
    setSignatureData('');
    setObservations('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Confirm delivery
  const handleConfirmFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeFulfillReq) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!canFulfillRequisitions) {
      setErrorMsg('Acesso negado: Seu perfil atual não possui permissão para entregar materiais.');
      return;
    }

    const itemsToDeliver = Object.entries(deliveredQuantities)
      .map(([itemId, qty]) => ({ itemId, quantityToDeliver: qty }))
      .filter((i) => i.quantityToDeliver > 0);

    if (itemsToDeliver.length === 0) {
      setErrorMsg('Informe a quantidade a entregar para pelo menos um item da requisição.');
      return;
    }

    const res = dbService.fulfillRequisition(
      {
        requisitionId: activeFulfillReq.id,
        deliveredItems: itemsToDeliver,
        signatureDataUrl: signatureData || undefined,
        observations: observations.trim() || undefined,
      },
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      }
    );

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
      if (res.delivery) {
        setReceiptToPrint(res.delivery);
      }
      const updated = dbService.getRequisitionById(activeFulfillReq.id);
      setActiveFulfillReq(updated || null);
    }
  };

  // Filter requisitions
  const filteredRequisitions = requisitions.filter((req) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      req.number.toLowerCase().includes(q) ||
      req.employeeName.toLowerCase().includes(q) ||
      req.employeeMatricula.toLowerCase().includes(q) ||
      (req.requestedByName && req.requestedByName.toLowerCase().includes(q)) ||
      req.items.some((i) => i.materialName.toLowerCase().includes(q));

    let matchesFilter = true;
    if (selectedFilter === 'novas') {
      matchesFilter = req.isNewNotification || req.status === 'enviada';
    } else if (selectedFilter === 'ativas') {
      matchesFilter =
        req.status === 'enviada' ||
        req.status === 'pendente' ||
        req.status === 'parcialmente_atendida';
    } else if (selectedFilter !== 'todas') {
      matchesFilter = req.status === selectedFilter;
    }

    return matchesSearch && matchesFilter;
  });

  // Counters
  const newRequestsCount = requisitions.filter(
    (r) => r.isNewNotification || r.status === 'enviada'
  ).length;
  const pendingRequestsCount = requisitions.filter(
    (r) => r.status === 'pendente' || r.status === 'enviada'
  ).length;
  const partialRequestsCount = requisitions.filter(
    (r) => r.status === 'parcialmente_atendida'
  ).length;
  const fulfilledRequestsCount = requisitions.filter((r) => r.status === 'atendida').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-amber-300" />
              Recepção em Tempo Real Conectada
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-white" />
            Painel de Recepção & Atendimento do Almoxarifado
          </h1>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Recepção instantânea de requisições enviadas pelos Técnicos de Segurança, conferência de estoque, entrega física de EPIs e termo eletrônico NR-6.
          </p>
        </div>

        {/* Authenticated Almoxarife Identity Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3.5 shrink-0 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">
              Almoxarife Responsável
            </div>
            <div className="font-extrabold text-sm text-white">{currentUser?.name}</div>
            <div className="text-xs text-orange-100 font-mono">
              Matrícula: {currentUser?.matricula || 'ALM-102'} • Perfil: {currentUser?.role}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Counters & Live Notification Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setSelectedFilter('novas')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            selectedFilter === 'novas'
              ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/50'
              : 'bg-white border-slate-200 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-orange-600" />
              Novas Solicitações
            </span>
            {newRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-orange-600">{newRequestsCount}</div>
          <span className="text-[10px] text-orange-700 font-medium">requisições recém-enviadas pelo TST</span>
        </div>

        <div
          onClick={() => setSelectedFilter('pendente')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            selectedFilter === 'pendente'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/50'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
            Pendentes de Separação
          </span>
          <div className="text-2xl font-black text-amber-600">{pendingRequestsCount}</div>
          <span className="text-[10px] text-amber-700">aguardando atendimento no balcão</span>
        </div>

        <div
          onClick={() => setSelectedFilter('parcialmente_atendida')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            selectedFilter === 'parcialmente_atendida'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/50'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
            Parcialmente Atendidas
          </span>
          <div className="text-2xl font-black text-blue-600">{partialRequestsCount}</div>
          <span className="text-[10px] text-blue-700">com itens faltantes para entrega</span>
        </div>

        <div
          onClick={() => setSelectedFilter('atendida')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            selectedFilter === 'atendida'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/50'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Atendidas Totalmente
          </span>
          <div className="text-2xl font-black text-emerald-700">{fulfilledRequestsCount}</div>
          <span className="text-[10px] text-emerald-600">finalizadas com recibo NR-6</span>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número da requisição (REQ-2026-XXXX), nome do funcionário ou matrícula..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50 font-medium"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ativas', label: 'Todas Ativas' },
              { id: 'novas', label: 'Novas (Alertas)' },
              { id: 'pendente', label: 'Pendentes' },
              { id: 'parcialmente_atendida', label: 'Parciais' },
              { id: 'atendida', label: 'Atendidas' },
              { id: 'cancelada', label: 'Canceladas' },
              { id: 'todas', label: 'Todas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedFilter === tab.id
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* REQUISITIONS QUEUE TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">
              Fila de Requisições do Almoxarifado ({filteredRequisitions.length})
            </h3>
            {newRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                {newRequestsCount} NOVA(S)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToDirectExit && (
              <button
                onClick={onNavigateToDirectExit}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 shadow-2xs"
              >
                <Boxes className="w-3.5 h-3.5 text-orange-600" />
                Saída Avulsa Sem Requisição
              </button>
            )}
            {onNavigateToTechnician && (
              <button
                onClick={onNavigateToTechnician}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2 py-1"
              >
                Acessar Painel do TST <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Número da Requisição</th>
                <th className="py-3 px-4">Região</th>
                <th className="py-3 px-4">Técnico (TST)</th>
                <th className="py-3 px-4">Funcionário & Setor</th>
                <th className="py-3 px-4">Itens Solicitados / Faltantes</th>
                <th className="py-3 px-4 text-center">Prioridade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhuma requisição na fila com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => {
                  const statusInfo = getRequisitionStatusBadge(req.status);
                  const prioInfo = getPriorityBadge(req.priority);
                  const isNew = req.isNewNotification || req.status === 'enviada';

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-50 transition ${
                        isNew ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-orange-700 text-sm">
                            {req.number}
                          </span>
                          {isNew && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                              Novo
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {req.sentAt ? formatDateTimeBR(req.sentAt) : formatDateBR(req.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-[11px]">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          {req.regionName || 'Paulista'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.requestedByName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Mat: {req.requestedByMatricula || 'TST'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{req.employeeName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Mat: {req.employeeMatricula} • {req.sector}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium">
                          {req.items.map((i) => {
                            const remaining = i.quantityRequested - i.quantityDelivered;
                            return `${i.materialName} (${remaining > 0 ? `falta ${remaining}` : 'entregue'})`;
                          }).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prioInfo.color}`}>
                          {prioInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {(req.status === 'enviada' ||
                          req.status === 'pendente' ||
                          req.status === 'parcialmente_atendida') ? (
                          <button
                            onClick={() => handleOpenFulfillment(req)}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 ml-auto"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Atender
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenFulfillment(req)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold ml-auto"
                          >
                            Visualizar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULFILLMENT MODAL / DRAWER */}
      {activeFulfillReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-black text-orange-400">
                    {activeFulfillReq.number}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRequisitionStatusBadge(activeFulfillReq.status).color}`}>
                    {activeFulfillReq.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Emitida pelo TST {activeFulfillReq.requestedByName} ({activeFulfillReq.requestedByMatricula || 'TST'})
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition border border-white/20"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
            </div>

            <form onSubmit={handleConfirmFulfillment} className="p-6 space-y-5 text-xs">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                  {receiptToPrint && (
                    <button
                      type="button"
                      onClick={() => setReceiptToPrint(receiptToPrint)}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir Termo NR-6
                    </button>
                  )}
                </div>
              )}

              {/* Employee & Region Check Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Conferência de Identidade do Destinatário:
                  </span>
                  <span className="font-bold text-sm text-slate-900 block">
                    {activeFulfillReq.employeeName}
                  </span>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5 flex flex-wrap gap-2">
                    <span>Matrícula: {activeFulfillReq.employeeMatricula}</span>
                    <span>• Setor: {activeFulfillReq.sector}</span>
                    <span className="text-amber-800 font-bold bg-amber-100/70 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Região: {activeFulfillReq.regionName || 'Paulista'}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">ALMOXARIFE RESPONSÁVEL:</span>
                  <span className="font-bold text-slate-800">{currentUser?.name}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Pedido em: {formatDateTimeBR(activeFulfillReq.sentAt || activeFulfillReq.createdAt)}
                  </div>
                </div>
              </div>

              {/* Justification note */}
              {activeFulfillReq.justification && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                  <strong>Justificativa do TST:</strong> "{activeFulfillReq.justification}"
                </div>
              )}

              {/* Items Table for Fulfillment */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-orange-600" />
                  Conferência Física de Saldo & Quantidades a Entregar
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">EPI / Material</th>
                        <th className="py-2.5 px-3 text-center">Solicitado</th>
                        <th className="py-2.5 px-3 text-center">Entregue</th>
                        <th className="py-2.5 px-3 text-center">Restante</th>
                        <th className="py-2.5 px-3 text-center">Estoque Físico</th>
                        <th className="py-2.5 px-3 text-center">Entregar Agora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeFulfillReq.items.map((item) => {
                        const mat = materials.find((m) => m.id === item.materialId);
                        const stock = mat ? mat.currentStock : 0;
                        const remaining = item.quantityRequested - item.quantityDelivered;
                        const qtyNow = deliveredQuantities[item.id] || 0;
                        const isDone = item.quantityDelivered >= item.quantityRequested;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{item.materialName}</div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {item.materialCode} {item.caNumber ? `• CA: ${item.caNumber}` : ''}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {item.quantityRequested} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                              {item.quantityDelivered} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              <span className={remaining > 0 ? 'text-amber-700' : 'text-slate-400'}>
                                {remaining} {item.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  stock === 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : stock < remaining
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {stock} {item.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isDone ? (
                                <span className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Entregue
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.min(remaining, stock)}
                                  disabled={!canFulfillRequisitions || stock === 0}
                                  value={qtyNow}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.id,
                                      parseInt(e.target.value) || 0,
                                      remaining,
                                      stock
                                    )
                                  }
                                  className="w-20 px-2 py-1 text-center font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signature Pad */}
              <div>
                <SignaturePad
                  employeeName={activeFulfillReq.employeeName}
                  onSave={(dataUrl) => setSignatureData(dataUrl)}
                  onClear={() => setSignatureData('')}
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações do Almoxarife (Lote, Condição dos Equipamentos)
                </label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Entrega parcial por falta de tamanho em estoque ou lote certificado."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  A baixa de saldo é executada em transação atômica única no banco.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRequestClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                  >
                    Voltar ao Painel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !canFulfillRequisitions ||
                      activeFulfillReq.status === 'atendida' ||
                      activeFulfillReq.status === 'cancelada'
                    }
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-orange-600/20 transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Confirmar Entrega & Baixa de Saldo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM CLOSE WITH UNSAVED DATA MODAL */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center mb-2">
              Descartar alterações deste atendimento?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed">
              Existem quantidades ou dados digitados que ainda não foram confirmados. Se fechar agora, as informações preenchidas nesta tela serão descartadas.
              <br /><br />
              <strong className="text-slate-800">Nota de Segurança:</strong> Atendimentos e baixas de estoque que já foram confirmados anteriormente permanecem salvos no sistema e nunca serão cancelados ou apagados.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Continuar Atendimento
              </button>
              <button
                type="button"
                onClick={handleForceClose}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Sim, Fechar sem Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {receiptToPrint && (
        <PrintableEPIReceipt
          delivery={receiptToPrint}
          onClose={() => setReceiptToPrint(null)}
        />
      )}
    </div>
  );
};
