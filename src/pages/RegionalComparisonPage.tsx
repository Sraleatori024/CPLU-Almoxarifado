import React, { useState, useEffect } from 'react';
import {
  MapPin,
  TrendingUp,
  BarChart3,
  Calendar,
  Users,
  Boxes,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  FileSpreadsheet,
  X,
  ShieldCheck,
  ChevronRight,
  Package,
  Wrench,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  const [searchFilter, setSearchFilter] = useState('');

  // Active sub-tab: 'comparison' (Gráficos e Ranking) | 'movements_log' (Histórico Geral de Retiradas)
  const [activeTab, setActiveTab] = useState<'comparison' | 'movements_log'>('comparison');

  // Drilldown Modal for a clicked region
  const [selectedRegionDetail, setSelectedRegionDetail] = useState<string | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState('');
  const [drilldownCategory, setDrilldownCategory] = useState<string>('todos');

  // Simple Region Configuration Modal (Add / Edit Name)
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionName, setRegionName] = useState('');
  const [regionCode, setRegionCode] = useState('');

  // Reassign Employee Region Modal
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

    // Material category check
    let matchesCategory = true;
    if (selectedCategoryFilter !== 'todos') {
      const mat = dbService.getMaterialByCode(mov.materialCode);
      matchesCategory = mat ? mat.category === selectedCategoryFilter : true;
    }

    const q = searchFilter.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (mov.employeeName && mov.employeeName.toLowerCase().includes(q)) ||
      (mov.employeeMatricula && mov.employeeMatricula.toLowerCase().includes(q)) ||
      mov.materialName.toLowerCase().includes(q) ||
      mov.materialCode.toLowerCase().includes(q) ||
      (mov.requisitionNumber && mov.requisitionNumber.toLowerCase().includes(q));

    return matchesRegion && matchesCategory && matchesSearch;
  });

  // Ranking of regions (highest to lowest)
  const rankedRegions = [...summary.regionsList].sort((a, b) => b.totalUnits - a.totalUnits);
  const highestRegion = rankedRegions[0];
  const lowestRegion = rankedRegions[rankedRegions.length - 1];
  const activeRegionsCount = regions.filter((r) => r.active).length;

  // Save Simple Region (Create or Rename)
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

  // Confirm Employee Reassignment
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

  // Active Region Object for Drill-down
  const activeDrilldownRegion = selectedRegionDetail
    ? regions.find((r) => r.id === selectedRegionDetail) ||
      regions.find((r) => r.name.toLowerCase() === selectedRegionDetail.toLowerCase())
    : null;

  // Movements of the selected drill-down region
  const drilldownMovements = selectedRegionDetail
    ? summary.exitMovements.filter((m) => {
        const matchesReg =
          m.regionId === selectedRegionDetail ||
          (activeDrilldownRegion && m.regionName?.toLowerCase() === activeDrilldownRegion.name.toLowerCase());
        if (!matchesReg) return false;

        if (drilldownCategory !== 'todos') {
          const mat = dbService.getMaterialByCode(m.materialCode);
          if (mat && mat.category !== drilldownCategory) return false;
        }

        if (drilldownSearch.trim()) {
          const q = drilldownSearch.trim().toLowerCase();
          const match =
            m.materialName.toLowerCase().includes(q) ||
            m.materialCode.toLowerCase().includes(q) ||
            (m.employeeName && m.employeeName.toLowerCase().includes(q)) ||
            (m.employeeMatricula && m.employeeMatricula.toLowerCase().includes(q)) ||
            (m.requisitionNumber && m.requisitionNumber.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      })
    : [];

  // Correctly group and sum quantities by product for the drill-down region
  const aggregatedProductsMap: Record<
    string,
    {
      code: string;
      name: string;
      category: string;
      totalQuantity: number;
      withdrawalCount: number;
      lastDate: string;
      units: string;
    }
  > = {};

  drilldownMovements.forEach((mov) => {
    if (!aggregatedProductsMap[mov.materialCode]) {
      const mat = dbService.getMaterialByCode(mov.materialCode);
      aggregatedProductsMap[mov.materialCode] = {
        code: mov.materialCode,
        name: mov.materialName,
        category: mat ? mat.category : 'Consumíveis',
        totalQuantity: 0,
        withdrawalCount: 0,
        lastDate: mov.date,
        units: mat ? mat.unit : 'UN',
      };
    }
    aggregatedProductsMap[mov.materialCode].totalQuantity += mov.quantity;
    aggregatedProductsMap[mov.materialCode].withdrawalCount += 1;
    if (mov.date > aggregatedProductsMap[mov.materialCode].lastDate) {
      aggregatedProductsMap[mov.materialCode].lastDate = mov.date;
    }
  });

  const aggregatedProductsList = Object.values(aggregatedProductsMap).sort(
    (a, b) => b.totalQuantity - a.totalQuantity
  );

  // Category breakdown for drilldown
  const drilldownCategoryTotals: Record<string, number> = {
    EPI: 0,
    Ferramental: 0,
    'Químicos & Limpeza': 0,
    Consumíveis: 0,
    Outros: 0,
  };

  drilldownMovements.forEach((mov) => {
    const mat = dbService.getMaterialByCode(mov.materialCode);
    const cat = mat ? mat.category : 'Consumíveis';
    if (cat === 'EPI') drilldownCategoryTotals['EPI'] += mov.quantity;
    else if (cat === 'Ferramental') drilldownCategoryTotals['Ferramental'] += mov.quantity;
    else if (cat === 'Químicos & Limpeza') drilldownCategoryTotals['Químicos & Limpeza'] += mov.quantity;
    else if (cat === 'Consumíveis') drilldownCategoryTotals['Consumíveis'] += mov.quantity;
    else drilldownCategoryTotals['Outros'] += mov.quantity;
  });

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
            Consumo por Região Operacional (Paulista, Taquá, Penha...)
          </h1>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Acompanhamento comparativo de unidades efetivamente retiradas por região, rateio por funcionário, separação por tipo de material e histórico detalhado das entregas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-xs font-bold text-white transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            Exportar Relatório Excel (.xlsx)
          </button>

          <button
            onClick={() => {
              setEditingRegion(null);
              setRegionName('');
              setRegionCode(`REG-${Math.floor(100 + Math.random() * 900)}`);
              setIsRegionModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Configurar Regiões
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
          <span className="text-[10px] text-slate-500">{summary.totalExitMovementsCount} entregas registradas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-2xs">
          <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block mb-1">
            Maior Consumo Regional
          </span>
          <div className="text-xl font-black text-orange-600 truncate">
            {highestRegion ? highestRegion.regionName : '-'}
          </div>
          <span className="text-[10px] text-orange-700">
            {highestRegion ? `${formatNumberBR(highestRegion.totalUnits)} unidades retiradas` : 'Sem retiradas'}
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
            {lowestRegion ? `${formatNumberBR(lowestRegion.totalUnits)} unidades retiradas` : 'Sem retiradas'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Bases Regionais Ativas
          </span>
          <div className="text-2xl font-black text-slate-900">{activeRegionsCount}</div>
          <span className="text-[10px] text-slate-500">{employees.length} colaboradores na escala</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'comparison', label: 'Comparativo Mensal & Gráficos', icon: BarChart3 },
            { id: 'movements_log', label: 'Histórico Completo de Retiradas', icon: Boxes },
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

        {/* Global Filters: Month & Category */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="EPI">Apenas EPIs</option>
            <option value="Ferramental">Ferramental</option>
            <option value="Químicos & Limpeza">Químicos & Limpeza</option>
            <option value="Consumíveis">Consumíveis & Sacos</option>
          </select>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
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
      </div>

      {/* TAB 1: COMPARATIVO MENSAL & CARDS INTERATIVOS */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              Consumo por Região (Clique em qualquer região para ver detalhes dos materiais e histórico)
            </h2>
          </div>

          {/* Interactive Region Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.regionsList.map((rg, idx) => {
              const maxUnits = Math.max(...summary.regionsList.map((r) => r.totalUnits), 1);
              const percentage = Math.round((rg.totalUnits / maxUnits) * 100);
              const topProductList = Object.values(rg.topProducts).sort((a, b) => b.qty - a.qty).slice(0, 3);

              return (
                <div
                  key={rg.regionId}
                  onClick={() => setSelectedRegionDetail(rg.regionId)}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-orange-400 hover:shadow-md transition-all cursor-pointer space-y-4 group relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-orange-600 transition flex items-center gap-1.5">
                          {rg.regionName}
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition" />
                        </h3>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                        {rg.code} • {rg.employeesCount} colaboradores vinculados
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-orange-600">
                        {formatNumberBR(rg.totalUnits)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">unidades entregues</span>
                    </div>
                  </div>

                  {/* Proporção Comparativa */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Consumo relativo</span>
                      <span>{percentage}% da maior região</span>
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
                      Mais Retirados nesta Região:
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

                  <div className="text-[11px] text-orange-600 font-bold flex items-center justify-end gap-1 pt-1">
                    <span>Ver materiais & histórico</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
                  Consolidação dos materiais efetivamente entregues no período selecionado
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
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.regionsList.flatMap((rg) =>
                    Object.values(rg.topProducts)
                      .filter(
                        (p) =>
                          selectedCategoryFilter === 'todos' ||
                          p.category === selectedCategoryFilter
                      )
                      .map((p) => {
                        const count = summary.exitMovements.filter(
                          (m) =>
                            (m.regionId === rg.regionId || m.regionName === rg.regionName) &&
                            m.materialCode === p.code
                        ).length;

                        return (
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
                              {count}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedRegionDetail(rg.regionId)}
                                className="px-2.5 py-1 text-orange-700 hover:bg-orange-50 font-bold rounded-lg transition"
                              >
                                Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETIRADAS POR REGIÃO (HISTÓRICO COMPLETO) */}
      {activeTab === 'movements_log' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por funcionário, matrícula, produto, código ou requisição original..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filtrar Região:</span>
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
                  <th className="py-2.5 px-3">Nº Requisição</th>
                  <th className="py-2.5 px-3">Região</th>
                  <th className="py-2.5 px-3">Funcionário Destinatário</th>
                  <th className="py-2.5 px-3">Produto / Código</th>
                  <th className="py-2.5 px-3 text-center">Qtd Entregue</th>
                  <th className="py-2.5 px-3">Responsável Entrega</th>
                  <th className="py-2.5 px-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhuma retirada localizada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {formatDateTimeBR(mov.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-700">
                        {mov.requisitionNumber || 'Avulsa'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 bg-orange-50 text-orange-800 px-2 py-0.5 rounded border border-orange-200 text-[11px] inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-600" />
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

      {/* REGION DETAILED DRILLDOWN MODAL */}
      {selectedRegionDetail && activeDrilldownRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-black">
                  <MapPin className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    Região {activeDrilldownRegion.name}
                    <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full text-amber-200">
                      {activeDrilldownRegion.code}
                    </span>
                  </h3>
                  <p className="text-xs text-orange-100">
                    Materiais consumidos, quantidades consolidadas e histórico de entregas efetivas
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRegionDetail(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl text-white transition flex items-center gap-1 text-xs font-bold"
              >
                <X className="w-5 h-5" />
                Fechar
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Category Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block mb-1">
                    EPIs Entregues
                  </span>
                  <div className="text-xl font-black text-orange-700">
                    {formatNumberBR(drilldownCategoryTotals['EPI'])}
                  </div>
                  <span className="text-[10px] text-orange-600">itens de proteção</span>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                    Ferramental
                  </span>
                  <div className="text-xl font-black text-blue-700">
                    {formatNumberBR(drilldownCategoryTotals['Ferramental'])}
                  </div>
                  <span className="text-[10px] text-blue-600">vassouras, pás e cabos</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Químicos & Limpeza
                  </span>
                  <div className="text-xl font-black text-emerald-700">
                    {formatNumberBR(drilldownCategoryTotals['Químicos & Limpeza'])}
                  </div>
                  <span className="text-[10px] text-emerald-600">litros / galões</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Consumíveis & Outros
                  </span>
                  <div className="text-xl font-black text-slate-800">
                    {formatNumberBR(drilldownCategoryTotals['Consumíveis'] + drilldownCategoryTotals['Outros'])}
                  </div>
                  <span className="text-[10px] text-slate-500">sacos de lixo e insumos</span>
                </div>
              </div>

              {/* Drilldown Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={drilldownSearch}
                    onChange={(e) => setDrilldownSearch(e.target.value)}
                    placeholder="Pesquisar produto, código, colaborador ou requisição nesta região..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">Categoria:</span>
                  <select
                    value={drilldownCategory}
                    onChange={(e) => setDrilldownCategory(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800"
                  >
                    <option value="todos">Todas</option>
                    <option value="EPI">EPI</option>
                    <option value="Ferramental">Ferramental</option>
                    <option value="Químicos & Limpeza">Químicos & Limpeza</option>
                    <option value="Consumíveis">Consumíveis</option>
                  </select>
                </div>
              </div>

              {/* 1. Consolidated Total Quantities by Product */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-orange-600" />
                    Materiais Consumidos & Quantidades Consolidadas ({aggregatedProductsList.length} itens)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Soma automática de todas as retiradas do período
                  </span>
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3 text-center">Quantidade Total</th>
                        <th className="py-2.5 px-3 text-center">Nº de Retiradas</th>
                        <th className="py-2.5 px-3 text-right">Última Entrega</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aggregatedProductsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Nenhum material consumido nesta região com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        aggregatedProductsList.map((prod) => (
                          <tr key={prod.code} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-orange-700">{prod.code}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{prod.name}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {prod.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-slate-900 text-sm">
                              {prod.totalQuantity} {prod.units}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600">
                              {prod.withdrawalCount}x
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-500">
                              {formatDateTimeBR(prod.lastDate)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Detailed History of Withdrawals in this Region */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600" />
                  Histórico Individual das Retiradas na Região {activeDrilldownRegion.name}
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Nº Requisição</th>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3 text-center">Qtd Entregue</th>
                        <th className="py-2.5 px-3">Funcionário Destinatário</th>
                        <th className="py-2.5 px-3">Data da Entrega</th>
                        <th className="py-2.5 px-3">Almoxarife</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drilldownMovements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Nenhum registro de retirada para esta consulta.
                          </td>
                        </tr>
                      ) : (
                        drilldownMovements.map((mov) => (
                          <tr key={mov.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-orange-700">
                              {mov.requisitionNumber || 'Saída Direta'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900">{mov.materialName}</span>
                              <span className="font-mono text-[10px] text-slate-400 ml-1">({mov.materialCode})</span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-slate-900">
                              {mov.quantity}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-800">{mov.employeeName || 'Balcão Geral'}</div>
                              <span className="text-[10px] font-mono text-slate-400">
                                Mat: {mov.employeeMatricula || 'N/A'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                              {formatDateTimeBR(mov.date)}
                            </td>
                            <td className="py-2 px-3 text-slate-700 font-medium">
                              {mov.userName}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Relatório com base exclusiva em quantidades efetivamente retiradas e registradas no almoxarifado.
              </span>
              <button
                type="button"
                onClick={() => setSelectedRegionDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Voltar ao Comparativo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE REGION CONFIGURATION MODAL (NO SUPERVISOR REQUIRED) */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingRegion ? 'Editar Região Operacional' : 'Cadastrar Região'}
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome Oficial da Região CPLU *
                </label>
                <input
                  type="text"
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  required
                  placeholder="Ex: Paulista, Taquá, Penha, Santana..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Código da Região *
                </label>
                <input
                  type="text"
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value)}
                  required
                  placeholder="Ex: REG-PLT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                Cadastro simplificado: preserva os nomes oficiais da empresa sem exigir chefias, supervisores ou hierarquias complexas.
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
                  {editingRegion ? 'Salvar Alterações' : 'Confirmar Cadastro'}
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
