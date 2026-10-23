import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Search,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Boxes,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  QrCode,
  Camera,
  MapPin,
  Tag,
  X,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Requisition, Material, EPIDelivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SignaturePad } from '../components/common/SignaturePad';
import { PrintableEPIReceipt } from '../components/common/PrintableEPIReceipt';
import { PrintableRequisitionModal } from '../components/common/PrintableRequisitionModal';
import { QRScannerModal } from '../components/common/QRScannerModal';
import { DecodedQRTarget } from '../utils/qr';
import {
  formatDateTimeBR,
  getRequisitionStatusBadge,
  getPriorityBadge,
} from '../utils/formatters';

interface FulfillRequisitionPageProps {
  initialSearchReqNumber?: string;
}

interface ItemQRVerification {
  status: 'IDLE' | 'MATCH' | 'MISMATCH';
  scannedCode?: string;
  scannedMaterial?: Material;
  errorMessage?: string;
}

export const FulfillRequisitionPage: React.FC<FulfillRequisitionPageProps> = ({
  initialSearchReqNumber,
}) => {
  const { currentUser, role, canFulfillRequisitions } = useAuth();
  const [search, setSearch] = useState(initialSearchReqNumber || '');
  const [activeReq, setActiveReq] = useState<Requisition | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Item quantities to deliver
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [signatureData, setSignatureData] = useState<string>('');
  const [observations, setObservations] = useState('');

  // QR Code Verification State per Requisition Item
  const [qrVerifications, setQrVerifications] = useState<Record<string, ItemQRVerification>>({});
  const [activeVerifyingItemId, setActiveVerifyingItemId] = useState<string | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [manualQrInput, setManualQrInput] = useState('');

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<EPIDelivery | null>(null);
  const [requisitionToPrint, setRequisitionToPrint] = useState<Requisition | null>(null);

  const loadData = () => {
    setMaterials(dbService.getMaterials());
    if (activeReq) {
      const refreshed = dbService.getRequisitionById(activeReq.id);
      if (refreshed) setActiveReq(refreshed);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSearchReqNumber) {
      handleSearch(initialSearchReqNumber);
    }
  }, [initialSearchReqNumber]);

  const handleSearch = (term?: string) => {
    const q = (term || search).trim().toUpperCase();
    if (!q) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setQrVerifications({});
    setActiveVerifyingItemId(null);

    // Search by requisition number
    let req = dbService.getRequisitionByNumber(q);

    // If not found, search by stamped number (ex: "19-47")
    if (!req) {
      const all = dbService.getRequisitions();
      req = all.find(
        (r) =>
          r.stampedNumber &&
          r.stampedNumber.trim().toUpperCase() === q
      );
    }

    // If not found, search by requesting region in active requisitions
    if (!req) {
      const all = dbService.getRequisitions();
      req = all.find(
        (r) =>
          r.regionName.toUpperCase().includes(q) &&
          (r.status === 'pendente' || r.status === 'enviada' || r.status === 'parcialmente_atendida')
      );
    }

    // Fallback: search by employee matricula for historical records
    if (!req) {
      const all = dbService.getRequisitions();
      req = all.find(
        (r) =>
          r.employeeMatricula &&
          r.employeeMatricula.toUpperCase() === q &&
          (r.status === 'pendente' || r.status === 'parcialmente_atendida')
      );
    }

    if (!req) {
      setErrorMsg(`Nenhuma requisição localizada para "${q}".`);
      setActiveReq(null);
      return;
    }

    setActiveReq(req);

    // Initialize quantities to remaining needed
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
    const validVal = Math.max(0, Math.min(val, maxAllowed, stock));
    setDeliveredQuantities((prev) => ({
      ...prev,
      [itemId]: validVal,
    }));
  };

  // QR Code Verification Flow
  const handleStartQRScan = (itemId: string) => {
    setActiveVerifyingItemId(itemId);
    setManualQrInput('');
    setIsQrScannerOpen(true);
  };

  const handleProcessScannedCode = (scannedRaw: string) => {
    if (!activeReq || !activeVerifyingItemId) return;

    const targetItem = activeReq.items.find((i) => i.id === activeVerifyingItemId);
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
          errorMessage: `Código "${cleanCode}" não localizado no catálogo oficial IKKI de materiais.`,
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
          errorMessage: `Divergência detectada! O material lido (${foundMat.code} - ${foundMat.name}) NÃO CORRESPONDE ao item solicitado (${targetItem.materialCode} - ${targetItem.materialName}). Separação bloqueada.`,
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

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeReq) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!canFulfillRequisitions) {
      setErrorMsg('Acesso negado: Seu perfil atual não possui permissão para efetuar entregas de materiais.');
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
      setErrorMsg('Selecione pelo menos um item com quantidade maior que zero para entregar.');
      return;
    }

    const res = dbService.fulfillRequisition(
      {
        requisitionId: activeReq.id,
        deliveredItems: itemsToDeliver,
        signatureDataUrl: signatureData || undefined,
        observations: observations.trim() || undefined,
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
      if (res.delivery) {
        setReceiptToPrint(res.delivery);
      }
      // Refresh active requisition
      const updated = dbService.getRequisitionById(activeReq.id);
      setActiveReq(updated || null);
    }
  };

  // Pending queue of requisitions awaiting warehouse action
  const pendingQueue = dbService
    .getRequisitions()
    .filter((r) => r.status === 'pendente' || r.status === 'enviada' || r.status === 'parcialmente_atendida');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-orange-600" />
            Balcão de Separação & Atendimento de Requisições
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conferência por QR Code, validação de número carimbado e baixa atômica de estoque por localização física
          </p>
        </div>

        {!canFulfillRequisitions && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-600" />
            Visualização somente leitura (Perfil sem permissão de entrega)
          </div>
        )}
      </div>

      {/* SEARCH / LOOKUP SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Localizar Requisição por Número Oficial, Número Carimbado ou Região:
          </label>
          <div className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: REQ-2026-0001, 19-47, Ipiranga..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Quick Pending Queue Buttons */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Fila de Espera no Almoxarifado ({pendingQueue.length} aguardando):
          </span>
          <div className="flex flex-wrap gap-2">
            {pendingQueue.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Nenhuma requisição pendente no momento.</span>
            ) : (
              pendingQueue.map((req) => (
                <button
                  key={req.id}
                  onClick={() => {
                    setSearch(req.number);
                    handleSearch(req.number);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                    activeReq?.id === req.id
                      ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-orange-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="font-mono font-bold">{req.number}</span>
                  <span className="font-semibold text-slate-700">[{req.regionName}]</span>
                  {req.stampedNumber && (
                    <span className="font-mono text-[10px] bg-white/20 px-1 py-0.2 rounded font-black">
                      #{req.stampedNumber}
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      req.priority === 'critica'
                        ? 'bg-rose-500 text-white'
                        : req.priority === 'alta'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {req.priority.toUpperCase()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-xs flex items-center gap-3 font-semibold animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs flex items-center justify-between gap-3 font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {receiptToPrint && (
            <button
              onClick={() => setReceiptToPrint(receiptToPrint)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Comprovante
            </button>
          )}
        </div>
      )}

      {/* ACTIVE FULFILLMENT FORM */}
      {activeReq && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header of Active Requisition */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black text-orange-400">
                  {activeReq.number}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(activeReq.priority).color}`}>
                  PRIORIDADE {activeReq.priority.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRequisitionStatusBadge(activeReq.status).color}`}>
                  {activeReq.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Emitida por {activeReq.requestedByName} em {formatDateTimeBR(activeReq.createdAt)}
              </p>
            </div>

            {/* Region & Stamped Badge */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Região {activeReq.regionName}</div>
                <div className="text-xs text-amber-300 font-mono font-bold">
                  {activeReq.stampedNumber ? `Nº Carimbado: ${activeReq.stampedNumber}` : 'Sem número carimbado'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequisitionToPrint(activeReq)}
                className="ml-2 p-2 bg-white/10 hover:bg-white/20 text-orange-400 rounded-lg transition cursor-pointer"
                title="Imprimir Requisição"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleConfirmDelivery} className="p-6 space-y-6">
            {/* Justification note */}
            {activeReq.justification && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Justificativa da Segurança do Trabalho:</strong> "{activeReq.justification}"
              </div>
            )}

            {/* ITEMS FULFILLMENT TABLE */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-orange-600" />
                Conferência e Separação Física dos Itens (com QR Code)
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {activeReq.items.map((item) => {
                  const mat = materials.find((m) => m.id === item.materialId || m.code === item.materialCode);
                  const currentStock = mat ? mat.currentStock : 0;
                  const remaining = item.quantityRequested - item.quantityDelivered;
                  const deliverNow = deliveredQuantities[item.id] || 0;
                  const isComplete = item.quantityDelivered >= item.quantityRequested;
                  const qrVerif = qrVerifications[item.id];

                  return (
                    <div key={item.id} className="p-3.5 bg-white space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {item.materialName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-mono text-orange-700 font-bold">
                              Cód. IKKI: {item.materialCode}
                            </span>
                            {item.caNumber && (
                              <span className="bg-orange-50 text-orange-800 font-mono px-1 rounded">
                                CA: {item.caNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            Localização física:{' '}
                            <strong className="text-slate-800">{mat?.shelf || mat?.location || 'Almoxarifado Central'}</strong>
                          </div>
                        </div>

                        {/* QR Code Action & Badges */}
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
                          {!isComplete && (
                            <button
                              type="button"
                              onClick={() => handleStartQRScan(item.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-300 transition cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5 text-orange-600" />
                              Conferir QR Code
                            </button>
                          )}
                        </div>
                      </div>

                      {/* QR Alert Banner */}
                      {qrVerif && qrVerif.status === 'MATCH' && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-[11px] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <strong>CORRESPONDÊNCIA CONFIRMADA (MATCH)!</strong> O item escaneado ({qrVerif.scannedMaterial?.code} - {qrVerif.scannedMaterial?.name}) confere com a requisição.
                          </div>
                        </div>
                      )}

                      {qrVerif && qrVerif.status === 'MISMATCH' && (
                        <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <div>
                            <strong className="text-rose-700">DIVERGÊNCIA DETECTADA (MISMATCH)!</strong>{' '}
                            {qrVerif.errorMessage || 'O item escaneado não confere com o material solicitado. Confirmação bloqueada.'}
                          </div>
                        </div>
                      )}

                      {/* Quantities Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-4 text-slate-600">
                          <span>Solicitado: <strong className="text-slate-900">{item.quantityRequested} {item.unit}</strong></span>
                          <span>Entregue: <strong className="text-emerald-700">{item.quantityDelivered} {item.unit}</strong></span>
                          <span>Falta: <strong className="text-amber-700">{remaining} {item.unit}</strong></span>
                          <span>Estoque: <strong className="text-slate-900">{currentStock} {item.unit}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Qtd. a entregar:</span>
                          {isComplete ? (
                            <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Entregue
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max={Math.min(remaining, currentStock)}
                              disabled={!canFulfillRequisitions || currentStock === 0 || qrVerif?.status === 'MISMATCH'}
                              value={deliverNow}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  parseInt(e.target.value) || 0,
                                  remaining,
                                  currentStock
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

            {/* SIGNATURE PAD */}
            <div className="pt-2">
              <SignaturePad
                employeeName={activeReq.requestedByName || `Região ${activeReq.regionName}`}
                onSave={(dataUrl) => setSignatureData(dataUrl)}
                onClear={() => setSignatureData('')}
              />
            </div>

            {/* Observations */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações do Almoxarife (Lote, Validade, Condições)
              </label>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Entrega realizada em balcão para a Região. Material conferido por QR Code."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                O saldo físico será debitado de forma atômica no momento da confirmação.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReq(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={!canFulfillRequisitions}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirmar Entrega & Baixar Estoque
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* QR SCANNER & MANUAL CODE MODAL */}
      {isQrScannerOpen && activeReq && activeVerifyingItemId && (
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
                const target = activeReq.items.find((i) => i.id === activeVerifyingItemId);
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

              {/* Manual Code Input */}
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

      {/* PRINTABLE RECEIPT MODAL */}
      {receiptToPrint && (
        <PrintableEPIReceipt
          delivery={receiptToPrint}
          onClose={() => setReceiptToPrint(null)}
        />
      )}

      {/* PRINTABLE REQUISITION MODAL */}
      <PrintableRequisitionModal
        requisition={requisitionToPrint}
        onClose={() => setRequisitionToPrint(null)}
      />
    </div>
  );
};
