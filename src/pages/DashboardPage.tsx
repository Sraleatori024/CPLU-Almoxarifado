import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  PackageX,
  Filter,
  CheckCircle,
  ExternalLink,
  PlusCircle,
  QrCode,
  Sparkles,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Material, Movement, Requisition } from '../types';
import { formatNumberBR, formatDateTimeBR, getMovementTypeLabel } from '../utils/formatters';
import { NavigationTab } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab, targetCode?: string) => void;
  onOpenQRScanner: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenQRScanner }) => {
  const [metrics, setMetrics] = useState(dbService.getSystemMetrics());
  const [movements, setMovements] = useState<Movement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedSector, setSelectedSector] = useState<string>('todos');

  const loadData = () => {
    setMetrics(dbService.getSystemMetrics());
    setMovements(dbService.getMovements().slice(0, 8));
    setMaterials(dbService.getMaterials());
    setRequisitions(dbService.getRequisitions());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // Filter materials for critical stock table
  const filteredCritical = materials
    .filter((m) => m.status === 'ativo' && m.currentStock <= m.minStock)
    .filter((m) => selectedCategory === 'todos' || m.category === selectedCategory);

  // Categories breakdown
  const categoryCounts: Record<string, { count: number; stock: number }> = {};
  materials
    .filter((m) => m.status === 'ativo')
    .forEach((m) => {
      if (!categoryCounts[m.category]) {
        categoryCounts[m.category] = { count: 0, stock: 0 };
      }
      categoryCounts[m.category].count += 1;
      categoryCounts[m.category].stock += m.currentStock;
    });

  // Unique sectors from movements
  const sectors = Array.from(
    new Set(movements.map((m) => m.sector).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Painel Geral do Almoxarifado
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão integrada da operação de limpeza urbana • Estoque, EPIs e Segurança do Trabalho
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <QrCode className="w-4 h-4 text-orange-600" />
            Escanear QR
          </button>
          <button
            onClick={() => onNavigate('movements')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Nova Movimentação
          </button>
        </div>
      </div>

      {/* Interconnected Operations Workflow Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Técnico de Segurança */}
        <div
          onClick={() => onNavigate('tecnico_panel')}
          className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-emerald-700/50 cursor-pointer hover:shadow-md hover:scale-[1.01] transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                    Estação do TST
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-200 transition">
                    Painel do Técnico
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                Nova <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-2.5 line-clamp-2">
              Emita requisições digitais com justificativa técnica, selecione funcionários e acompanhe status em tempo real.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-700/50 flex items-center justify-between text-[11px] text-emerald-200">
            <span>Rastreabilidade NR-6</span>
            <span className="font-semibold text-white group-hover:underline">Acessar &rarr;</span>
          </div>
        </div>

        {/* Card Almoxarifado */}
        <div
          onClick={() => onNavigate('almoxarifado_panel')}
          className="bg-gradient-to-br from-orange-600 to-amber-700 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-orange-500/50 cursor-pointer hover:shadow-md hover:scale-[1.01] transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl border border-white/30">
                  <Boxes className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider block">
                    Estação Almoxarife
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-100 transition">
                    Painel Almoxarifado
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                Fila <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-orange-100/90 mt-2.5 line-clamp-2">
              Receba requisições dos TSTs, confira saldos, efetue baixas parciais/totais e gere comprovantes assinados.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-orange-500/50 flex items-center justify-between text-[11px] text-amber-100">
            <span>Baixa Atômica</span>
            <span className="font-semibold text-white group-hover:underline">Acessar &rarr;</span>
          </div>
        </div>

        {/* Card Consumo por Região */}
        <div
          onClick={() => onNavigate('regional_comparison')}
          className="bg-gradient-to-br from-indigo-700 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-indigo-500/30 cursor-pointer hover:shadow-md hover:scale-[1.01] transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                  <MapPin className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                    Gestão Territorial
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-indigo-200 transition">
                    Consumo por Região
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                Rankings <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-indigo-100/90 mt-2.5 line-clamp-2">
              Compare Paulista, Taquá, Penha e outras regiões. Rankings mensais, vinculação de funcionários e relatórios.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-indigo-700/50 flex items-center justify-between text-[11px] text-indigo-200">
            <span>Paulista • Taquá • Penha</span>
            <span className="font-semibold text-white group-hover:underline">Analisar &rarr;</span>
          </div>
        </div>

        {/* Card Sincronização Excel */}
        <div
          onClick={() => onNavigate('excel_sync')}
          className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-teal-500/30 cursor-pointer hover:shadow-md hover:scale-[1.01] transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                    Integração de Planilhas
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-200 transition">
                    Sincronização Excel
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                SheetJS <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-2.5 line-clamp-2">
              Leitura automática de abas, colunas, códigos e saldos. Exportação com fórmulas preservadas e histórico.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-teal-700/50 flex items-center justify-between text-[11px] text-emerald-200">
            <span>OneDrive / Drive / Local</span>
            <span className="font-semibold text-white group-hover:underline">Integrar &rarr;</span>
          </div>
        </div>
      </div>

      {/* Real-time Critical Stock Alert Banner */}
      {metrics.criticalZeroStockCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between gap-4 shadow-2xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl">
              <PackageX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-950">
                Alerta Crítico: {metrics.criticalZeroStockCount} item(ns) totalmente ESGOTADO(S)!
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Existem insumos de limpeza urbana com saldo zero físico nas prateleiras. Risco iminente de paralisação de frentes operacionais.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('materials')}
            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shrink-0 transition"
          >
            Verificar Materiais
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Saldo Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Saldo em Estoque
            </span>
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatNumberBR(metrics.totalUnits)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">unidades armazenadas</p>
        </div>

        {/* Card 2: Materiais Ativos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Itens Cadastrados
            </span>
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {metrics.registeredMaterialsCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">itens ativos no catálogo</p>
        </div>

        {/* Card 3: Abaixo do Mínimo */}
        <div
          onClick={() => onNavigate('materials')}
          className="bg-white p-4 rounded-2xl border border-rose-200 hover:border-rose-300 shadow-2xs cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Estoque Crítico
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {metrics.belowMinStockCount}
          </div>
          <p className="text-[10px] text-rose-500 mt-1">itens abaixo da cota mínima</p>
        </div>

        {/* Card 4: Requisições Pendentes */}
        <div
          onClick={() => onNavigate('fulfillment')}
          className="bg-white p-4 rounded-2xl border border-amber-200 hover:border-amber-300 shadow-2xs cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Req. Pendentes
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {metrics.pendingRequisitionsCount}
          </div>
          <p className="text-[10px] text-amber-600 mt-1">aguardando almoxarife</p>
        </div>

        {/* Card 5: Entradas do Período */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Entradas
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            +{formatNumberBR(metrics.totalEntriesQty)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">em {metrics.totalEntriesCount} recebimentos</p>
        </div>

        {/* Card 6: Saídas e EPIs Entregues */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              EPIs Entregues
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">
            {formatNumberBR(metrics.totalEpiDelivered)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">com recibo eletrônico NR-6</p>
        </div>
      </div>

      {/* PAINEL DE CONTROLE DE ESTOQUE CRÍTICO EM TEMPO REAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Painel de Controle de Estoque Crítico em Tempo Real
              </h3>
              <p className="text-[11px] text-slate-500">
                Monitoramento dinâmico de suprimentos vitais para a limpeza pública
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
            >
              <option value="todos">Todas as Categorias</option>
              {Object.keys(categoryCounts).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCritical.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              Nenhum item com estoque abaixo da cota mínima nesta seleção.
            </p>
            <p className="text-[11px] text-slate-400">
              Todos os materiais monitorados atendem aos níveis de segurança operacional.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Material / Insumo</th>
                  <th className="py-2.5 px-4">Localização / Prateleira</th>
                  <th className="py-2.5 px-4 text-center">Saldo Atual</th>
                  <th className="py-2.5 px-4 text-center">Estoque Mínimo</th>
                  <th className="py-2.5 px-4">Nível de Alerta</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCritical.map((mat) => {
                  const percentOfMin = Math.round((mat.currentStock / mat.minStock) * 100);
                  const isZero = mat.currentStock === 0;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-orange-700">
                        {mat.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{mat.name}</div>
                        <span className="text-[10px] text-slate-500">
                          {mat.category} {mat.caNumber ? `• CA: ${mat.caNumber}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {mat.shelf}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        <span className={isZero ? 'text-rose-600' : 'text-amber-600'}>
                          {mat.currentStock} {mat.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {mat.minStock} {mat.unit}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-semibold mb-1">
                            <span className={isZero ? 'text-rose-600 font-bold' : 'text-amber-700'}>
                              {isZero ? 'ESGOTADO (0%)' : `${percentOfMin}% da cota`}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isZero ? 'bg-rose-600 w-full' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, percentOfMin)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigate('movements')}
                          className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-semibold transition"
                        >
                          Repor Estoque
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Movimentações Recentes & Visão Geral por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Movimentações Recentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Últimas Movimentações Auditadas</h3>
              <p className="text-[11px] text-slate-500">
                Entradas por compra, entregas de EPI e consumos operacionais
              </p>
            </div>
            <button
              onClick={() => onNavigate('movements')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              Ver todas <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {movements.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nenhuma movimentação registrada até o momento.
              </div>
            ) : (
              movements.map((mov) => {
                const typeInfo = getMovementTypeLabel(mov.type);
                return (
                  <div key={mov.id} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          typeInfo.isEntry
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {typeInfo.isEntry ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{mov.materialName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Resp: {mov.userName}</span>
                          {mov.employeeName && <span>• Destinatário: {mov.employeeName}</span>}
                          <span>• {formatDateTimeBR(mov.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-black text-sm ${
                          typeInfo.isEntry ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {typeInfo.isEntry ? '+' : '-'}
                        {mov.quantity}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Saldo: {mov.previousStock} → {mov.newStock}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1 col): Categorias de Materiais & Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Distribuição do Catálogo</h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Estoque agrupado por categorias de limpeza urbana
            </p>

            <div className="space-y-3">
              {Object.entries(categoryCounts).map(([cat, data]) => {
                const percent = metrics.totalUnits > 0 ? Math.round((data.stock / metrics.totalUnits) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat}</span>
                      <span className="font-mono text-slate-500">
                        {data.stock} un. ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="mt-6 pt-4 border-t border-slate-200 bg-orange-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <h4 className="text-xs font-bold text-orange-950 mb-1">Rotina Recomendada CPLU</h4>
            <p className="text-[11px] text-orange-800 leading-relaxed mb-3">
              Verifique as requisições pendentes do Técnico de Segurança antes do início dos turnos matutino e vespertino para agilizar a liberação das equipes.
            </p>
            <button
              onClick={() => onNavigate('fulfillment')}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Ir para Balcão de Atendimento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
