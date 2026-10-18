import React, { useState, useEffect } from 'react';
import {
  FileBadge2,
  Search,
  Printer,
  Download,
  Calendar,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { dbService } from '../services/db';
import { EPIDelivery, Employee } from '../types';
import { formatDateTimeBR, formatDateBR, exportToCSV } from '../utils/formatters';
import { PrintableEPIReceipt } from '../components/common/PrintableEPIReceipt';

interface EPIHistoryPageProps {
  initialSearchMatricula?: string;
}

export const EPIHistoryPage: React.FC<EPIHistoryPageProps> = ({
  initialSearchMatricula,
}) => {
  const [deliveries, setDeliveries] = useState<EPIDelivery[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState(initialSearchMatricula || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('todos');

  // Modal for reprint
  const [receiptToReprint, setReceiptToReprint] = useState<EPIDelivery | null>(null);

  const loadData = () => {
    setDeliveries(dbService.getEPIDeliveries());
    setEmployees(dbService.getEmployees());
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSearchMatricula) {
      setSearch(initialSearchMatricula);
      const emp = dbService.getEmployeeByMatricula(initialSearchMatricula);
      if (emp) setSelectedEmployeeId(emp.id);
    }
  }, [initialSearchMatricula]);

  // CSV Export
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      [
        'ID Entrega',
        'Nº Requisição',
        'Data/Hora Entrega',
        'Colaborador',
        'Matrícula',
        'Setor',
        'Almoxarife Responsável',
        'Código EPI',
        'Descrição EPI',
        'CA (MTE)',
        'Quantidade',
        'Unidade',
        'Possui Assinatura',
      ],
    ];

    filteredDeliveries.forEach((del) => {
      del.items.forEach((item) => {
        rows.push([
          del.id,
          del.requisitionNumber,
          formatDateTimeBR(del.date),
          del.employeeName,
          del.employeeMatricula,
          del.sector,
          del.deliveredByName,
          item.materialCode,
          item.materialName,
          item.caNumber || 'N/A',
          item.quantity,
          item.unit,
          del.signatureDataUrl ? 'SIM' : 'NÃO',
        ]);
      });
    });

    exportToCSV(`CPLU_Historico_Entregas_EPI_NR6_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((del) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      del.requisitionNumber.toLowerCase().includes(q) ||
      del.employeeName.toLowerCase().includes(q) ||
      del.employeeMatricula.toLowerCase().includes(q) ||
      del.items.some((i) => i.materialName.toLowerCase().includes(q) || i.materialCode.toLowerCase().includes(q));

    const matchesEmployee =
      selectedEmployeeId === 'todos' || del.employeeId === selectedEmployeeId;

    return matchesSearch && matchesEmployee;
  });

  // Calculate stats
  const totalDeliveredItems = filteredDeliveries.reduce((sum, d) => {
    return sum + d.items.reduce((acc, it) => acc + it.quantity, 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileBadge2 className="w-6 h-6 text-orange-600" />
            Histórico Individual de EPIs (NR-6 / MTE)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rastreabilidade de equipamentos entregues por colaborador, certificados de aprovação e termos assinados
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Histórico (CSV)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Termos de Entrega Registrados
          </span>
          <div className="text-2xl font-black text-slate-900">{filteredDeliveries.length}</div>
          <span className="text-[10px] text-slate-400">comprovantes eletrônicos</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Volume de EPIs Fornecidos
          </span>
          <div className="text-2xl font-black text-orange-600">{totalDeliveredItems}</div>
          <span className="text-[10px] text-slate-400">unidades/pares entregues</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Conformidade NR-6
          </span>
          <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Assinatura Digital & CA Registrados
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Rastreamento para fiscalização trabalhista</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por matrícula, nome do colaborador, material ou CA..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Employee Select */}
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todos os Colaboradores</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.matricula} - {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deliveries Timeline / Cards */}
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
            <FileBadge2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Nenhum registro de entrega de EPI localizado.</p>
          </div>
        ) : (
          filteredDeliveries.map((del) => (
            <div
              key={del.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden hover:border-orange-200 transition"
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-black font-mono text-sm shrink-0">
                    EPI
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{del.employeeName}</span>
                      <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {del.employeeMatricula}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Setor: {del.sector} • Req: {del.requisitionNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px]">Entregue em:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatDateTimeBR(del.date)}
                    </span>
                  </div>
                  <button
                    onClick={() => setReceiptToReprint(del)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Reimprimir Termo NR-6
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="pb-2">Código</th>
                      <th className="pb-2">Equipamento de Proteção</th>
                      <th className="pb-2 text-center">Nº CA (MTE)</th>
                      <th className="pb-2 text-center">Quantidade</th>
                      <th className="pb-2 text-right">Almoxarife Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {del.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono font-bold text-orange-700">
                          {it.materialCode}
                        </td>
                        <td className="py-2.5 font-bold text-slate-800">{it.materialName}</td>
                        <td className="py-2.5 text-center font-mono font-semibold">
                          {it.caNumber ? (
                            <span className="bg-orange-50 text-orange-800 px-2 py-0.5 rounded border border-orange-200">
                              CA: {it.caNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center font-mono font-black text-slate-900">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2.5 text-right text-slate-600 font-medium">
                          {del.deliveredByName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signature status stamp */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {del.signatureDataUrl ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Assinatura Eletrônica Capturada
                      </span>
                    ) : (
                      <span className="text-slate-400">Assinatura no formulário físico</span>
                    )}
                  </div>
                  <span className="font-mono text-slate-400">ID: {del.id}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PRINTABLE RECEIPT MODAL */}
      {receiptToReprint && (
        <PrintableEPIReceipt
          delivery={receiptToReprint}
          onClose={() => setReceiptToReprint(null)}
        />
      )}
    </div>
  );
};
