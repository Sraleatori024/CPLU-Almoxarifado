import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Calendar,
  Building2,
  User,
  MapPin,
  FileText,
  Boxes,
  Truck,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Movement, Material, Employee, MovementType, MaterialPhysicalLocation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  formatDateTimeBR,
  formatNumberBR,
  getMovementTypeLabel,
  exportToCSV,
} from '../utils/formatters';

export const MovementsPage: React.FC = () => {
  const { currentUser, canRegisterMovements } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('todos');

  // Modal State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form State - Entrada de Mercadorias
  const [entryMaterialId, setEntryMaterialId] = useState('');
  const [entryQuantity, setEntryQuantity] = useState<number>(10);
  const [entrySupplier, setEntrySupplier] = useState('');
  const [entryInvoiceNumber, setEntryInvoiceNumber] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryAisle, setEntryAisle] = useState('Corredor 1');
  const [entryShelf, setEntryShelf] = useState('Prateleira 3');
  const [entryLevel, setEntryLevel] = useState('Nível 2');
  const [entryObservation, setEntryObservation] = useState('');

  // Form State - Transferência Física de Prateleiras
  const [transferMaterialId, setTransferMaterialId] = useState('');
  const [transferSourceLocationId, setTransferSourceLocationId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [transferTargetAisle, setTransferTargetAisle] = useState('Corredor 2');
  const [transferTargetShelf, setTransferTargetShelf] = useState('Prateleira 1');
  const [transferTargetLevel, setTransferTargetLevel] = useState('Nível 1');
  const [transferObservation, setTransferObservation] = useState('');

  // Form State - Saída Manual
  const [exitMaterialId, setExitMaterialId] = useState('');
  const [exitType, setExitType] = useState<MovementType>('SAIDA_CONSUMO');
  const [exitQuantity, setExitQuantity] = useState<number>(1);
  const [exitLocation, setExitLocation] = useState('Galpão A - Almoxarifado Central');
  const [exitSector, setExitSector] = useState('Varrição Central');
  const [exitEmployeeId, setExitEmployeeId] = useState('');
  const [exitObservation, setExitObservation] = useState('');
  const [exitJustification, setExitJustification] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadData = () => {
    setMovements(dbService.getMovements());
    setMaterials(dbService.getMaterials().filter((m) => m.status === 'ativo'));
    setEmployees(dbService.getEmployees().filter((e) => e.status === 'ativo'));
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const selectedEntryMaterial = materials.find((m) => m.id === entryMaterialId);
  const selectedTransferMaterial = materials.find((m) => m.id === transferMaterialId);

  // Set default source location when transfer material changes
  useEffect(() => {
    if (selectedTransferMaterial) {
      const locs = selectedTransferMaterial.physicalLocations || [];
      if (locs.length > 0) {
        setTransferSourceLocationId(locs[0].id);
        setTransferQuantity(Math.min(1, locs[0].quantity));
      }
    }
  }, [transferMaterialId]);

  // Handle Open Entrada Modal
  const handleOpenEntry = () => {
    const firstMat = materials[0];
    setEntryMaterialId(firstMat?.id || '');
    setEntryQuantity(10);
    setEntrySupplier(firstMat?.supplier || 'Fornecedor Homologado');
    setEntryInvoiceNumber('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryAisle('Corredor 1');
    setEntryShelf('Prateleira 3');
    setEntryLevel('Nível 2');
    setEntryObservation('');
    setFormError(null);
    setFormSuccess(null);
    setIsEntryModalOpen(true);
  };

  // Handle Open Transfer Modal
  const handleOpenTransfer = (materialId?: string) => {
    const targetId = materialId || materials[0]?.id || '';
    setTransferMaterialId(targetId);
    const mat = materials.find((m) => m.id === targetId);
    const locs = mat?.physicalLocations || [];
    if (locs.length > 0) {
      setTransferSourceLocationId(locs[0].id);
      setTransferQuantity(Math.min(1, locs[0].quantity));
    }
    setTransferTargetAisle('Corredor 2');
    setTransferTargetShelf('Prateleira 1');
    setTransferTargetLevel('Nível 1');
    setTransferObservation('');
    setFormError(null);
    setFormSuccess(null);
    setIsTransferModalOpen(true);
  };

  // Handle Open Saída Modal
  const handleOpenExit = () => {
    setExitMaterialId(materials[0]?.id || '');
    setExitType('SAIDA_CONSUMO');
    setExitQuantity(1);
    setExitLocation('Galpão A - Almoxarifado Central');
    setExitSector('Varrição Central');
    setExitEmployeeId(employees[0]?.id || '');
    setExitObservation('');
    setExitJustification('');
    setFormError(null);
    setFormSuccess(null);
    setIsExitModalOpen(true);
  };

  // Submit Entrada de Mercadorias
  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    setFormSuccess(null);

    const mat = materials.find((m) => m.id === entryMaterialId);
    if (!mat) {
      setFormError('Selecione um material válido pelo código IKKI ou descrição.');
      return;
    }

    if (entryQuantity <= 0) {
      setFormError('A quantidade recebida deve ser maior que zero.');
      return;
    }

    if (!entryAisle.trim() || !entryShelf.trim() || !entryLevel.trim()) {
      setFormError('Informe o corredor, prateleira e nível de armazenamento físico.');
      return;
    }

    const res = dbService.registerGoodsReceipt({
      materialIdOrCode: mat.id,
      quantity: Number(entryQuantity),
      supplier: entrySupplier.trim() || undefined,
      invoiceNumber: entryInvoiceNumber.trim() || undefined,
      receiptDate: entryDate,
      aisle: entryAisle.trim(),
      shelf: entryShelf.trim(),
      level: entryLevel.trim(),
      user: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      observation: entryObservation.trim(),
      idempotencyKey: `goods_rcpt_${mat.id}_${Date.now()}`,
    });

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setIsEntryModalOpen(false);
      }, 1000);
    }
  };

  // Submit Transferência Física
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    setFormSuccess(null);

    const mat = materials.find((m) => m.id === transferMaterialId);
    if (!mat) {
      setFormError('Selecione um material.');
      return;
    }

    if (!transferSourceLocationId) {
      setFormError('Selecione a localização física de origem.');
      return;
    }

    if (transferQuantity <= 0) {
      setFormError('A quantidade a transferir deve ser maior que zero.');
      return;
    }

    if (!transferTargetAisle.trim() || !transferTargetShelf.trim() || !transferTargetLevel.trim()) {
      setFormError('Informe o corredor, prateleira e nível de destino.');
      return;
    }

    const res = dbService.transferMaterialLocation({
      materialId: mat.id,
      sourceLocationId: transferSourceLocationId,
      targetAisle: transferTargetAisle.trim(),
      targetShelf: transferTargetShelf.trim(),
      targetLevel: transferTargetLevel.trim(),
      quantity: Number(transferQuantity),
      user: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      observation: transferObservation.trim(),
    });

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setIsTransferModalOpen(false);
      }, 1000);
    }
  };

  // Submit Saída Manual
  const handleExitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    setFormSuccess(null);

    const mat = materials.find((m) => m.id === exitMaterialId);
    if (!mat) {
      setFormError('Selecione um material válido.');
      return;
    }

    if (exitQuantity <= 0) {
      setFormError('A quantidade deve ser maior que zero.');
      return;
    }

    const emp = employees.find((e) => e.id === exitEmployeeId);

    const res = dbService.registerStockMovement({
      materialId: mat.id,
      type: exitType,
      quantity: Number(exitQuantity),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      location: exitLocation || mat.location,
      sector: exitSector,
      employeeId: emp?.id,
      employeeName: emp?.name,
      employeeMatricula: emp?.matricula,
      observation: exitObservation.trim(),
      justification: exitJustification.trim(),
    });

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setIsExitModalOpen(false);
      }, 1000);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      [
        'ID Movimento',
        'Data/Hora',
        'Código IKKI',
        'Nome Material',
        'Tipo',
        'Quantidade',
        'Saldo Anterior',
        'Novo Saldo',
        'Responsável',
        'Fornecedor / Empresa',
        'Nota Fiscal',
        'Origem / Destino',
        'Funcionário',
        'Matrícula',
        'Requisição',
        'Observação',
      ],
      ...filteredMovements.map((m) => [
        m.id,
        formatDateTimeBR(m.date),
        m.materialCode,
        m.materialName,
        m.type,
        m.quantity,
        m.previousStock,
        m.newStock,
        m.userName,
        m.supplier || '',
        m.invoiceNumber || '',
        m.sourceLocation && m.targetLocation
          ? `De [${m.sourceLocation}] Para [${m.targetLocation}]`
          : m.targetLocation || m.location,
        m.employeeName || '',
        m.employeeMatricula || '',
        m.requisitionNumber || '',
        m.observation || m.justification || '',
      ]),
    ];
    exportToCSV(`CPLU_Movimentacoes_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  // Filter movements
  const filteredMovements = movements.filter((mov) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      mov.materialCode.toLowerCase().includes(q) ||
      mov.materialName.toLowerCase().includes(q) ||
      mov.userName.toLowerCase().includes(q) ||
      (mov.employeeName && mov.employeeName.toLowerCase().includes(q)) ||
      (mov.employeeMatricula && mov.employeeMatricula.toLowerCase().includes(q)) ||
      (mov.requisitionNumber && mov.requisitionNumber.toLowerCase().includes(q)) ||
      (mov.invoiceNumber && mov.invoiceNumber.toLowerCase().includes(q)) ||
      (mov.supplier && mov.supplier.toLowerCase().includes(q)) ||
      (mov.sourceLocation && mov.sourceLocation.toLowerCase().includes(q)) ||
      (mov.targetLocation && mov.targetLocation.toLowerCase().includes(q));

    let matchType = true;
    if (selectedType === 'entradas') {
      matchType = mov.type.startsWith('ENTRADA_');
    } else if (selectedType === 'saidas') {
      matchType = mov.type.startsWith('SAIDA_');
    } else if (selectedType === 'transferencias') {
      matchType = mov.type === 'TRANSFERENCIA_LOCAL' || mov.type === 'SAIDA_TRANSFERENCIA';
    } else if (selectedType !== 'todos') {
      matchType = mov.type === selectedType;
    }

    const matchMaterial =
      selectedMaterialId === 'todos' || mov.materialId === selectedMaterialId;

    return matchSearch && matchType && matchMaterial;
  });

  // Source location selected for transfer
  const currentTransferSourceLoc = selectedTransferMaterial?.physicalLocations?.find(
    (l) => l.id === transferSourceLocationId
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-orange-600" />
            Entradas, Saídas & Localização Física
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro com código oficial IKKI, notas fiscais, conferência de recebimento e transferências entre prateleiras
          </p>
        </div>

        {canRegisterMovements && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenEntry}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              title="Registrar recebimento de material com Nota Fiscal e localização física"
            >
              <Truck className="w-4 h-4" />
              Entrada de Mercadorias (NF)
            </button>

            <button
              onClick={() => handleOpenTransfer()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              title="Transferir materiais entre corredores e prateleiras sem alterar saldo total"
            >
              <Layers className="w-4 h-4" />
              Transferir entre Prateleiras
            </button>

            <button
              onClick={handleOpenExit}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs"
              title="Saída manual avulsa de material"
            >
              <Minus className="w-4 h-4 text-orange-600" />
              Saída Manual
            </button>
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código IKKI, material, NF, fornecedor, prateleira ou colaborador..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium"
          >
            <option value="todos">Todos os Tipos de Movimentação</option>
            <option value="entradas">Apenas Entradas (Recebimentos / Compras)</option>
            <option value="saidas">Apenas Saídas (Requisições / Consumo)</option>
            <option value="transferencias">Reorganizações Físicas entre Prateleiras</option>
            <option value="ENTRADA_RECEBIMENTO">Entrada por Recebimento</option>
            <option value="ENTRADA_COMPRA">Entrada por Compra (NF-e)</option>
            <option value="SAIDA_REQUISICAO">Saída por Requisição</option>
            <option value="TRANSFERENCIA_LOCAL">Transferência entre Locais</option>
          </select>

          {/* Material Filter */}
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium max-w-xs"
          >
            <option value="todos">Todos os Materiais</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Exportar CSV
        </button>
      </div>

      {/* MOVEMENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Código IKKI / Material</th>
                <th className="py-3 px-4 text-center">Qtd.</th>
                <th className="py-3 px-4 text-center">Saldo</th>
                <th className="py-3 px-4">Localização / Documento</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Destinatário / Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhuma movimentação encontrada com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const typeInfo = getMovementTypeLabel(mov.type);
                  const isTransfer = mov.type === 'TRANSFERENCIA_LOCAL';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formatDateTimeBR(mov.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] border whitespace-nowrap ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{mov.materialName}</div>
                        <span className="font-mono text-[11px] text-orange-700 font-bold">
                          {mov.materialCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-black text-sm ${
                            isTransfer
                              ? 'text-purple-700'
                              : typeInfo.isEntry
                              ? 'text-emerald-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {isTransfer ? '⇄ ' : typeInfo.isEntry ? '+' : '-'}
                          {mov.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] whitespace-nowrap">
                        {isTransfer ? (
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Mantido: {mov.newStock}
                          </span>
                        ) : (
                          <>
                            <span className="text-slate-400">{mov.previousStock}</span>
                            <span className="mx-1 text-slate-400">→</span>
                            <span className="font-bold text-slate-800">{mov.newStock}</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isTransfer ? (
                          <div className="text-[11px] space-y-0.5">
                            <span className="text-slate-500 block">
                              De: <strong className="text-slate-700">{mov.sourceLocation}</strong>
                            </span>
                            <span className="text-purple-700 block font-semibold flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" /> Para: {mov.targetLocation}
                            </span>
                          </div>
                        ) : mov.type.startsWith('ENTRADA_') ? (
                          <div className="text-[11px] space-y-0.5">
                            <span className="font-semibold text-slate-800 block">
                              {mov.targetLocation || mov.location}
                            </span>
                            {(mov.invoiceNumber || mov.supplier) && (
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {mov.invoiceNumber && `NF: ${mov.invoiceNumber}`}
                                {mov.invoiceNumber && mov.supplier && ' • '}
                                {mov.supplier}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">{mov.location}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{mov.userName}</div>
                        <span className="text-[10px] text-slate-500">
                          {mov.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {mov.employeeName ? (
                          <div className="text-slate-800 font-medium">
                            {mov.employeeName}{' '}
                            <span className="text-[10px] font-mono text-slate-500">
                              ({mov.employeeMatricula})
                            </span>
                          </div>
                        ) : mov.justification ? (
                          <div className="text-amber-800 font-semibold text-[11px] line-clamp-2">
                            {mov.justification}
                          </div>
                        ) : mov.observation ? (
                          <div className="text-slate-600 text-[11px] line-clamp-2">
                            {mov.observation}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
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

      {/* MODAL 1: REGISTRAR ENTRADA DE MERCADORIAS (NF-e & LOCALIZAÇÃO FÍSICA) */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[94vh] flex flex-col">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">Entrada de Mercadorias / Recebimento</h3>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEntrySubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Material Selector by IKKI Code & Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Material / Código Oficial IKKI *
                </label>
                <select
                  value={entryMaterialId}
                  onChange={(e) => {
                    setEntryMaterialId(e.target.value);
                    const mat = materials.find((m) => m.id === e.target.value);
                    if (mat?.supplier) setEntrySupplier(mat.supplier);
                  }}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} (Saldo Atual: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
                {selectedEntryMaterial && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                    <span>Unidade: <strong>{selectedEntryMaterial.unit}</strong></span>
                    <span>• Categoria: <strong>{selectedEntryMaterial.category}</strong></span>
                    {selectedEntryMaterial.caNumber && (
                      <span>• CA: <strong>{selectedEntryMaterial.caNumber}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade Recebida *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fornecedor / Fabricante
                  </label>
                  <input
                    type="text"
                    value={entrySupplier}
                    onChange={(e) => setEntrySupplier(e.target.value)}
                    placeholder="Ex: Couros & Cia EPIs"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* NF & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nota Fiscal / Documento (NF-e)
                  </label>
                  <input
                    type="text"
                    value={entryInvoiceNumber}
                    onChange={(e) => setEntryInvoiceNumber(e.target.value)}
                    placeholder="Ex: NF-44921"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data do Recebimento *
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Physical Location Fields */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Localização Física de Armazenamento:
                </span>
                <p className="text-[10px] text-slate-500">
                  Informe exatamente onde o material será alocado no almoxarifado para facilitar a conferência e retirada pelas equipes.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Corredor *</label>
                    <input
                      type="text"
                      value={entryAisle}
                      onChange={(e) => setEntryAisle(e.target.value)}
                      placeholder="Corredor 1"
                      required
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Prateleira *</label>
                    <input
                      type="text"
                      value={entryShelf}
                      onChange={(e) => setEntryShelf(e.target.value)}
                      placeholder="Prateleira 3"
                      required
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nível / Andar *</label>
                    <input
                      type="text"
                      value={entryLevel}
                      onChange={(e) => setEntryLevel(e.target.value)}
                      placeholder="Nível 2"
                      required
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações da Conferência Física
                </label>
                <textarea
                  value={entryObservation}
                  onChange={(e) => setEntryObservation(e.target.value)}
                  placeholder="Lote recebido em embalagens íntegras, conferido conforme pedido de compras..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20"
                >
                  Confirmar Entrada no Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFERÊNCIA ENTRE PRATELEIRAS / REORGANIZAÇÃO */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[94vh] flex flex-col">
            <div className="bg-purple-700 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-200" />
                <h3 className="font-bold text-base">Reorganização / Transferência entre Prateleiras</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 leading-relaxed">
                <strong>Regra Operacional:</strong> A transferência física redistribui as quantidades entre corredores e prateleiras sem alterar o saldo total do estoque.
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-purple-50 border border-purple-300 text-purple-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Material */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione o Material a Transferir *
                </label>
                <select
                  value={transferMaterialId}
                  onChange={(e) => setTransferMaterialId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} (Saldo Total: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Origin Location Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local de Origem (Onde o item está armazenado) *
                </label>
                <select
                  value={transferSourceLocationId}
                  onChange={(e) => setTransferSourceLocationId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
                >
                  {(selectedTransferMaterial?.physicalLocations || []).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.aisle}, {loc.shelf}, {loc.level} — Disponível neste local: {loc.quantity} {selectedTransferMaterial?.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity to transfer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade a Transferir * (Máx: {currentTransferSourceLoc?.quantity || 0} {selectedTransferMaterial?.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentTransferSourceLoc?.quantity || 1}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Destination Location */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Local de Destino:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Corredor Destino *</label>
                    <input
                      type="text"
                      value={transferTargetAisle}
                      onChange={(e) => setTransferTargetAisle(e.target.value)}
                      placeholder="Corredor 2"
                      required
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Prateleira Destino *</label>
                    <input
                      type="text"
                      value={transferTargetShelf}
                      onChange={(e) => setTransferTargetShelf(e.target.value)}
                      placeholder="Prateleira 1"
                      required
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nível Destino *</label>
                    <input
                      type="text"
                      value={transferTargetLevel}
                      onChange={(e) => setTransferTargetLevel(e.target.value)}
                      placeholder="Nível 1"
                      required
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Reorganização (Opcional)
                </label>
                <input
                  type="text"
                  value={transferObservation}
                  onChange={(e) => setTransferObservation(e.target.value)}
                  placeholder="Ex: Otimização de espaço no almoxarifado central..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-700/20"
                >
                  Confirmar Transferência Física
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SAÍDA MANUAL */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="w-5 h-5" />
                <h3 className="font-bold text-base">Registrar Saída Manual de Material</h3>
              </div>
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExitSubmit} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione o Material *
                </label>
                <select
                  value={exitMaterialId}
                  onChange={(e) => setExitMaterialId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} (Saldo: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Saída *
                  </label>
                  <select
                    value={exitType}
                    onChange={(e) => setExitType(e.target.value as MovementType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="SAIDA_CONSUMO">Consumo Operacional</option>
                    <option value="SAIDA_AJUSTE">Ajuste de Estoque / Avaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={exitQuantity}
                    onChange={(e) => setExitQuantity(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Colaborador Destinatário (Opcional)
                </label>
                <select
                  value={exitEmployeeId}
                  onChange={(e) => setExitEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium"
                >
                  <option value="">Nenhum colaborador específico</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.matricula} — {e.name} ({e.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justificativa / Motivo da Saída *
                </label>
                <textarea
                  value={exitJustification}
                  onChange={(e) => setExitJustification(e.target.value)}
                  placeholder="Informe o motivo da saída..."
                  rows={2}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20"
                >
                  Confirmar Baixa de Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
