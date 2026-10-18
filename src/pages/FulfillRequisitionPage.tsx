import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Search,
  AlertTriangle,
  Printer,
  ShieldCheck,
  User,
  Boxes,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Requisition, Material, EPIDelivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SignaturePad } from '../components/common/SignaturePad';
import { PrintableEPIReceipt } from '../components/common/PrintableEPIReceipt';
import {
  formatDateTimeBR,
  getRequisitionStatusBadge,
  getPriorityBadge,
} from '../utils/formatters';

interface FulfillRequisitionPageProps {
  initialSearchReqNumber?: string;
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

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<EPIDelivery | null>(null);

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

    // Search by requisition number or worker matricula
    let req = dbService.getRequisitionByNumber(q);
    if (!req) {
      // Search by employee matricula in pending requisitions
      const all = dbService.getRequisitions();
      req = all.find(
        (r) =>
          r.employeeMatricula.toUpperCase() === q &&
          (r.status === 'pendente' || r.status === 'parcialmente_atendida')
      );
    }

    if (!req) {
      setErrorMsg(`Nenhuma requisição pendente localizada para "${q}".`);
      setActiveReq(null);
      return;
    }

    setActiveReq(req);

    // Initialize quantities to remaining needed
    const initialQty: Record<string, number> = {};
    req.items.forEach((item) => {
      const remaining = item.quantityRequested - item.quantityDelivered;
      const mat = dbService.getMaterialById(item.materialId);
      const stock = mat ? mat.currentStock : 0;
      // Default delivery is remaining, capped by stock
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

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeReq) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!canFulfillRequisitions) {
      setErrorMsg('Acesso negado: Seu perfil atual não possui permissão para efetuar entregas de materiais.');
      return;
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
    .filter((r) => r.status === 'pendente' || r.status === 'parcialmente_atendida');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-orange-600" />
            Balcão de Atendimento & Entrega de EPIs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conferência física, baixa atômica de estoque e assinatura digital do colaborador (NR-6)
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
            Localizar Requisição para Atendimento:
          </label>
          <div className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Digite o número da requisição (ex: REQ-2026-0001) ou Matrícula (LU-10452)..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Quick Pending Queue Buttons */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Fila de Espera no Almoxarifado ({pendingQueue.length} requisições aguardando):
          </span>
          <div className="flex flex-wrap gap-2">
            {pendingQueue.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Nenhuma requisição na fila no momento.</span>
            ) : (
              pendingQueue.map((req) => (
                <button
                  key={req.id}
                  onClick={() => {
                    setSearch(req.number);
                    handleSearch(req.number);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
                    activeReq?.id === req.id
                      ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-orange-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="font-mono font-bold">{req.number}</span>
                  <span>{req.employeeName.split(' ')[0]}</span>
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
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Comprovante NR-6
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

            {/* Employee Quick Badge */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-sm">
                {activeReq.employeeName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm text-white">{activeReq.employeeName}</div>
                <div className="text-xs text-slate-400 font-mono">
                  Matrícula: {activeReq.employeeMatricula} • Setor: {activeReq.sector}
                </div>
              </div>
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
                Conferência e Separação Física dos Itens
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Item / EPI Solicitado</th>
                      <th className="py-2.5 px-4 text-center">Solicitado</th>
                      <th className="py-2.5 px-4 text-center">Já Entregue</th>
                      <th className="py-2.5 px-4 text-center">Saldo Faltante</th>
                      <th className="py-2.5 px-4 text-center">Estoque Físico</th>
                      <th className="py-2.5 px-4 text-center">Qtd. a Entregar Agora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeReq.items.map((item) => {
                      const mat = materials.find((m) => m.id === item.materialId);
                      const currentStock = mat ? mat.currentStock : 0;
                      const remaining = item.quantityRequested - item.quantityDelivered;
                      const deliverNow = deliveredQuantities[item.id] || 0;
                      const isComplete = item.quantityDelivered >= item.quantityRequested;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 transition ${
                            isComplete ? 'bg-slate-50/70 opacity-60' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">
                              {item.materialName}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-orange-700 font-bold">
                                {item.materialCode}
                              </span>
                              {item.caNumber && (
                                <span className="bg-orange-50 text-orange-800 font-mono px-1 rounded">
                                  CA: {item.caNumber}
                                </span>
                              )}
                              <span>Local: {mat?.shelf || 'Almoxarifado'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                            {item.quantityRequested} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">
                            {item.quantityDelivered} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            <span className={remaining > 0 ? 'text-amber-700' : 'text-slate-400'}>
                              {remaining} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                currentStock === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : currentStock < remaining
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isComplete ? (
                              <span className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Entregue
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.min(remaining, currentStock)}
                                  disabled={!canFulfillRequisitions || currentStock === 0}
                                  value={deliverNow}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.id,
                                      parseInt(e.target.value) || 0,
                                      remaining,
                                      currentStock
                                    )
                                  }
                                  className="w-20 px-2 py-1 text-center font-mono font-bold border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden disabled:bg-slate-100"
                                />
                                <span className="text-xs text-slate-500 font-semibold">
                                  {item.unit}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIGNATURE PAD (NR-6 DIGITAL SIGNATURE) */}
            <div className="pt-2">
              <SignaturePad
                employeeName={activeReq.employeeName}
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
                placeholder="Ex: Entrega completa realizada em balcão. Orientado sobre conservação de EPIs."
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
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={!canFulfillRequisitions}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirmar Entrega & Gerar Recibo NR-6
                </button>
              </div>
            </div>
          </form>
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
