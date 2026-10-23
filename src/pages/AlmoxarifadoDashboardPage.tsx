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
  Radio,
  Printer,
  Sparkles,
  Lock,
  X,
  PackageCheck,
  Bell,
  RefreshCw,
  MapPin,
  Tag,
  QrCode,
  Camera,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Requisition, Material, EPIDelivery, RequisitionItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SignaturePad } from '../components/common/SignaturePad';
import { PrintableEPIReceipt } from '../components/common/PrintableEPIReceipt';
import { PrintableRequisitionModal } from '../components/common/PrintableRequisitionModal';
import { QRScannerModal } from '../components/common/QRScannerModal';
import { DecodedQRTarget } from '../utils/qr';
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

interface ItemQRVerification {
  status: 'IDLE' | 'MATCH' | 'MISMATCH';
  scannedCode?: string;
  scannedMaterial?: Material;
  errorMessage?: string;
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

  // QR Code Verification State per Requisition Item
  const [qrVerifications, setQrVerifications] = useState<Record<string, ItemQRVerification>>({});
  const [activeVerifyingItemId, setActiveVerifyingItemId] = useState<string | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [manualQrInput, setManualQrInput] = useState('');

  // Stamped Number registration modal
  const [stampingReq, setStampingReq] = useState<Requisition | null>(null);
  const [stampedNumberInput, setStampedNumberInput] = useState('');
  const [stampError, setStampError] = useState<string | null>(null);
  const [stampSuccess, setStampSuccess] = useState<string | null>(null);

  // Status message & Receipts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<EPIDelivery | null>(null);
  const [requisitionToPrint, setRequisitionToPrint] = useState<Requisition | null>(null);

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
    setQrVerifications({});
    setActiveVerifyingItemId(null);

    // Default each item's quantity to deliver to the remaining needed (capped by stock)
    const initialQty: Record<string, number> = {};
    req.items.forEach((item) => {
      const remaining = item.quantityRequested - item.quantityDelivered;
      const mat = dbService.getMaterialById(item.materialId) || dbService.getMaterialByCode(item.materialCode);
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

  // QR Code Verification Flow
  const handleStartQRScan = (itemId: string) => {
    setActiveVerifyingItemId(itemId);
    setManualQrInput('');
    setIsQrScannerOpen(true);
  };

  const handleProcessScannedCode = (scannedRaw: string) => {
    if (!activeFulfillReq || !activeVerifyingItemId) return;

    const targetItem = activeFulfillReq.items.find((i) => i.id === activeVerifyingItemId);
    if (!targetItem) return;

    const cleanCode = scannedRaw.trim();
    if (!cleanCode) return;

    // Search catalog for scanned material
    const allMaterials = dbService.getMaterials();
    const cleanUpper = cleanCode.toUpperCase();
    const foundMat = allMaterials.find(
      (m) =>
        m.code.toUpperCase() === cleanUpper ||
        (m.ikkiCode && m.ikkiCode.toUpperCase() === cleanUpper) ||
        m.id === cleanCode ||
        (m.code === '001420' && cleanUpper === 'EPI-LUV-01') ||
        (m.code === '001421' && cleanUpper === 'EPI-BOT-02') ||
        (m.code === '002105' && cleanUpper === 'EPI-COL-03') ||
        (m.code === '005230' && (cleanUpper.includes('005230') || cleanUpper.includes('CALCA')))
    );

    if (!foundMat) {
      setQrVerifications((prev) => ({
        ...prev,
        [activeVerifyingItemId]: {
          status: 'MISMATCH',
          scannedCode: cleanCode,
          errorMessage: `Código "${cleanCode}" não encontrado no catálogo oficial IKKI de materiais.`,
        },
      }));
      return;
    }

    // Compare scanned material against the requisition target item
    const isCodeMatch =
      foundMat.id === targetItem.materialId ||
      foundMat.code.toUpperCase() === targetItem.materialCode.toUpperCase() ||
      (foundMat.ikkiCode && foundMat.ikkiCode.toUpperCase() === targetItem.materialCode.toUpperCase());

    if (isCodeMatch) {
      // MATCH: Green confirmation!
      setQrVerifications((prev) => ({
        ...prev,
        [activeVerifyingItemId]: {
          status: 'MATCH',
          scannedCode: foundMat.code,
          scannedMaterial: foundMat,
        },
      }));
      // Auto-set quantity to remaining (capped by stock) if currently 0
      const remaining = targetItem.quantityRequested - targetItem.quantityDelivered;
      const currentQty = deliveredQuantities[targetItem.id] || 0;
      if (currentQty === 0) {
        setDeliveredQuantities((prev) => ({
          ...prev,
          [targetItem.id]: Math.max(0, Math.min(remaining, foundMat.currentStock)),
        }));
      }
    } else {
      // MISMATCH: Red Warning! Block mistaken confirmation
      setQrVerifications((prev) => ({
        ...prev,
        [activeVerifyingItemId]: {
          status: 'MISMATCH',
          scannedCode: foundMat.code,
          scannedMaterial: foundMat,
          errorMessage: `Divergência detectada! O código lido (${foundMat.code} - ${foundMat.name}) não confere com o item solicitado (${targetItem.materialCode} - ${targetItem.materialName}).`,
        },
      }));
      // Reset delivered quantity for this item to prevent mistaken dispatch
      setDeliveredQuantities((prev) => ({
        ...prev,
        [targetItem.id]: 0,
      }));
    }
  };

  const handleQrScanSuccess = (target: DecodedQRTarget) => {
    handleProcessScannedCode(target.code || target.raw);
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
    setQrVerifications({});
    setActiveVerifyingItemId(null);
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

    // Check if any item has a pending MISMATCH verification
    for (const [itemId, verif] of Object.entries(qrVerifications)) {
      if (verif.status === 'MISMATCH' && (deliveredQuantities[itemId] || 0) > 0) {
        setErrorMsg('Conferência bloqueada: Há itens com divergência de QR Code. Escaneie o material correto antes de confirmar a entrega.');
        return;
      }
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

  // Stamped number modal handlers
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
        if (activeFulfillReq && activeFulfillReq.id === stampingReq.id) {
          const fresh = dbService.getRequisitionById(stampingReq.id);
          if (fresh) setActiveFulfillReq(fresh);
        }
      }, 700);
    }
  };

