import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  FileBadge2,
  Calendar,
  Building2,
  Edit2,
  Shield,
  X,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Printer,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Employee, EmployeeStatus, EPIDelivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { NavigationTab } from '../components/layout/Sidebar';
import { PrintableEPIReceipt } from '../components/common/PrintableEPIReceipt';

interface EmployeesPageProps {
  onNavigate: (tab: NavigationTab, targetCode?: string) => void;
  targetInitialMatricula?: string;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  onNavigate,
  targetInitialMatricula,
}) => {
  const { currentUser, role, canManageEmployees } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState(targetInitialMatricula || '');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Employee | null>(null);
  const [employeeDeliveries, setEmployeeDeliveries] = useState<EPIDelivery[]>([]);
  const [receiptToPrint, setReceiptToPrint] = useState<EPIDelivery | null>(null);

  // Form State
  const [formMatricula, setFormMatricula] = useState('');
  const [formName, setFormName] = useState('');
  const [formSector, setFormSector] = useState('Varrição Central');
  const [formRole, setFormRole] = useState('Gari / Agente de Limpeza');
  const [formStatus, setFormStatus] = useState<EmployeeStatus>('ativo');
  const [formShoeSize, setFormShoeSize] = useState('41');
  const [formGloveSize, setFormGloveSize] = useState('G');
  const [formUniformSize, setFormUniformSize] = useState('G');
  const [formAdmissionDate, setFormAdmissionDate] = useState('2025-01-15');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadData = () => {
    setEmployees(dbService.getEmployees());
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (targetInitialMatricula) {
      setSearch(targetInitialMatricula);
      const emp = dbService.getEmployeeByMatricula(targetInitialMatricula);
      if (emp) {
        handleViewProfile(emp);
      }
    }
  }, [targetInitialMatricula]);

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormMatricula(`LU-${Math.floor(10000 + Math.random() * 90000)}`);
    setFormName('');
    setFormSector('Varrição Central');
    setFormRole('Gari / Agente de Limpeza');
    setFormStatus('ativo');
    setFormShoeSize('41');
    setFormGloveSize('G');
    setFormUniformSize('G');
    setFormAdmissionDate(new Date().toISOString().slice(0, 10));
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormMatricula(emp.matricula);
    setFormName(emp.name);
    setFormSector(emp.sector);
    setFormRole(emp.role);
    setFormStatus(emp.status);
    setFormShoeSize(emp.shoeSize || '41');
    setFormGloveSize(emp.gloveSize || 'G');
    setFormUniformSize(emp.uniformSize || 'G');
    setFormAdmissionDate(emp.admissionDate || '2025-01-15');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleViewProfile = (emp: Employee) => {
    setViewingProfile(emp);
    const dels = dbService.getEPIDeliveriesByEmployee(emp.id);
    setEmployeeDeliveries(dels);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    setFormSuccess(null);

    if (!formMatricula.trim() || !formName.trim()) {
      setFormError('Matrícula e Nome Completo são obrigatórios.');
      return;
    }

    if (editingEmployee) {
      const res = dbService.updateEmployee(
        editingEmployee.id,
        {
          name: formName.trim(),
          sector: formSector,
          role: formRole,
          status: formStatus,
          shoeSize: formShoeSize,
          gloveSize: formGloveSize,
          uniformSize: formUniformSize,
        },
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );

      if (!res.success) {
        setFormError(res.message);
      } else {
        setFormSuccess(res.message);
        setTimeout(() => setIsModalOpen(false), 800);
      }
    } else {
      const res = dbService.createEmployee(
        {
          matricula: formMatricula.trim().toUpperCase(),
          name: formName.trim(),
          sector: formSector,
          role: formRole,
          status: formStatus,
          shoeSize: formShoeSize,
          gloveSize: formGloveSize,
          uniformSize: formUniformSize,
          admissionDate: formAdmissionDate,
        },
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );

      if (!res.success) {
        setFormError(res.message);
      } else {
        setFormSuccess(res.message);
        setTimeout(() => setIsModalOpen(false), 800);
      }
    }
  };

  // Sectors list
  const sectorsList = [
    'Varrição Central',
    'Coleta Domiciliar',
    'Capina & Roçagem',
    'Coleta Seletiva',
    'Praças & Jardins',
    'Manutenção de Frota',
    'Almoxarifado & Logística',
  ];

  const filteredEmployees = employees.filter((emp) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      emp.matricula.toLowerCase().includes(q) ||
      emp.name.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q);

    const matchesSector = selectedSector === 'todos' || emp.sector === selectedSector;
    const matchesStatus = selectedStatus === 'todos' || emp.status === selectedStatus;

    return matchesSearch && matchesSector && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            Funcionários & Equipes Operacionais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de colaboradores da limpeza urbana, matrículas funcionais e controle de EPIs
          </p>
        </div>

        {canManageEmployees && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Funcionário
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por matrícula (LU-XXXX) ou nome do colaborador..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sector filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todos os Setores</option>
            {sectorsList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todas as Situações</option>
            <option value="ativo">Ativos</option>
            <option value="afastado">Afastados</option>
            <option value="ferias">Em Férias</option>
            <option value="desligado">Desligados</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Matrícula</th>
                <th className="py-3 px-4">Nome do Colaborador</th>
                <th className="py-3 px-4">Setor / Frente</th>
                <th className="py-3 px-4">Função</th>
                <th className="py-3 px-4 text-center">Tamanhos EPI</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhum funcionário encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-orange-700">
                      {emp.matricula}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                      <span className="text-[10px] text-slate-400">
                        Admissão: {formatDateBR(emp.admissionDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{emp.sector}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.role}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        Bota: {emp.shoeSize || '-'} • Luva: {emp.gloveSize || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          emp.status === 'ativo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.status === 'ferias'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewProfile(emp)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 rounded-lg text-xs font-semibold transition"
                          title="Ficha Funcional e Histórico de EPIs"
                        >
                          Ficha / EPIs
                        </button>
                        {canManageEmployees && (
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Editar Dados"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPLOYEE PROFILE DRAWER */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setViewingProfile(null)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-orange-200">
                  Ficha do Colaborador
                </span>
                <h3 className="font-black text-lg">{viewingProfile.name}</h3>
                <p className="text-xs text-orange-100 font-mono">
                  Matrícula: {viewingProfile.matricula} • {viewingProfile.sector}
                </p>
              </div>
              <button
                onClick={() => setViewingProfile(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Calçado</span>
                <span className="font-black text-slate-800 text-sm">
                  {viewingProfile.shoeSize || 'N/I'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Luvas</span>
                <span className="font-black text-slate-800 text-sm">
                  {viewingProfile.gloveSize || 'N/I'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Uniforme</span>
                <span className="font-black text-slate-800 text-sm">
                  {viewingProfile.uniformSize || 'N/I'}
                </span>
              </div>
            </div>

            {/* Actions for this worker */}
            <div className="p-3 bg-white border-b border-slate-200 flex gap-2">
              <button
                onClick={() => {
                  onNavigate('requisitions', viewingProfile.id);
                  setViewingProfile(null);
                }}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Criar Requisição TST
              </button>
              <button
                onClick={() => {
                  onNavigate('epi_history', viewingProfile.matricula);
                  setViewingProfile(null);
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FileBadge2 className="w-3.5 h-3.5 text-orange-600" />
                Ver Histórico NR-6
              </button>
            </div>

            {/* Deliveries list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Últimos Comprovantes de EPI Entregues ({employeeDeliveries.length})
              </h4>

              {employeeDeliveries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum comprovante de entrega eletrônica registrado para este colaborador.
                </div>
              ) : (
                employeeDeliveries.map((del) => (
                  <div key={del.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-orange-700">
                        {del.requisitionNumber}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {formatDateTimeBR(del.date)}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200 border-t border-slate-200 pt-1">
                      {del.items.map((it, idx) => (
                        <div key={idx} className="py-1 flex justify-between">
                          <span className="font-semibold text-slate-800">{it.materialName}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Almoxarife: {del.deliveredByName}</span>
                        {del.signatureDataUrl && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Assinatura Coletada
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setReceiptToPrint(del)}
                        className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-300 hover:border-orange-300 text-orange-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-orange-600" />
                        Ver / Imprimir Termo NR-6
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingEmployee ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    Matrícula Funcional *
                  </label>
                  <input
                    type="text"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value.toUpperCase())}
                    disabled={!!editingEmployee}
                    required
                    placeholder="LU-10999"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold uppercase disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Situação *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EmployeeStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="afastado">Afastado</option>
                    <option value="ferias">Em Férias</option>
                    <option value="desligado">Desligado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Nome do colaborador"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Setor Operacional *
                  </label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    {sectorsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Função *
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    required
                    placeholder="Ex: Gari / Agente de Limpeza"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Medidas para EPIs e Uniformes:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Calçado</label>
                    <input
                      type="text"
                      value={formShoeSize}
                      onChange={(e) => setFormShoeSize(e.target.value)}
                      placeholder="41"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Luvas</label>
                    <input
                      type="text"
                      value={formGloveSize}
                      onChange={(e) => setFormGloveSize(e.target.value)}
                      placeholder="G"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Uniforme</label>
                    <input
                      type="text"
                      value={formUniformSize}
                      onChange={(e) => setFormUniformSize(e.target.value)}
                      placeholder="G"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
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
