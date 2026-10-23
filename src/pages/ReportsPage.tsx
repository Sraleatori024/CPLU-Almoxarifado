import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  Calendar,
  Boxes,
  Truck,
  Fuel,
  Wrench,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';
import { dbService } from '../services/db';
import {
  Material,
  Movement,
  Requisition,
  Region,
  FuelingRecord,
  ServiceOrder,
  Vehicle,
} from '../types';
import {
  formatDateTimeBR,
  formatDateBR,
  formatNumberBR,
  exportToCSV,
} from '../utils/formatters';

type ReportType =
  | 'consumo_regiao'
  | 'saldo_geral'
  | 'abastecimento_frota'
  | 'manutencao_frota'
  | 'movimentacoes'
  | 'estoque_critico';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('consumo_regiao');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelings, setFuelings] = useState<FuelingRecord[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);

  // Filter state
  const [selectedRegion, setSelectedRegion] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('todos');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const loadData = () => {
    setMaterials(dbService.getMaterials());
    setMovements(dbService.getMovements());
    setRegions(dbService.getRegions());
    setVehicles(dbService.getVehicles());
    setFuelings(dbService.getFuelings());
    setOrders(dbService.getServiceOrders());
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  // Filtered movements for warehouse consumption
  const filteredMovements = movements.filter((m) => {
    const d = m.date.slice(0, 10);
    const inRange = (!startDate || d >= startDate) && (!endDate || d <= endDate);
    const matchRegion =
      selectedRegion === 'todos' ||
      m.regionId === selectedRegion ||
      m.regionName?.toLowerCase() === selectedRegion.toLowerCase();

    let matchCategory = true;
    if (selectedCategory !== 'todos') {
      const mat = materials.find((matItem) => matItem.code === m.materialCode);
      matchCategory = mat ? mat.category === selectedCategory : true;
    }

    return inRange && matchRegion && matchCategory;
  });

  // Filtered Fuelings
  const filteredFuelings = fuelings.filter((f) => {
    const d = f.dateTime.slice(0, 10);
    const inRange = (!startDate || d >= startDate) && (!endDate || d <= endDate);
    const matchVeh = selectedVehicleId === 'todos' || f.vehicleId === selectedVehicleId;
    return inRange && matchVeh;
  });

  // Filtered Service Orders
  const filteredOrders = orders.filter((o) => {
    const d = o.openedAt.slice(0, 10);
    const inRange = (!startDate || d >= startDate) && (!endDate || d <= endDate);
    const matchVeh = selectedVehicleId === 'todos' || o.vehicleId === selectedVehicleId;
    return inRange && matchVeh;
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
      const regName = m.regionName || 'Ipiranga';
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

  const criticalMaterials = materials.filter(
    (m) => m.status === 'ativo' && m.currentStock <= m.minStock
  );

  // CSV Export handler
  const handleExportCSV = () => {
    if (reportType === 'consumo_regiao') {
      const rows: (string | number)[][] = [
        [
          'Data/Hora',
          'Nº Requisição',
          'Nº Carimbado',
          'Sub-região Solicitante',
          'Código Oficial IKKI',
          'Descrição do Material',
          'Quantidade Entregue',
          'Responsável Almoxarifado',
          'Observação',
        ],
      ];
      filteredMovements
        .filter((m) => m.type.startsWith('SAIDA_'))
        .forEach((m) => {
          rows.push([
            formatDateTimeBR(m.date),
            m.requisitionNumber || 'Saída Direta',
            m.stampedNumber || '—',
            m.regionName || 'Ipiranga',
            m.materialCode,
            m.materialName,
            m.quantity,
            m.userName,
            m.observation || '',
          ]);
        });
      exportToCSV('CPLU_Consumo_Por_Regiao', rows);
    } else if (reportType === 'saldo_geral') {
      const rows: (string | number)[][] = [
        ['Código IKKI', 'Material', 'Categoria', 'Unidade', 'Saldo Atual', 'Estoque Mínimo', 'Localização'],
      ];
      materials.forEach((m) => {
        rows.push([m.code, m.name, m.category, m.unit, m.currentStock, m.minStock, m.shelf]);
      });
      exportToCSV('CPLU_Saldo_Geral_Estoque', rows);
    } else if (reportType === 'abastecimento_frota') {
      const rows: (string | number)[][] = [
        ['Data/Hora', 'Prefixo', 'Placa', 'Combustível', 'Litros', 'Preço Unit.', 'Total (R$)', 'Odômetro (km)', 'Horímetro (h)', 'Média (km/L)', 'Posto'],
      ];
      filteredFuelings.forEach((f) => {
        rows.push([
          formatDateTimeBR(f.dateTime),
          f.fleetNumber,
          f.plate,
          f.fuelType,
          f.liters,
          f.unitPrice,
          f.totalCost,
          f.odometerKm,
          f.hourmeterHours || 0,
          f.calculatedKmPerLiter || 'N/A',
          f.stationLocation,
        ]);
      });
      exportToCSV('CPLU_Relatorio_Abastecimento_Frota', rows);
    } else if (reportType === 'manutencao_frota') {
      const rows: (string | number)[][] = [
        ['Nº OS', 'Data Abertura', 'Prefixo', 'Placa', 'Tipo', 'Prioridade', 'Status', 'Mão de Obra (R$)', 'Peças (R$)', 'Total (R$)', 'Downtime (h)'],
      ];
      filteredOrders.forEach((o) => {
        const partsCost = o.partsUsed.reduce((sum, p) => sum + p.totalCost, 0);
        rows.push([
          o.orderNumber,
          formatDateTimeBR(o.openedAt),
          o.fleetNumber,
          o.plate,
          o.type,
          o.priority,
          o.status,
          o.laborCost,
          partsCost,
          o.totalCost,
          o.downtimeHours || 0,
        ]);
      });
      exportToCSV('CPLU_Relatorio_Manutencao_OS', rows);
    } else if (reportType === 'movimentacoes') {
      const rows: (string | number)[][] = [
        ['Data/Hora', 'Tipo', 'Código IKKI', 'Material', 'Quantidade', 'Saldo Anterior', 'Novo Saldo', 'Responsável', 'Região'],
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
          m.regionName || '',
        ]);
      });
      exportToCSV('CPLU_Relatorio_Movimentacoes', rows);
    } else if (reportType === 'estoque_critico') {
      const rows: (string | number)[][] = [
        ['Código IKKI', 'Material', 'Categoria', 'Saldo Atual', 'Estoque Mínimo', 'Déficit', 'Localização'],
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            Relatórios Gerenciais CPL LOG
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Análise consolidada de consumo por região, posição físico-financeira de estoque, combustível e manutenção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'consumo_regiao', label: '1. Consumo por Região & Sub-região' },
          { id: 'saldo_geral', label: '2. Saldo Geral de Materiais' },
          { id: 'abastecimento_frota', label: '3. Combustível & Médias km/L' },
          { id: 'manutencao_frota', label: '4. Manutenção & Custos OS' },
          { id: 'movimentacoes', label: '5. Movimentações Auditadas' },
          { id: 'estoque_critico', label: '6. Itens Abaixo do Mínimo' },
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

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
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

          {(reportType === 'consumo_regiao' || reportType === 'movimentacoes') && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Região:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="todos">Todas as Regiões</option>
                {regions.map((rg) => (
                  <option key={rg.id} value={rg.name}>
                    {rg.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(reportType === 'abastecimento_frota' || reportType === 'manutencao_frota') && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Veículo:</span>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="todos">Todos os Veículos</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fleetNumber} ({v.plate})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Canvas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 text-white font-black text-sm px-2 py-0.5 rounded">
                CPLU
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                RELATÓRIO OFICIAL DE GESTÃO INTEGRADA
              </h2>
            </div>
            <p className="text-xs text-slate-500 uppercase font-semibold mt-1">
              {reportType === 'consumo_regiao' && 'Consumo Consolidado por Sub-região (Materiais, EPIs e Insumos)'}
              {reportType === 'saldo_geral' && 'Posição Físico-Estoque e Catálogo Oficial IKKI'}
              {reportType === 'abastecimento_frota' && 'Consumo de Combustível da Frota e Eficiência Energética (km/L)'}
              {reportType === 'manutencao_frota' && 'Ordens de Serviço Mecânica e Consumo de Peças de Reposição'}
              {reportType === 'movimentacoes' && 'Trilha de Movimentações de Entrada e Saída'}
              {reportType === 'estoque_critico' && 'Insumos e Peças com Estoque Abaixo do Mínimo'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            <div className="font-mono text-[10px]">Período: {formatDateBR(startDate)} a {formatDateBR(endDate)}</div>
          </div>
        </div>

        {/* 1. Consumo por Região */}
        {reportType === 'consumo_regiao' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(consumptionByRegion).map((reg) => (
                <div key={reg.regionName} className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      {reg.regionName}
                    </span>
                    <span className="text-xl font-black text-orange-600 font-mono">
                      {formatNumberBR(reg.totalUnits)} un
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {reg.deliveriesCount} saídas registradas
                  </span>
                </div>
              ))}
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Nº Requisição / Carimbo</th>
                  <th className="py-2.5 px-3">Sub-região</th>
                  <th className="py-2.5 px-3">Código Oficial IKKI</th>
                  <th className="py-2.5 px-3">Descrição do Material</th>
                  <th className="py-2.5 px-3 text-center">Quantidade</th>
                  <th className="py-2.5 px-3">Almoxarife</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements
                  .filter((m) => m.type.startsWith('SAIDA_'))
                  .map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                        {formatDateTimeBR(mov.date)}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-orange-700">
                        {mov.stampedNumber ? `Carimbo ${mov.stampedNumber}` : mov.requisitionNumber || 'Saída Direta'}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {mov.regionName || 'Ipiranga'}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-orange-600">
                        {mov.materialCode}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {mov.materialName}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-black text-slate-900 text-sm">
                        {mov.quantity}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{mov.userName}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Saldo Geral */}
        {reportType === 'saldo_geral' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Código Oficial IKKI</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-center">Unidade</th>
                <th className="py-2.5 px-3 text-right">Saldo Físico</th>
                <th className="py-2.5 px-3 text-right">Mínimo</th>
                <th className="py-2.5 px-3">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-orange-700">{m.code}</td>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-900">{m.name}</td>
                  <td className="py-2 px-3 font-sans text-slate-600">{m.category}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{m.unit}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{m.currentStock}</td>
                  <td className="py-2 px-3 text-right text-slate-500">{m.minStock}</td>
                  <td className="py-2 px-3 font-sans text-slate-600">{m.shelf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 3. Abastecimento Frota */}
        {reportType === 'abastecimento_frota' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Volume Total</span>
                <p className="text-lg font-black font-mono mt-0.5">
                  {filteredFuelings.reduce((sum, f) => sum + f.liters, 0).toLocaleString()} Litros
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Gasto Total Combustível</span>
                <p className="text-lg font-black font-mono text-orange-600 mt-0.5">
                  R$ {filteredFuelings.reduce((sum, f) => sum + f.totalCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Total de Abastecimentos</span>
                <p className="text-lg font-black font-mono mt-0.5">{filteredFuelings.length}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Prefixo</th>
                  <th className="py-2.5 px-3">Placa</th>
                  <th className="py-2.5 px-3 text-right">Odômetro (km)</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-3 text-right">Média km/L</th>
                  <th className="py-2.5 px-3 text-right">Valor Total (R$)</th>
                  <th className="py-2.5 px-3">Posto / Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredFuelings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{formatDateTimeBR(f.dateTime)}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{f.fleetNumber}</td>
                    <td className="py-2 px-3 text-slate-600">{f.plate}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{f.odometerKm.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{f.liters} L</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      {f.calculatedKmPerLiter ? `${f.calculatedKmPerLiter} km/L` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      R$ {f.totalCost.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600">{f.stationLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Manutenção Frota */}
        {reportType === 'manutencao_frota' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Custo Total Manutenção</span>
                <p className="text-lg font-black font-mono text-orange-600 mt-0.5">
                  R$ {filteredOrders.reduce((sum, o) => sum + o.totalCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Total de OS Realizadas</span>
                <p className="text-lg font-black font-mono mt-0.5">{filteredOrders.length}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Horas Paradas (Downtime)</span>
                <p className="text-lg font-black font-mono mt-0.5">
                  {filteredOrders.reduce((sum, o) => sum + (o.downtimeHours || 0), 0)} Horas
                </p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nº da OS</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Veículo</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Serviço Executado</th>
                  <th className="py-2.5 px-3 text-right">Peças</th>
                  <th className="py-2.5 px-3 text-right">Mão de Obra</th>
                  <th className="py-2.5 px-3 text-right">Custo Total</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredOrders.map((o) => {
                  const partsCost = o.partsUsed.reduce((sum, p) => sum + p.totalCost, 0);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-2 px-3 text-slate-500">{formatDateBR(o.openedAt.slice(0, 10))}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{o.fleetNumber}</td>
                      <td className="py-2 px-3 font-sans uppercase text-slate-600">{o.type}</td>
                      <td className="py-2 px-3 font-sans text-slate-700 max-w-xs truncate">{o.description}</td>
                      <td className="py-2 px-3 text-right">R$ {partsCost.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">R$ {o.laborCost.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">R$ {o.totalCost.toFixed(2)}</td>
                      <td className="py-2 px-3 font-sans uppercase font-bold text-slate-700">{o.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Movimentações Auditadas */}
        {reportType === 'movimentacoes' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Data/Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Código IKKI</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3 text-center">Quantidade</th>
                <th className="py-2.5 px-3 text-right">Saldo Anterior</th>
                <th className="py-2.5 px-3 text-right">Novo Saldo</th>
                <th className="py-2.5 px-3">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-500">{formatDateTimeBR(m.date)}</td>
                  <td className="py-2 px-3 font-sans font-bold text-slate-800">{m.type}</td>
                  <td className="py-2 px-3 font-bold text-orange-700">{m.materialCode}</td>
                  <td className="py-2 px-3 font-sans text-slate-900">{m.materialName}</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-900">{m.quantity}</td>
                  <td className="py-2 px-3 text-right text-slate-500">{m.previousStock}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{m.newStock}</td>
                  <td className="py-2 px-3 font-sans text-slate-600">{m.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 6. Itens Abaixo do Mínimo */}
        {reportType === 'estoque_critico' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Código IKKI</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                <th className="py-2.5 px-3 text-right">Estoque Mínimo</th>
                <th className="py-2.5 px-3 text-right">Déficit</th>
                <th className="py-2.5 px-3">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {criticalMaterials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 text-rose-700">
                  <td className="py-2 px-3 font-bold">{m.code}</td>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-900">{m.name}</td>
                  <td className="py-2 px-3 font-sans text-slate-600">{m.category}</td>
                  <td className="py-2 px-3 text-right font-black">{m.currentStock}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{m.minStock}</td>
                  <td className="py-2 px-3 text-right font-bold">-{m.minStock - m.currentStock}</td>
                  <td className="py-2 px-3 font-sans text-slate-600">{m.shelf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