  // Filter requisitions
  const filteredRequisitions = requisitions.filter((req) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      req.number.toLowerCase().includes(q) ||
      (req.stampedNumber && req.stampedNumber.toLowerCase().includes(q)) ||
      req.regionName.toLowerCase().includes(q) ||
      (req.requestedByName && req.requestedByName.toLowerCase().includes(q)) ||
      req.items.some((i) => i.materialName.toLowerCase().includes(q) || i.materialCode.toLowerCase().includes(q));

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
            Painel de Recepção & Separação do Almoxarifado
          </h1>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Recepção instantânea de requisições por Região Operacional, controle de carimbo oficial no papel, conferência por QR Code e baixa de estoque.
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

      {/* KPI Counters */}
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
              Novas Requisições
            </span>
            {newRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-orange-600">{newRequestsCount}</div>
          <span className="text-[10px] text-orange-700 font-medium">requisições recém-emitidas pelo TST</span>
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
          <span className="text-[10px] text-blue-700">com itens restantes para entrega</span>
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
          <span className="text-[10px] text-emerald-600">estoque baixado e finalizado</span>
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
              placeholder="Buscar por número da requisição, número carimbado (ex: 19-47), região (Ipiranga)..."
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
              { id: 'todas', label: 'Todas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
              Fila de Separação do Almoxarifado ({filteredRequisitions.length})
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
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
              >
                <Boxes className="w-3.5 h-3.5 text-orange-600" />
                Saída Avulsa
              </button>
            )}
            {onNavigateToTechnician && (
              <button
                onClick={onNavigateToTechnician}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2 py-1 cursor-pointer"
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
                <th className="py-3 px-4">Requisição / Nº Carimbado</th>
                <th className="py-3 px-4">Região Solicitante</th>
                <th className="py-3 px-4">Técnico (TST)</th>
                <th className="py-3 px-4">Itens Solicitados</th>
                <th className="py-3 px-4 text-center">Prioridade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {req.sentAt ? formatDateTimeBR(req.sentAt) : formatDateBR(req.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs">
                          <MapPin className="w-3.5 h-3.5 text-orange-600" />
                          {req.regionName || 'Ipiranga'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.requestedByName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {req.requestedByMatricula || 'TST Homologado'}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium">
                          {req.items.map((i) => {
                            const remaining = i.quantityRequested - i.quantityDelivered;
                            return `${i.quantityRequested}x ${i.materialName} (${remaining > 0 ? `falta ${remaining}` : 'atendido'})`;
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
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Requisition Button */}
                          <button
                            onClick={() => setRequisitionToPrint(req)}
                            title="Imprimir Requisição Oficial"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Stamped Number Button */}
                          <button
                            onClick={() => handleOpenStampModal(req)}
                            title="Registrar Número Carimbado Oficial (ex: 19-47)"
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              req.stampedNumber
                                ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            <Tag className="w-4 h-4" />
                          </button>

                          {/* Fulfillment Button */}
                          {(req.status === 'enviada' ||
                            req.status === 'pendente' ||
                            req.status === 'parcialmente_atendida') ? (
                            <button
                              onClick={() => handleOpenFulfillment(req)}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Separar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenFulfillment(req)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Ver
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

      {/* FULFILLMENT MODAL / DRAWER */}
      {activeFulfillReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95">
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
                  {activeFulfillReq.stampedNumber ? (
                    <span className="font-mono text-xs bg-orange-600 px-2 py-0.5 rounded text-white font-bold">
                      Nº Carimbado: {activeFulfillReq.stampedNumber}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenStampModal(activeFulfillReq)}
                      className="text-[10px] text-amber-300 underline hover:text-white"
                    >
                      + Registrar carimbo
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Região Solicitante: <strong className="text-white">{activeFulfillReq.regionName}</strong> • TST: {activeFulfillReq.requestedByName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRequisitionToPrint(activeFulfillReq)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition border border-white/20 cursor-pointer"
                  title="Imprimir Requisição"
                >
                  <Printer className="w-4 h-4 text-orange-400" />
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={handleRequestClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition border border-white/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmFulfillment} className="p-6 space-y-5 text-xs">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
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
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir Comprovante
                    </button>
                  )}
                </div>
              )}

              {/* Region & Responsibility Header Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Destino & Controle de Consumo Operacional:
                  </span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="font-black text-base text-slate-900">
                      Região {activeFulfillReq.regionName}
                    </span>
                  </div>
                  {activeFulfillReq.stampedNumber && (
                    <div className="text-orange-800 font-mono font-bold text-xs mt-1">
                      Número Oficial no Papel: {activeFulfillReq.stampedNumber}
                    </div>
                  )}
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">ALMOXARIFE RESPONSÁVEL:</span>
                  <span className="font-bold text-slate-800">{currentUser?.name}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Data: {formatDateTimeBR(activeFulfillReq.sentAt || activeFulfillReq.createdAt)}
                  </div>
                </div>
              </div>

              {/* Items Table for Fulfillment with Live QR Code Verification */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-orange-600" />
                    Conferência Física de Materiais & QR Code
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    A leitura por QR Code valida a separação física do item
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {activeFulfillReq.items.map((item) => {
                    const mat = materials.find((m) => m.id === item.materialId || m.code === item.materialCode);
                    const stock = mat ? mat.currentStock : 0;
                    const remaining = item.quantityRequested - item.quantityDelivered;
                    const qtyNow = deliveredQuantities[item.id] || 0;
                    const isDone = item.quantityDelivered >= item.quantityRequested;
                    const qrVerif = qrVerifications[item.id];

                    return (
                      <div key={item.id} className="p-3.5 bg-white space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900">{item.materialName}</span>
                              <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                                {item.materialCode}
                              </span>
                              {item.caNumber && (
                                <span className="text-[10px] font-mono text-slate-500">CA: {item.caNumber}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Localização física:{' '}
                              <strong className="text-slate-800">
                                {mat?.shelf || mat?.location || 'Almoxarifado Central'}
                              </strong>
                            </div>
                          </div>

                          {/* QR Code Scan Action & Status Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            {qrVerif?.status === 'MATCH' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Conferido por QR (MATCH)
                              </span>
                            )}
                            {qrVerif?.status === 'MISMATCH' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                Divergência QR (MISMATCH)
                              </span>
                            )}
                            {!isDone && (
                              <button
                                type="button"
                                onClick={() => handleStartQRScan(item.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                                  qrVerif?.status === 'MATCH'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : qrVerif?.status === 'MISMATCH'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                }`}
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                {qrVerif?.status === 'MATCH' ? 'Re-escanear' : 'Conferir QR Code'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* QR Code Verification Feedback Alert Banner */}
                        {qrVerif && qrVerif.status === 'MATCH' && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-[11px] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <strong>CORRESPONDÊNCIA CONFIRMADA (MATCH)!</strong> O material físico lido confere com o item solicitado ({targetItemSummary(qrVerif.scannedMaterial)}). Separação liberada.
                            </div>
                          </div>
                        )}

                        {qrVerif && qrVerif.status === 'MISMATCH' && (
                          <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-[11px] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <div>
                              <strong className="text-rose-700">DIVERGÊNCIA DETECTADA (MISMATCH)!</strong>{' '}
                              {qrVerif.errorMessage || 'O item escaneado não corresponde ao material da requisição. A entrega foi bloqueada para evitar expedição equivocada.'}
                            </div>
                          </div>
                        )}

                        {/* Quantities Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <div className="flex items-center gap-4 text-slate-600">
                            <span>Solicitado: <strong className="text-slate-900">{item.quantityRequested} {item.unit}</strong></span>
                            <span>Já Entregue: <strong className="text-emerald-700">{item.quantityDelivered} {item.unit}</strong></span>
                            <span>Pendente: <strong className="text-amber-700">{remaining} {item.unit}</strong></span>
                            <span>
                              Saldo em Estoque:{' '}
                              <strong className={stock < remaining ? 'text-rose-600 font-black' : 'text-slate-900'}>
                                {stock} {item.unit}
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">Entregar nesta saída:</span>
                            {isDone ? (
                              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Totalmente Atendido
                              </span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={Math.min(remaining, stock)}
                                disabled={!canFulfillRequisitions || stock === 0 || qrVerif?.status === 'MISMATCH'}
                                value={qtyNow}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.id,
                                    parseInt(e.target.value) || 0,
                                    remaining,
                                    stock
                                  )
                                }
                                className={`w-20 px-2 py-1 text-center font-mono font-bold border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                                  qrVerif?.status === 'MISMATCH'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700 cursor-not-allowed'
                                    : 'border-slate-300 bg-white'
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signature Pad */}
              <div>
                <SignaturePad
                  employeeName={activeFulfillReq.requestedByName || `Região ${activeFulfillReq.regionName}`}
                  onSave={(dataUrl) => setSignatureData(dataUrl)}
                  onClear={() => setSignatureData('')}
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações do Almoxarife (Lote, Inspeção Visual)
                </label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Material conferido por QR Code e entregue em perfeitas condições operacionais."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  A baixa de saldo é definitiva e debitada por localização física.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRequestClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Voltar ao Painel
                  </button>
                  <button
                    type="submit"
                    disabled={!canFulfillRequisitions}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition shadow-md shadow-orange-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PackageCheck className="w-4 h-4" />
                    Confirmar Entrega e Baixar Estoque
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR SCANNER & MANUAL CODE MODAL */}
      {isQrScannerOpen && activeFulfillReq && activeVerifyingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-sm">Conferência de QR Code do Material</h3>
                  <p className="text-[11px] text-slate-400">
                    Aproxime o código à câmera ou digite o código IKKI oficial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrScannerOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Target Item summary */}
              {(() => {
                const target = activeFulfillReq.items.find((i) => i.id === activeVerifyingItemId);
                if (!target) return null;
                const mat = materials.find((m) => m.id === target.materialId || m.code === target.materialCode);
                return (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-orange-800 tracking-wider">
                      Item Solicitado a Conferir:
                    </span>
                    <div className="font-black text-sm text-slate-900">{target.materialName}</div>
                    <div className="text-[11px] text-slate-700 flex items-center justify-between">
                      <span>Cód. IKKI: <strong className="font-mono text-orange-700">{target.materialCode}</strong></span>
                      <span>Qtd: <strong>{target.quantityRequested} {target.unit}</strong></span>
                      <span>Local: <strong>{mat?.shelf || 'Almoxarifado'}</strong></span>
                    </div>
                  </div>
                );
              })()}

              {/* Camera Scanner Component */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-center space-y-3">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                  <Camera className="w-4 h-4 text-orange-600" />
                  Leitor de Câmera Ativo
                </div>

                <QRScannerModal
                  isOpen={isQrScannerOpen}
                  onClose={() => setIsQrScannerOpen(false)}
                  onScanSuccess={handleQrScanSuccess}
                />
              </div>

              {/* Manual Code Input option for barcodes or physical codes */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">
                  Ou digite o Código IKKI do Material:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQrInput}
                    onChange={(e) => setManualQrInput(e.target.value)}
                    placeholder="Ex: 005230, 001420, EPI-LUV-01..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (manualQrInput.trim()) {
                        handleProcessScannedCode(manualQrInput.trim());
                        setIsQrScannerOpen(false);
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition cursor-pointer"
                  >
                    Validar
                  </button>
                </div>
              </div>
            </div>
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
                type="button"
                onClick={() => setStampingReq(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStamp} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div>Requisição: <strong className="font-mono text-slate-900">{stampingReq.number}</strong></div>
                <div>Região Solicitante: <strong className="text-slate-900">{stampingReq.regionName}</strong></div>
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
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Salvar Carimbo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT (NR-6) */}
      <PrintableEPIReceipt
        delivery={receiptToPrint}
        onClose={() => setReceiptToPrint(null)}
      />

      {/* PRINTABLE REQUISITION */}
      <PrintableRequisitionModal
        requisition={requisitionToPrint}
        onClose={() => setRequisitionToPrint(null)}
      />
    </div>
  );
};

function targetItemSummary(mat?: Material) {
  if (!mat) return '';
  return `${mat.code} - ${mat.name} (${mat.shelf || mat.location})`;
}
