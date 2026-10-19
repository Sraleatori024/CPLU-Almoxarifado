import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  Calendar,
  Boxes,
  Users,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Material, Movement, Requisition, EPIDelivery, Employee, Region } from '../types';
import {
  formatDateTimeBR,
  formatDateBR,
  formatNumberBR,
  exportToCSV,
  getMovementTypeLabel,
} from '../utils/formatters';

type ReportType =
  | 'consumo_regiao'
  | 'saldo_geral'
  | 'consumo_setor'
  | 'movimentacoes'
  | 'entregas_epi'
  | 'estoque_critico';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('consumo_regiao');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [deliveries, setDeliveries] = useState<EPIDelivery[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  // Filter state
  const [selectedRegion, setSelectedRegion] = useState<string>('todos');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('todos');
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const loadData = () => {
    setMaterials(dbService.getMaterials());
    setMovements(dbService.getMovements());
    setDeliveries(dbService.getEPIDeliveries());
    setEmployees(dbService.getEmployees());
    setRegions(dbService.getRegions());
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  // Filtered dataset
  const filteredMaterials = materials.filter((m) => {
    const matchCat = selectedCategory === 'todos' || m.category === selectedCategory;
    const matchCode = selectedMaterialCode === 'todos' || m.code === selectedMaterialCode;
    return matchCat && matchCode;
  });

  const filteredMovements = movements.filter((m) => {
    const d = m.date.slice(0, 10);
    const inRange = (!startDate || d >= startDate) && (!endDate || d <= endDate);
    const matchSector = selectedSector === 'todos' || m.sector === selectedSector;
    const matchRegion =
      selectedRegion === 'todos' ||
      m.regionId === selectedRegion ||
      m.regionName?.toLowerCase() === selectedRegion.toLowerCase();
    const matchEmployee = selectedEmployeeId === 'todos' || m.employeeId === selectedEmployeeId;
    const matchMaterial = selectedMaterialCode === 'todos' || m.materialCode === selectedMaterialCode;

    let matchCategory = true;
    if (selectedCategory !== 'todos') {
      const mat = materials.find((matItem) => matItem.code === m.materialCode);
      matchCategory = mat ? mat.category === selectedCategory : true;
    }

    return inRange && matchSector && matchRegion && matchEmployee && matchMaterial && matchCategory;
  });

  const filteredDeliveries = deliveries.filter((d) => {
    const day = d.date.slice(0, 10);
    const inRange = (!startDate || day >= startDate) && (!endDate || day <= endDate);
    const matchSector = selectedSector === 'todos' || d.sector === selectedSector;
    const matchEmployee = selectedEmployeeId === 'todos' || d.employeeId === selectedEmployeeId;
    return inRange && matchSector && matchEmployee;
  });

  const criticalMaterials = materials.filter(
    (m) => m.status === 'ativo' && m.currentStock <= m.minStock
  );

  // Sector consumption breakdown
  const consumptionBySector: Record<string, { totalItems: number; totalQuantity: number }> = {};
  filteredMovements
    .filter((m) => m.type.startsWith('SAIDA_'))
    .forEach((m) => {
      const sector = m.sector || 'Geral';
      if (!consumptionBySector[sector]) {
        consumptionBySector[sector] = { totalItems: 0, totalQuantity: 0 };
      }
      consumptionBySector[sector].totalItems += 1;
      consumptionBySector[sector].totalQuantity += m.quantity;
    });

  // Aggregated consumption by region
  const consumptionByRegion: Record<
    string,
    {
      regionName: string;
      totalUnits: number;
      deliveriesCount: number;
      products: Record<string, { code: string; name: string; qty: number; cat: string }>;
    }
  > = {};

  filteredMovements
    .filter((m) => m.type.startsWith('SAIDA_'))
    .forEach((m) => {
      const regName = m.regionName || 'Paulista';
      if (!consumptionByRegion[regName]) {
        consumptionByRegion[regName] = {
          regionName: regName,
          totalUnits: 0,
          deliveriesCount: 0,
          products: {},
        };
      }
      consumptionByRegion[regName].totalUnits += m.quantity;
      consumptionByRegion[regName].deliveriesCount += 1;

      if (!consumptionByRegion[regName].products[m.materialCode]) {
        const mat = materials.find((it) => it.code === m.materialCode);
        consumptionByRegion[regName].products[m.materialCode] = {
          code: m.materialCode,
          name: m.materialName,
          qty: 0,
          cat: mat ? mat.category : 'Consumíveis',
        };
      }
      consumptionByRegion[regName].products[m.materialCode].qty += m.quantity;
    });

  // Export handlers
  const handleExportCSV = () => {
    if (reportType === 'consumo_regiao') {
      const rows: (string | number)[][] = [
        [
          'Data/Hora',
          'Nº Requisição',
          'Região Operacional',
          'Colaborador Destinatário',
          'Matrícula',
          'Setor',
          'Código Produto',
          'Descrição Produto',
          'Categoria',
          'Quantidade Entregue',
          'Responsável Almoxarifado',
        ],
      ];
      filteredMovements
        .filter((m) => m.type.startsWith('SAIDA_'))
        .forEach((m) => {
          const mat = materials.find((it) => it.code === m.materialCode);
          rows.push([
            formatDateTimeBR(m.date),
            m.requisitionNumber || 'N/A',
            m.regionName || 'Paulista',
            m.employeeName || 'Balcão Geral',
            m.employeeMatricula || 'N/A',
            m.sector || '-',
            m.materialCode,
            m.materialName,
            mat ? mat.category : 'Consumíveis',
            m.quantity,
            m.userName,
          ]);
        });
      exportToCSV(`CPLU_Consumo_Regioes_${startDate}_a_${endDate}`, rows);
    } else if (reportType === 'saldo_geral') {
      const rows: (string | number)[][] = [
        ['Código', 'Material', 'Categoria', 'Unidade', 'Saldo Atual', 'Estoque Mínimo', 'Posição', 'Situação'],
      ];
      filteredMaterials.forEach((m) => {
        rows.push([m.code, m.name, m.category, m.unit, m.currentStock, m.minStock, m.shelf, m.status]);
      });
      exportToCSV('CPLU_Relatorio_Saldo_Estoque', rows);
    } else if (reportType === 'movimentacoes') {
      const rows: (string | number)[][] = [
        ['Data/Hora', 'Tipo', 'Código', 'Material', 'Quantidade', 'Saldo Anterior', 'Novo Saldo', 'Responsável', 'Setor'],
      ];
      filteredMovements.forEach((m) => {
        rows.push([
          formatDateTimeBR(m.date),
          m.type,
          m.materialCode,
          m.materialName,
          m.quantity,
          m.previousStock,
          m.newStock,
          m.userName,
          m.sector || '',
        ]);
      });
      exportToCSV('CPLU_Relatorio_Movimentacoes', rows);
    } else if (reportType === 'entregas_epi') {
      const rows: (string | number)[][] = [
        ['Data/Hora', 'Requisição', 'Colaborador', 'Matrícula', 'Setor', 'EPI', 'CA (MTE)', 'Quantidade', 'Almoxarife'],
      ];
      filteredDeliveries.forEach((d) => {
        d.items.forEach((it) => {
          rows.push([
            formatDateTimeBR(d.date),
            d.requisitionNumber,
            d.employeeName,
            d.employeeMatricula,
            d.sector,
            it.materialName,
            it.caNumber || 'N/A',
            it.quantity,
            d.deliveredByName,
          ]);
        });
      });
      exportToCSV('CPLU_Relatorio_Entregas_EPI_NR6', rows);
    } else if (reportType === 'consumo_setor') {
      const rows: (string | number)[][] = [['Setor Operacional', 'Ocorrências de Saída', 'Volume Total de Unidades']];
      Object.entries(consumptionBySector).forEach(([sec, data]) => {
        rows.push([sec, data.totalItems, data.totalQuantity]);
      });
      exportToCSV('CPLU_Relatorio_Consumo_Setor', rows);
    } else if (reportType === 'estoque_critico') {
      const rows: (string | number)[][] = [
        ['Código', 'Material', 'Categoria', 'Saldo Atual', 'Estoque Mínimo', 'Déficit', 'Localização'],
      ];
      criticalMaterials.forEach((m) => {
        rows.push([
          m.code,
          m.name,
          m.category,
          m.currentStock,
          m.minStock,
          m.minStock - m.currentStock,
          m.shelf,
        ]);
      });
      exportToCSV('CPLU_Relatorio_Estoque_Critico', rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            Relatórios Operacionais & Gerenciais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Análise de saldo, consumo por equipe, movimentações auditadas e histórico de EPIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Relatório
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV (Excel)
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'consumo_regiao', label: 'Consumo por Região & Período' },
          { id: 'saldo_geral', label: 'Saldo Físico Geral' },
          { id: 'consumo_setor', label: 'Consumo por Equipe / Setor' },
          { id: 'movimentacoes', label: 'Movimentações Auditadas' },
          { id: 'entregas_epi', label: 'Entregas de EPI (NR-6)' },
          { id: 'estoque_critico', label: 'Itens Abaixo do Mínimo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as ReportType)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              reportType === tab.id
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Período */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-600">Período:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-slate-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Região Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Região:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="todos">Todas as Regiões</option>
              {regions.map((rg) => (
                <option key={rg.id} value={rg.id}>
                  {rg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            >
              <option value="todos">Todas</option>
              <option value="EPI">EPI</option>
              <option value="Ferramental">Ferramental</option>
              <option value="Uniformes">Uniformes</option>
              <option value="Químicos & Limpeza">Químicos & Limpeza</option>
              <option value="Consumíveis">Consumíveis</option>
              <option value="Sinalização">Sinalização</option>
            </select>
          </div>

          {/* Funcionário Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Funcionário:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs max-w-xs"
            >
              <option value="todos">Todos os Funcionários</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.matricula} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Produto Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Produto:</span>
            <select
              value={selectedMaterialCode}
              onChange={(e) => setSelectedMaterialCode(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs max-w-xs"
            >
              <option value="todos">Todos os Produtos</option>
              {materials.map((m) => (
                <option key={m.id} value={m.code}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* REPORT CONTENT TABLES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 print:border-none print:shadow-none">
        {/* Printable Report Header */}
        <div className="border-b-2 border-orange-600 pb-4 mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 text-white font-black text-sm px-2 py-0.5 rounded">
                CPLU
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                RELATÓRIO OFICIAL DE GESTÃO DE ALMOXARIFADO
              </h2>
            </div>
            <p className="text-xs text-slate-500 uppercase font-semibold mt-1">
              {reportType === 'consumo_regiao' && 'Consumo Consolidado por Região & Período (EPIs, Ferramental e Limpeza)'}
              {reportType === 'saldo_geral' && 'Posição Físico-Estoque e Catálogo'}
              {reportType === 'consumo_setor' && 'Consumo Operacional Consolidado por Setor'}
              {reportType === 'movimentacoes' && 'Trilha de Movimentações de Entrada e Saída'}
              {reportType === 'entregas_epi' && 'Histórico de Entregas e Conformidade NR-6'}
              {reportType === 'estoque_critico' && 'Insumos com Estoque Abaixo do Mínimo de Segurança'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            <div className="font-mono text-[10px]">Período: {formatDateBR(startDate)} a {formatDateBR(endDate)}</div>
          </div>
        </div>

        {/* 0. Consumo por Região & Período */}
        {reportType === 'consumo_regiao' && (
          <div className="space-y-6">
            {/* Regional Totals Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(consumptionByRegion).map((reg) => (
                <div key={reg.regionName} className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-sm text-slate-900">{reg.regionName}</span>
                    <span className="text-xl font-black text-orange-600 font-mono">
                      {formatNumberBR(reg.totalUnits)} un
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {reg.deliveriesCount} entregas registradas
                  </span>
                </div>
              ))}
            </div>

            {/* Matrix of items delivered by region */}
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Nº Requisição</th>
                  <th className="py-2.5 px-3">Região</th>
                  <th className="py-2.5 px-3">Colaborador Destinatário</th>
                  <th className="py-2.5 px-3">Material / Código</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Qtd Entregue</th>
                  <th className="py-2.5 px-3">Almoxarife</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements
                  .filter((m) => m.type.startsWith('SAIDA_'))
                  .map((mov) => {
                    const mat = materials.find((it) => it.code === mov.materialCode);
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {formatDateTimeBR(mov.date)}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-orange-700">
                          {mov.requisitionNumber || 'Saída Avulsa'}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {mov.regionName || 'Paulista'}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{mov.employeeName || 'Balcão'}</div>
                          <span className="font-mono text-[10px] text-slate-400">
                            Mat: {mov.employeeMatricula || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{mov.materialName}</div>
                          <span className="font-mono text-[10px] text-orange-700">{mov.materialCode}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-bold text-slate-700">
                            {mat ? mat.category : 'Consumíveis'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-black text-slate-900 text-sm">
                          {mov.quantity}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{mov.userName}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* 1. Saldo Geral */}
        {reportType === 'saldo_geral' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-center">Unid.</th>
                <th className="py-2.5 px-3 text-center">Saldo Atual</th>
                <th className="py-2.5 px-3 text-center">Mínimo</th>
                <th className="py-2.5 px-3">Prateleira</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 px-3 font-mono font-bold text-orange-700">{m.code}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{m.name}</td>
                  <td className="py-2 px-3 text-slate-600">{m.category}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{m.unit}</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-900">{m.currentStock}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{m.minStock}</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{m.shelf}</td>
                  <td className="py-2 px-3 text-center uppercase font-bold text-[10px]">
                    <span className={m.status === 'ativo' ? 'text-emerald-700' : 'text-slate-400'}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 2. Consumo por Setor */}
        {reportType === 'consumo_setor' && (
          <div className="space-y-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Setor / Frente Operacional</th>
                  <th className="py-2.5 px-4 text-center">Ocorrências de Saída</th>
                  <th className="py-2.5 px-4 text-center">Volume Total Consumido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(consumptionBySector).map(([sec, data]) => (
                  <tr key={sec} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{sec}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {data.totalItems} retiradas
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-orange-700 text-base">
                      {data.totalQuantity} unidades
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Movimentações Auditadas */}
        {reportType === 'movimentacoes' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Data/Hora</th>
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Código</th>
                <th className="py-2 px-3">Material</th>
                <th className="py-2 px-3 text-center">Quantidade</th>
                <th className="py-2 px-3 text-center">Saldo</th>
                <th className="py-2 px-3">Responsável</th>
                <th className="py-2 px-3">Setor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.map((mov) => {
                const typeInfo = getMovementTypeLabel(mov.type);
                return (
                  <tr key={mov.id}>
                    <td className="py-2 px-3 font-mono text-[11px]">{formatDateTimeBR(mov.date)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold">{mov.materialCode}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{mov.materialName}</td>
                    <td className="py-2 px-3 text-center font-mono font-black">
                      {typeInfo.isEntry ? '+' : '-'}
                      {mov.quantity}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-[11px]">
                      {mov.previousStock} → {mov.newStock}
                    </td>
                    <td className="py-2 px-3 text-slate-700">{mov.userName}</td>
                    <td className="py-2 px-3 text-slate-600">{mov.sector || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 4. Entregas de EPI (NR-6) */}
        {reportType === 'entregas_epi' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Data/Hora</th>
                <th className="py-2.5 px-3">Requisição</th>
                <th className="py-2.5 px-3">Colaborador (Matrícula)</th>
                <th className="py-2.5 px-3">Setor</th>
                <th className="py-2.5 px-3">EPIs Entregues</th>
                <th className="py-2.5 px-3">Almoxarife</th>
                <th className="py-2.5 px-3 text-center">Assinatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.map((del) => (
                <tr key={del.id}>
                  <td className="py-2 px-3 font-mono text-[11px]">{formatDateTimeBR(del.date)}</td>
                  <td className="py-2 px-3 font-mono font-bold text-orange-700">{del.requisitionNumber}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">
                    {del.employeeName} ({del.employeeMatricula})
                  </td>
                  <td className="py-2 px-3 text-slate-700">{del.sector}</td>
                  <td className="py-2 px-3">
                    {del.items.map((i) => `${i.quantity} ${i.unit} ${i.materialName}`).join('; ')}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{del.deliveredByName}</td>
                  <td className="py-2 px-3 text-center">
                    {del.signatureDataUrl ? (
                      <span className="text-emerald-700 font-bold text-[10px]">Digitalizada</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Física</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 5. Estoque Crítico */}
        {reportType === 'estoque_critico' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Código</th>
                <th className="py-2.5 px-4">Material</th>
                <th className="py-2.5 px-4">Categoria</th>
                <th className="py-2.5 px-4 text-center">Saldo Atual</th>
                <th className="py-2.5 px-4 text-center">Mínimo</th>
                <th className="py-2.5 px-4 text-center">Déficit</th>
                <th className="py-2.5 px-4">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalMaterials.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 px-4 font-mono font-bold text-rose-700">{m.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                  <td className="py-3 px-4 text-slate-600">{m.category}</td>
                  <td className="py-3 px-4 text-center font-mono font-black text-rose-600">
                    {m.currentStock} {m.unit}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">
                    {m.minStock} {m.unit}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-rose-800">
                    -{m.minStock - m.currentStock} {m.unit}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{m.shelf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>Relatório gerado pelo Sistema CPLU • Operação de Limpeza Urbana</span>
          <span>Autenticidade garantida por logs de auditoria imutáveis</span>
        </div>
      </div>
    </div>
  );
};
