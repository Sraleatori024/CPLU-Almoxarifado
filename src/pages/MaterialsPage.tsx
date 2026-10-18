import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  QrCode,
  History,
  Edit2,
  Trash2,
  Power,
  ShieldCheck,
  CheckCircle2,
  X,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Material, MaterialCategory, UnitOfMeasure, Movement } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatNumberBR, formatDateTimeBR, getMovementTypeLabel } from '../utils/formatters';
import { generateQRCodeDataUrl } from '../utils/qr';
import { PrintableQRLabel } from '../components/common/PrintableQRLabel';

interface MaterialsPageProps {
  initialSearchCode?: string;
}

export const MaterialsPage: React.FC<MaterialsPageProps> = ({ initialSearchCode }) => {
  const { currentUser, role, canEditMaterials } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState(initialSearchCode || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [onlyBelowMin, setOnlyBelowMin] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [materialMovements, setMaterialMovements] = useState<Movement[]>([]);

  // QR Label Modal
  const [qrLabelData, setQrLabelData] = useState<{
    title: string;
    code: string;
    subtext: string;
    qrUrl: string;
  } | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<MaterialCategory>('EPI');
  const [formUnit, setFormUnit] = useState<UnitOfMeasure>('UN');
  const [formCurrentStock, setFormCurrentStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(10);
  const [formLocation, setFormLocation] = useState('Galpão A - Almoxarifado Central');
  const [formShelf, setFormShelf] = useState('PRAT-EPI-01');
  const [formSupplier, setFormSupplier] = useState('');
  const [formIsEpi, setFormIsEpi] = useState(true);
  const [formCaNumber, setFormCaNumber] = useState('');
  const [formValidityMonths, setFormValidityMonths] = useState<number>(6);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadMaterials = () => {
    setMaterials(dbService.getMaterials());
  };

  useEffect(() => {
    loadMaterials();
    const unsub = dbService.subscribe(loadMaterials);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSearchCode) {
      setSearch(initialSearchCode);
    }
  }, [initialSearchCode]);

  // Open Edit Modal
  const handleOpenEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setFormName(mat.name);
    setFormDescription(mat.description);
    setFormCategory(mat.category);
    setFormUnit(mat.unit);
    setFormMinStock(mat.minStock);
    setFormLocation(mat.location);
    setFormShelf(mat.shelf);
    setFormSupplier(mat.supplier || '');
    setFormIsEpi(mat.isEpi);
    setFormCaNumber(mat.caNumber || '');
    setFormValidityMonths(mat.validityMonths || 6);
    setFormError(null);
    setFormSuccess(null);
  };

  // Open History Drawer
  const handleOpenHistory = (mat: Material) => {
    setHistoryMaterial(mat);
    const movs = dbService.getMovements().filter((m) => m.materialId === mat.id);
    setMaterialMovements(movs);
  };

  // Open QR Sticker Print
  const handlePrintQR = async (mat: Material) => {
    const payload = JSON.stringify({ type: 'material', code: mat.code });
    const url = await generateQRCodeDataUrl(payload);
    setQrLabelData({
      title: mat.name,
      code: mat.code,
      subtext: `Local: ${mat.shelf} • Cat: ${mat.category}`,
      qrUrl: url,
    });
  };

  // Handle Create Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!currentUser) return;

    if (!formCode.trim() || !formName.trim()) {
      setFormError('Código e Nome do material são obrigatórios.');
      return;
    }

    const res = dbService.createMaterial(
      {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        unit: formUnit,
        currentStock: Number(formCurrentStock),
        minStock: Number(formMinStock),
        location: formLocation.trim(),
        shelf: formShelf.trim().toUpperCase(),
        status: 'ativo',
        supplier: formSupplier.trim() || undefined,
        isEpi: formIsEpi,
        caNumber: formIsEpi ? formCaNumber.trim() : undefined,
        validityMonths: formIsEpi ? Number(formValidityMonths) : undefined,
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        resetForm();
      }, 900);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !currentUser) return;

    setFormError(null);
    setFormSuccess(null);

    const res = dbService.updateMaterial(
      editingMaterial.id,
      {
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        unit: formUnit,
        minStock: Number(formMinStock),
        location: formLocation.trim(),
        shelf: formShelf.trim().toUpperCase(),
        supplier: formSupplier.trim() || undefined,
        isEpi: formIsEpi,
        caNumber: formIsEpi ? formCaNumber.trim() : undefined,
        validityMonths: formIsEpi ? Number(formValidityMonths) : undefined,
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setEditingMaterial(null);
      }, 800);
    }
  };

  // Handle Inactivation Toggle
  const handleToggleStatus = (mat: Material) => {
    if (!currentUser) return;
    const res = dbService.toggleMaterialStatus(mat.id, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    alert(res.message);
  };

  // Handle Physical Deletion with Movement Guard
  const handleDeleteMaterial = (mat: Material) => {
    if (!currentUser) return;
    if (confirm(`Deseja realmente excluir o material ${mat.code} - ${mat.name}?`)) {
      const res = dbService.deleteMaterial(mat.id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      alert(res.message);
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormCategory('EPI');
    setFormUnit('UN');
    setFormCurrentStock(0);
    setFormMinStock(10);
    setFormLocation('Galpão A - Almoxarifado Central');
    setFormShelf('PRAT-EPI-01');
    setFormSupplier('');
    setFormIsEpi(true);
    setFormCaNumber('');
    setFormValidityMonths(6);
    setFormError(null);
    setFormSuccess(null);
  };

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      m.code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.shelf.toLowerCase().includes(q) ||
      (m.caNumber && m.caNumber.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'todos' || m.category === selectedCategory;
    const matchesStatus = selectedStatus === 'todos' || m.status === selectedStatus;
    const matchesBelowMin = !onlyBelowMin || m.currentStock <= m.minStock;

    return matchesQuery && matchesCategory && matchesStatus && matchesBelowMin;
  });

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-orange-600" />
            Cadastro & Controle de Materiais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de EPIs, uniformes, ferramental e insumos da limpeza pública com rastreabilidade
          </p>
        </div>

        {canEditMaterials && (
          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Material
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, nome, prateleira ou CA do MTE..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            >
              <option value="todos">Todas as Categorias</option>
              <option value="EPI">EPI (Equipamento de Proteção)</option>
              <option value="Ferramental">Ferramental</option>
              <option value="Uniformes">Uniformes</option>
              <option value="Químicos & Limpeza">Químicos & Limpeza</option>
              <option value="Sinalização">Sinalização</option>
              <option value="Consumíveis">Consumíveis</option>
              <option value="Manutenção">Manutenção</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>

            {/* Below Min Stock Toggle */}
            <button
              type="button"
              onClick={() => setOnlyBelowMin(!onlyBelowMin)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                onlyBelowMin
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${onlyBelowMin ? 'text-rose-600' : 'text-slate-400'}`} />
              Estoque Abaixo do Mínimo
            </button>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Material / Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Localização & Prateleira</th>
                <th className="py-3 px-4 text-center">Saldo Atual</th>
                <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhum material encontrado com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isLow = mat.currentStock <= mat.minStock;
                  const isZero = mat.currentStock === 0;

                  return (
                    <tr
                      key={mat.id}
                      className={`hover:bg-slate-50/80 transition ${
                        mat.status === 'inativo' ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-orange-700">
                        {mat.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{mat.name}</div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{mat.description}</p>
                        {mat.isEpi && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-mono border border-orange-200 font-semibold">
                              CA MTE: {mat.caNumber || 'Consulte lote'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Validade média: {mat.validityMonths || 6} meses
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                          {mat.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{mat.location}</div>
                        <span className="text-[11px] font-mono text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">
                          {mat.shelf}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div
                          className={`font-mono font-black text-sm ${
                            isZero
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {formatNumberBR(mat.currentStock)} {mat.unit}
                        </div>
                        {isLow && (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Baixo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {formatNumberBR(mat.minStock)} {mat.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            mat.status === 'ativo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {mat.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* QR Sticker Print Button */}
                          <button
                            onClick={() => handlePrintQR(mat)}
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Gerar/Imprimir Etiqueta QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Movements History Button */}
                          <button
                            onClick={() => handleOpenHistory(mat)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Consultar Histórico de Movimentações"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          {canEditMaterials && (
                            <button
                              onClick={() => handleOpenEdit(mat)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                              title="Editar Dados Cadastrais"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Inactivation Toggle */}
                          {canEditMaterials && (
                            <button
                              onClick={() => handleToggleStatus(mat)}
                              className={`p-1.5 rounded-lg transition ${
                                mat.status === 'ativo'
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={mat.status === 'ativo' ? 'Inativar Material' : 'Reativar Material'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}

                          {/* Physical Delete (Admin only with validation) */}
                          {role === 'administrador' && (
                            <button
                              onClick={() => handleDeleteMaterial(mat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Excluir Material (Bloqueado se houver movimentações)"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* CREATE MATERIAL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5" />
                <h3 className="font-bold text-base">Cadastrar Novo Material / EPI</h3>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código Único *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="Ex: EPI-LUV-02"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as MaterialCategory;
                      setFormCategory(cat);
                      setFormIsEpi(cat === 'EPI');
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="EPI">EPI</option>
                    <option value="Ferramental">Ferramental</option>
                    <option value="Uniformes">Uniformes</option>
                    <option value="Químicos & Limpeza">Químicos & Limpeza</option>
                    <option value="Sinalização">Sinalização</option>
                    <option value="Consumíveis">Consumíveis</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Material *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Luva Nitrílica Verde Punho 30cm"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Técnica
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalhes técnicos, finalidade na limpeza urbana..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade *
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as UnitOfMeasure)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="PAR">PAR (Par)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="LT">LT (Litro)</option>
                    <option value="PCT">PCT (Pacote)</option>
                    <option value="M">M (Metro)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Saldo Inicial *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Local Físico *
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Galpão A - Almoxarifado Central"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código da Prateleira *
                  </label>
                  <input
                    type="text"
                    value={formShelf}
                    onChange={(e) => setFormShelf(e.target.value.toUpperCase())}
                    placeholder="PRAT-EPI-01"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* EPI Specific Fields */}
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isEpiCheckbox"
                    checked={formIsEpi}
                    onChange={(e) => setFormIsEpi(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="isEpiCheckbox" className="text-xs font-bold text-orange-950">
                    Este item é um Equipamento de Proteção Individual (EPI - NR-6)
                  </label>
                </div>

                {formIsEpi && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-orange-900 mb-1">
                        Nº Certificado de Aprovação (CA)
                      </label>
                      <input
                        type="text"
                        value={formCaNumber}
                        onChange={(e) => setFormCaNumber(e.target.value)}
                        placeholder="Ex: 34567"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-orange-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-orange-900 mb-1">
                        Vida Útil Média (Meses)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formValidityMonths}
                        onChange={(e) => setFormValidityMonths(parseInt(e.target.value) || 6)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-orange-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MATERIAL MODAL */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Editar Material: {editingMaterial.code}</h3>
                <p className="text-xs text-slate-400">O código e o saldo físico são imutáveis por aqui</p>
              </div>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
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
                  Nome do Material
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Técnica
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MaterialCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="EPI">EPI</option>
                    <option value="Ferramental">Ferramental</option>
                    <option value="Uniformes">Uniformes</option>
                    <option value="Químicos & Limpeza">Químicos & Limpeza</option>
                    <option value="Sinalização">Sinalização</option>
                    <option value="Consumíveis">Consumíveis</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo de Segurança
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Localização Física
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prateleira / Baia
                  </label>
                  <input
                    type="text"
                    value={formShelf}
                    onChange={(e) => setFormShelf(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENTS HISTORY DRAWER */}
      {historyMaterial && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setHistoryMaterial(null)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Histórico de Movimentações</h3>
                <p className="text-xs text-orange-400 font-mono">
                  {historyMaterial.code} • {historyMaterial.name}
                </p>
              </div>
              <button
                onClick={() => setHistoryMaterial(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Saldo Físico Atual:</span>
                <span className="font-bold text-slate-900 text-sm ml-1.5">
                  {historyMaterial.currentStock} {historyMaterial.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Local:</span>
                <span className="font-bold text-slate-800 ml-1.5">{historyMaterial.shelf}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {materialMovements.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhuma movimentação auditada registrada para este material.
                </div>
              ) : (
                materialMovements.map((mov) => {
                  const typeInfo = getMovementTypeLabel(mov.type);
                  return (
                    <div key={mov.id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatDateTimeBR(mov.date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-semibold text-slate-800">
                          Quantidade: {typeInfo.isEntry ? '+' : '-'}
                          {mov.quantity} {historyMaterial.unit}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Saldo: {mov.previousStock} → {mov.newStock}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">
                        <div>
                          <strong>Responsável:</strong> {mov.userName} ({mov.userRole})
                        </div>
                        {mov.employeeName && (
                          <div>
                            <strong>Destinatário:</strong> {mov.employeeName} ({mov.employeeMatricula})
                          </div>
                        )}
                        {mov.requisitionNumber && (
                          <div>
                            <strong>Requisição:</strong> {mov.requisitionNumber}
                          </div>
                        )}
                        {mov.observation && <div>Obs: {mov.observation}</div>}
                        {mov.justification && (
                          <div className="text-amber-800 font-medium">
                            Justificativa: {mov.justification}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR LABEL MODAL */}
      {qrLabelData && (
        <PrintableQRLabel
          title={qrLabelData.title}
          code={qrLabelData.code}
          subtext={qrLabelData.subtext}
          qrDataUrl={qrLabelData.qrUrl}
          onClose={() => setQrLabelData(null)}
        />
      )}
    </div>
  );
};
