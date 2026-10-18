import React, { useState, useEffect } from 'react';
import {
  MapPin,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Users,
  Boxes,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronDown,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { dbService } from '../services/db';
import { excelSyncService } from '../services/excelSync';
import { Region, Employee, Movement, MaterialCategory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatNumberBR, formatDateTimeBR } from '../utils/formatters';

export const RegionalComparisonPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Active sub-tab: 'comparison' | 'regions_management' | 'movements_log'
  const [activeTab, setActiveTab] = useState<'comparison' | 'regions_management' | 'movements_log'>('comparison');

  // Modal for new/edit region
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionName, setRegionName] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [regionSupervisor, setRegionSupervisor] = useState('');

  // Modal for employee reassignment
  const [reassignEmployee, setReassignEmployee] = useState<Employee | null>(null);
  const [targetRegionId, setTargetRegionId] = useState('');

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setRegions(dbService.getRegions());
    setEmployees(dbService.getEmployees());
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const summary = dbService.getRegionalConsumptionSummary(selectedMonth);

  // Filtered movements log
  const filteredMovements = summary.exitMovements.filter((mov) => {
    const matchesRegion =
      selectedRegionFilter === 'todos' ||
      mov.regionId === selectedRegionFilter ||
      mov.regionName?.toLowerCase() === selectedRegionFilter.toLowerCase();

    const matchesSearch =
      !searchEmployee ||
      (mov.employeeName && mov.employeeName.toLowerCase().includes(searchEmployee.toLowerCase())) ||
      (mov.employeeMatricula && mov.employeeMatricula.toLowerCase().includes(searchEmployee.toLowerCase())) ||
      mov.materialName.toLowerCase().includes(searchEmployee.toLowerCase());

    return matchesRegion && matchesSearch;
  });

  // Calculate ranking of regions (highest to lowest)
  const rankedRegions = [...summary.regionsList].sort((a, b) => b.totalUnits - a.totalUnits);
  const highestRegion = rankedRegions[0];
  const lowestRegion = rankedRegions[rankedRegions.length - 1];

  // Save Region (Create / Edit)
  const handleSaveRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!regionName.trim() || !regionCode.trim()) return;

    if (editingRegion) {
      const res = dbService.updateRegion(
        editingRegion.id,
        {
          name: regionName.trim(),
          code: regionCode.trim().toUpperCase(),
          supervisor: regionSupervisor.trim() || undefined,
        },
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setIsRegionModalOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } else {
      const res = dbService.createRegion(
        {
          code: regionCode.trim().toUpperCase(),
          name: regionName.trim(),
          supervisor: regionSupervisor.trim() || undefined,
          active: true,
        },
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setIsRegionModalOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }
  };

  // Reassign Employee Region
  const handleConfirmReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reassignEmployee || !targetRegionId) return;

    const res = dbService.assignEmployeeRegion(
      reassignEmployee.id,
      targetRegionId,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setReassignEmployee(null);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleExportExcel = () => {
    excelSyncService.downloadSynchronizedExcel(
      `CPLU_Relatorio_Consumo_Regioes_${selectedMonth}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-300" />
              Controle Operacional Descentralizado
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            Consumo & Comparação por Região Operacional
          </h1>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Acompanhamento comparativo de consumo entre as frentes regionais (Paulista, Taquá, Penha, etc.) com rateio por funcionário, produto e período mensal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-xs font-bold text-white transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            Exportar Excel (.xlsx)
          </button>

          <button
            onClick={() => {
              setEditingRegion(null);
              setRegionName('');
              setRegionCode(`REG-${Math.floor(100 + Math.random() * 900)}`);
              setRegionSupervisor('');
              setIsRegionModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Região
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Retirado no Mês
          </span>
          <div className="text-2xl font-black text-slate-900">
            {formatNumberBR(summary.totalGlobalUnits)}
          </div>
          <span className="text-[10px] text-slate-500">{summary.totalExitMovementsCount} retiradas registradas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-2xs">
          <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block mb-1">
            Região com Maior Consumo
          </span>
          <div className="text-xl font-black text-orange-600 truncate">
            {highestRegion ? highestRegion.regionName : '-'}
          </div>
          <span className="text-[10px] text-orange-700">
            {highestRegion ? `${formatNumberBR(highestRegion.totalUnits)} unidades` : 'Sem movimentação'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Menor Índice de Consumo
          </span>
          <div className="text-xl font-black text-emerald-700 truncate">
            {lowestRegion ? lowestRegion.regionName : '-'}
          </div>
          <span className="text-[10px] text-emerald-700">
            {lowestRegion ? `${formatNumberBR(lowestRegion.totalUnits)} unidades` : 'Sem movimentação'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Regiões Ativas
          </span>
          <div className="text-2xl font-black text-slate-900">{regions.length}</div>
          <span className="text-[10px] text-slate-500">{employees.length} colaboradores alocados</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Month Selector */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'comparison', label: 'Comparativo Mensal & Gráficos', icon: BarChart3 },
            { id: 'movements_log', label: 'Retiradas por Região', icon: Boxes },
            { id: 'regions_management', label: 'Gerenciar Regiões & Equipes', icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600">Período:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todo o Histórico</option>
            <option value="2026-03">Março / 2026 (Atual)</option>
            <option value="2026-02">Fevereiro / 2026</option>
            <option value="2026-01">Janeiro / 2026</option>
          </select>
        </div>
      </div>

      {/* TAB 1: COMPARATIVO MENSAL & RANKINGS */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Visual Region Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.regionsList.map((rg, idx) => {
              const maxUnits = Math.max(...summary.regionsList.map((r) => r.totalUnits), 1);
              const percentage = Math.round((rg.totalUnits / maxUnits) * 100);
              const topProductList = Object.values(rg.topProducts).sort((a, b) => b.qty - a.qty).slice(0, 3);

              return (
                <div
                  key={rg.regionId}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-orange-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                          {rg.regionName}
                        </h3>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                        {rg.code} • {rg.employeesCount} colaboradores
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-orange-600">
                        {formatNumberBR(rg.totalUnits)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">unidades</span>
                    </div>
                  </div>

                  {/* Relative Consumption Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Proporção de Consumo</span>
                      <span>{percentage}% do líder</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Top 3 Products Consumed */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Itens Mais Retirados na Região:
                    </span>
                    {topProductList.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">Nenhuma retirada no período.</div>
                    ) : (
                      <div className="space-y-1">
                        {topProductList.map((prod) => (
                          <div key={prod.code} className="flex justify-between items-center text-xs">
                            <span className="text-slate-700 font-medium truncate max-w-[180px]">
                              {prod.name}
                            </span>
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              {prod.qty} un
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranking Table by Product Across Regions */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  Matriz Comparativa de Materiais Retirados por Região
                </h3>
                <p className="text-xs text-slate-500">
                  Totalização cruzada para prestação de contas da operação de limpeza urbana
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Região Operacional</th>
                    <th className="py-3 px-4">Código / Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Total Retirado</th>
                    <th className="py-3 px-4 text-center">Nº de Retiradas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.regionsList.flatMap((rg) =>
                    Object.values(rg.topProducts).map((p) => (
                      <tr key={`${rg.regionId}-${p.code}`} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{rg.regionName}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-orange-700 mr-2">{p.code}</span>
                          <span className="text-slate-800">{p.name}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                          {p.qty}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                          {summary.exitMovements.filter(
                            (m) =>
                              (m.regionId === rg.regionId || m.regionName === rg.regionName) &&
                              m.materialCode === p.code
                          ).length}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETIRADAS POR REGIÃO (MOVEMENTS LOG) */}
      {activeTab === 'movements_log' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Buscar por funcionário, matrícula ou produto..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Região:</span>
              <select
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-orange-500"
              >
                <option value="todos">Todas as Regiões</option>
                {regions.map((rg) => (
                  <option key={rg.id} value={rg.id}>
                    {rg.name} ({rg.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Região</th>
                  <th className="py-2.5 px-3">Funcionário & Matrícula</th>
                  <th className="py-2.5 px-3">Material / Código</th>
                  <th className="py-2.5 px-3 text-center">Quantidade</th>
                  <th className="py-2.5 px-3">Almoxarife Responsável</th>
                  <th className="py-2.5 px-3">Nº Requisição / Obs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhuma retirada localizada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {formatDateTimeBR(mov.date)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 bg-orange-50 text-orange-800 px-2 py-0.5 rounded border border-orange-200 text-[11px]">
                          {mov.regionName || 'Paulista'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{mov.employeeName || 'Balcão Geral'}</div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {mov.employeeMatricula || 'N/A'} • {mov.sector}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{mov.materialName}</div>
                        <span className="font-mono text-[10px] text-orange-700">{mov.materialCode}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {mov.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{mov.userName}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-500 text-[11px]">
                        {mov.requisitionNumber && (
                          <span className="font-mono font-bold text-slate-700 mr-1">
                            [{mov.requisitionNumber}]
                          </span>
                        )}
                        {mov.observation || mov.justification || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GERENCIAR REGIÕES & EQUIPES */}
      {activeTab === 'regions_management' && (
        <div className="space-y-6">
          {/* Registered Regions Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              Bases e Regionais Cadastradas ({regions.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {regions.map((rg) => {
                const emps = employees.filter((e) => e.regionId === rg.id);
                return (
                  <div
                    key={rg.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                          {rg.code}
                        </span>
                        <h4 className="font-bold text-base text-slate-900 mt-1">{rg.name}</h4>
                        <p className="text-xs text-slate-500">
                          Supervisor: {rg.supervisor || 'Não atribuído'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingRegion(rg);
                          setRegionName(rg.name);
                          setRegionCode(rg.code);
                          setRegionSupervisor(rg.supervisor || '');
                          setIsRegionModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-white"
                        title="Editar Região"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span>Equipe vinculada:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {emps.length} colaborador(es)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Region Reassignment Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  Alocação de Funcionários por Região Operacional
                </h3>
                <p className="text-xs text-slate-500">
                  Vincule ou transfira colaboradores para que as retiradas de estoque entrem no rateio regional correto
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Matrícula</th>
                    <th className="py-2.5 px-4">Colaborador</th>
                    <th className="py-2.5 px-4">Função & Setor</th>
                    <th className="py-2.5 px-4">Região Atual</th>
                    <th className="py-2.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-700">{emp.matricula}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {emp.role} • {emp.sector}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {emp.regionName || 'Sem Região Vinculada'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setReassignEmployee(emp);
                            setTargetRegionId(emp.regionId || regions[0]?.id || '');
                          }}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold transition"
                        >
                          Alterar Região
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT REGION MODAL */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingRegion ? 'Editar Região Operacional' : 'Cadastrar Nova Região'}
              </h3>
              <button
                onClick={() => setIsRegionModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRegion} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Região / Polo *</label>
                <input
                  type="text"
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  required
                  placeholder="Ex: Paulista, Taquá, Penha, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código Identificador *</label>
                <input
                  type="text"
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value)}
                  required
                  placeholder="Ex: REG-PLT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Encarregado / Supervisor</label>
                <input
                  type="text"
                  value={regionSupervisor}
                  onChange={(e) => setRegionSupervisor(e.target.value)}
                  placeholder="Nome do supervisor operacional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {editingRegion ? 'Salvar Alterações' : 'Cadastrar Região'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN EMPLOYEE REGION MODAL */}
      {reassignEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Vincular Região Operacional
            </h3>
            <p className="text-xs text-slate-600">
              Selecione a base ou regional de trabalho para o colaborador{' '}
              <strong>{reassignEmployee.name}</strong> ({reassignEmployee.matricula}):
            </p>

            <form onSubmit={handleConfirmReassign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Região de Alocação:</label>
                <select
                  value={targetRegionId}
                  onChange={(e) => setTargetRegionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                >
                  {regions.map((rg) => (
                    <option key={rg.id} value={rg.id}>
                      {rg.name} ({rg.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignEmployee(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition"
                >
                  Confirmar Vinculação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
