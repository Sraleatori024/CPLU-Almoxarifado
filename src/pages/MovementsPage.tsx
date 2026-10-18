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
} from 'lucide-react';
import { dbService } from '../services/db';
import { Movement, Material, Employee, MovementType } from '../types';
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

  // Form State
  const [formMaterialId, setFormMaterialId] = useState('');
  const [formType, setFormType] = useState<MovementType>('ENTRADA_COMPRA');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formLocation, setFormLocation] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formObservation, setFormObservation] = useState('');
  const [formJustification, setFormJustification] = useState('');

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

  const selectedMaterial = materials.find((m) => m.id === formMaterialId);

  const handleOpenEntry = () => {
    setFormMaterialId(materials[0]?.id || '');
    setFormType('ENTRADA_COMPRA');
    setFormQuantity(10);
    setFormLocation('Galpão A - Almoxarifado Central');
    setFormSector('Almoxarifado');
    setFormEmployeeId('');
    setFormObservation('');
    setFormJustification('');
    setFormError(null);
    setFormSuccess(null);
    setIsEntryModalOpen(true);
  };

  const handleOpenExit = () => {
    setFormMaterialId(materials[0]?.id || '');
    setFormType('SAIDA_CONSUMO');
    setFormQuantity(1);
    setFormLocation('Galpão A - Almoxarifado Central');
    setFormSector('Varrição Central');
    setFormEmployeeId(employees[0]?.id || '');
    setFormObservation('');
    setFormJustification('');
    setFormError(null);
    setFormSuccess(null);
    setIsExitModalOpen(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    setFormSuccess(null);

    const mat = materials.find((m) => m.id === formMaterialId);
    if (!mat) {
      setFormError('Selecione um material válido.');
      return;
    }

    if (formQuantity <= 0) {
      setFormError('A quantidade deve ser maior que zero.');
      return;
    }

    const emp = employees.find((e) => e.id === formEmployeeId);

    const res = dbService.registerStockMovement({
      materialId: mat.id,
      type: formType,
      quantity: Number(formQuantity),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      location: formLocation || mat.location,
      sector: formSector,
      employeeId: emp?.id,
      employeeName: emp?.name,
      employeeMatricula: emp?.matricula,
      observation: formObservation.trim(),
      justification: formJustification.trim(),
    });

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setIsEntryModalOpen(false);
        setIsExitModalOpen(false);
      }, 900);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      [
        'ID Movimento',
        'Data/Hora',
        'Código Material',
        'Nome Material',
        'Tipo',
        'Quantidade',
        'Saldo Anterior',
        'Novo Saldo',
        'Responsável',
        'Setor',
        'Funcionário',
        'Matrícula',
        'Requisição',
        'Observação',
        'Justificativa',
      ],
    ];

    filteredMovements.forEach((m) => {
      rows.push([
        m.id,
        formatDateTimeBR(m.date),
        m.materialCode,
        m.materialName,
        m.type,
        m.quantity,
        m.previousStock,
        m.newStock,
        m.userName,
        m.sector || '',
        m.employeeName || '',
        m.employeeMatricula || '',
        m.requisitionNumber || '',
        m.observation || '',
        m.justification || '',
      ]);
    });

    exportToCSV(`CPLU_Movimentacoes_Estoque_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  // Filter movements
  const filteredMovements = movements.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.materialCode.toLowerCase().includes(q) ||
      m.materialName.toLowerCase().includes(q) ||
      (m.employeeName && m.employeeName.toLowerCase().includes(q)) ||
      (m.employeeMatricula && m.employeeMatricula.toLowerCase().includes(q)) ||
      (m.requisitionNumber && m.requisitionNumber.toLowerCase().includes(q));

    const matchesType = selectedType === 'todos' || m.type === selectedType;
    const matchesMaterial = selectedMaterialId === 'todos' || m.materialId === selectedMaterialId;

    return matchesSearch && matchesType && matchesMaterial;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-orange-600" />
            Entradas, Saídas e Ajustes de Estoque
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Transações atômicas com validação de saldo e registro auditável imutável
          </p>
        </div>

        {canRegisterMovements && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEntry}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Registrar Entrada
            </button>
            <button
              onClick={handleOpenExit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition"
            >
              <Minus className="w-4 h-4" />
              Registrar Saída
            </button>
          </div>
        )}
      </div>

      {/* Filter and Export Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, material, funcionário, matrícula..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Movement Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="ENTRADA_COMPRA">Entrada por Compra (NF-e)</option>
            <option value="ENTRADA_RECEBIMENTO">Entrada por Recebimento</option>
            <option value="ENTRADA_DEVOLUCAO">Entrada por Devolução</option>
            <option value="ENTRADA_AJUSTE">Entrada por Ajuste Balanço</option>
            <option value="SAIDA_REQUISICAO">Saída por Requisição / EPI</option>
            <option value="SAIDA_CONSUMO">Saída por Consumo Operacional</option>
            <option value="SAIDA_TRANSFERENCIA">Saída por Transferência</option>
            <option value="SAIDA_AJUSTE">Saída por Ajuste / Avaria</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Tipo de Movimento</th>
                <th className="py-3 px-4">Material / Insumo</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4 text-center">Saldo (Antes → Depois)</th>
                <th className="py-3 px-4">Responsável & Setor</th>
                <th className="py-3 px-4">Destinatário / Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhuma movimentação encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const typeInfo = getMovementTypeLabel(mov.type);

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
                        <span className="font-mono text-[11px] text-orange-700 font-semibold">
                          {mov.materialCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-black text-sm ${
                            typeInfo.isEntry ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {typeInfo.isEntry ? '+' : '-'}
                          {mov.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        <span className="text-slate-400">{mov.previousStock}</span>
                        <span className="mx-1 text-slate-400">→</span>
                        <span className="font-bold text-slate-800">{mov.newStock}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{mov.userName}</div>
                        <span className="text-[10px] text-slate-500">
                          {mov.userRole} • {mov.sector || 'Geral'}
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
                            Motivo: {mov.justification}
                          </div>
                        ) : mov.observation ? (
                          <div className="text-slate-500 text-[11px] line-clamp-1">
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

      {/* MODAL REGISTRAR ENTRADA */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-base">Registrar Entrada de Material</h3>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-6 space-y-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Material *
                </label>
                <select
                  value={formMaterialId}
                  onChange={(e) => setFormMaterialId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} (Saldo: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Entrada *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MovementType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="ENTRADA_COMPRA">Compra / NF-e</option>
                    <option value="ENTRADA_RECEBIMENTO">Recebimento de Lote</option>
                    <option value="ENTRADA_DEVOLUCAO">Devolução de Equipe</option>
                    <option value="ENTRADA_AJUSTE">Ajuste de Balanço (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {selectedMaterial && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center">
                  <span className="text-emerald-900">Previsão após entrada:</span>
                  <span className="font-mono font-black text-emerald-800">
                    {selectedMaterial.currentStock} + {formQuantity} ={' '}
                    {selectedMaterial.currentStock + Number(formQuantity)} {selectedMaterial.unit}
                  </span>
                </div>
              )}

              {formType === 'ENTRADA_AJUSTE' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Justificativa Obrigatória do Ajuste *
                  </label>
                  <textarea
                    value={formJustification}
                    onChange={(e) => setFormJustification(e.target.value)}
                    required
                    rows={2}
                    placeholder="Descreva a contagem física, motivo da divergência..."
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número NF-e ou Observações
                </label>
                <input
                  type="text"
                  value={formObservation}
                  onChange={(e) => setFormObservation(e.target.value)}
                  placeholder="Ex: Nota Fiscal 55431 da Empresa XPTO"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR SAÍDA */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="w-5 h-5" />
                <h3 className="font-bold text-base">Registrar Saída / Baixa de Estoque</h3>
              </div>
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-6 space-y-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Material *
                </label>
                <select
                  value={formMaterialId}
                  onChange={(e) => setFormMaterialId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} (Disponível: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Saída *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MovementType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="SAIDA_CONSUMO">Consumo Operacional</option>
                    <option value="SAIDA_TRANSFERENCIA">Transferência de Polo</option>
                    <option value="SAIDA_AJUSTE">Ajuste de Avaria / Perda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade de Saída *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedMaterial?.currentStock || 9999}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {selectedMaterial && (
                <div
                  className={`p-3 rounded-xl text-xs flex justify-between items-center border ${
                    selectedMaterial.currentStock < formQuantity
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <span>Saldo disponível: {selectedMaterial.currentStock} {selectedMaterial.unit}</span>
                  <span className="font-mono font-bold">
                    Saldo restante:{' '}
                    {Math.max(0, selectedMaterial.currentStock - Number(formQuantity))}{' '}
                    {selectedMaterial.unit}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Funcionário Destinatário (Opcional)
                </label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                >
                  <option value="">Não vinculado a funcionário específico</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.matricula} - {emp.name} ({emp.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Setor / Frente Operacional
                </label>
                <input
                  type="text"
                  value={formSector}
                  onChange={(e) => setFormSector(e.target.value)}
                  placeholder="Ex: Varrição Central, Capina & Roçagem..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              {formType === 'SAIDA_AJUSTE' && (
                <div>
                  <label className="block text-xs font-semibold text-rose-800 mb-1">
                    Justificativa Obrigatória de Perda / Avaria *
                  </label>
                  <textarea
                    value={formJustification}
                    onChange={(e) => setFormJustification(e.target.value)}
                    required
                    rows={2}
                    placeholder="Descreva o motivo da avaria, quebra ou perda..."
                    className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Gerais
                </label>
                <input
                  type="text"
                  value={formObservation}
                  onChange={(e) => setFormObservation(e.target.value)}
                  placeholder="Ex: Substituição emergencial em campo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExitModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Confirmar Saída
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
