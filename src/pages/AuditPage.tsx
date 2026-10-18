import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Database,
  RefreshCw,
} from 'lucide-react';
import { dbService } from '../services/db';
import { AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeBR, exportToCSV } from '../utils/formatters';

export const AuditPage: React.FC = () => {
  const { role, canViewAuditLogs } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('todos');
  const [selectedRole, setSelectedRole] = useState<string>('todos');

  // Automated Security Test Suite State
  const [testResults, setTestResults] = useState<{
    id: string;
    title: string;
    passed: boolean;
    details: string;
  }[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const loadLogs = () => {
    setLogs(dbService.getAuditLogs());
  };

  useEffect(() => {
    loadLogs();
    const unsub = dbService.subscribe(loadLogs);
    return () => unsub();
  }, []);

  // Run automated live tests against security invariants
  const runSecurityDiagnostics = () => {
    setIsRunningTests(true);
    const results: typeof testResults = [];

    // Test 1: Prevention of duplicate material codes
    const materials = dbService.getMaterials();
    const firstMat = materials[0];
    if (firstMat) {
      const duplicateAttempt = dbService.createMaterial(
        {
          code: firstMat.code,
          name: 'Material Fictício Duplicado',
          description: 'Teste',
          category: 'EPI',
          unit: 'UN',
          currentStock: 10,
          minStock: 5,
          location: 'Galpão Teste',
          shelf: 'PRAT-TEST-01',
          status: 'ativo',
          isEpi: false,
        },
        { id: 'test-user', name: 'Tester', role: 'administrador' }
      );
      results.push({
        id: 'sec-01',
        title: 'Bloqueio de Códigos de Materiais Duplicados',
        passed: !duplicateAttempt.success,
        details: duplicateAttempt.success
          ? 'FALHA: O sistema permitiu criar dois materiais com o mesmo código.'
          : `SUCESSO: Tentativa rejeitada com a mensagem: "${duplicateAttempt.message}"`,
      });
    }

    // Test 2: Prevention of negative stock on exits
    if (firstMat) {
      const exitAttempt = dbService.registerStockMovement({
        materialId: firstMat.id,
        type: 'SAIDA_CONSUMO',
        quantity: firstMat.currentStock + 99999, // Exceed available
        userId: 'test-user',
        userName: 'Tester',
        userRole: 'almoxarife',
        location: firstMat.location,
      });
      results.push({
        id: 'sec-02',
        title: 'Proteção contra Saldo Negativo em Saídas',
        passed: !exitAttempt.success,
        details: exitAttempt.success
          ? 'FALHA: O sistema permitiu saída superior ao saldo disponível.'
          : `SUCESSO: Bloqueado preventivamente: "${exitAttempt.message}"`,
      });
    }

    // Test 3: Obligation of justification on stock adjustments
    if (firstMat) {
      const adjustmentAttempt = dbService.registerStockMovement({
        materialId: firstMat.id,
        type: 'SAIDA_AJUSTE',
        quantity: 1,
        userId: 'test-user',
        userName: 'Tester',
        userRole: 'almoxarife',
        location: firstMat.location,
        justification: '', // Blank justification!
      });
      results.push({
        id: 'sec-03',
        title: 'Exigência de Justificativa em Ajustes de Balanço',
        passed: !adjustmentAttempt.success,
        details: adjustmentAttempt.success
          ? 'FALHA: Ajuste sem justificativa foi aceito.'
          : `SUCESSO: Rejeitado por ausência de justificativa: "${adjustmentAttempt.message}"`,
      });
    }

    // Test 4: Physical deletion block on materials with movement history
    const movs = dbService.getMovements();
    if (movs.length > 0) {
      const movedMatId = movs[0].materialId;
      const deleteAttempt = dbService.deleteMaterial(movedMatId, {
        id: 'test-admin',
        name: 'Admin',
        role: 'administrador',
      });
      results.push({
        id: 'sec-04',
        title: 'Imutabilidade Histórica (Bloqueio de Exclusão Física)',
        passed: !deleteAttempt.success,
        details: deleteAttempt.success
          ? 'FALHA: Material com histórico de movimentações foi excluído fisicamente!'
          : `SUCESSO: Exclusão impedida: "${deleteAttempt.message}"`,
      });
    }

    // Test 5: Requisition delivery over-limit guard
    const reqs = dbService.getRequisitions().filter((r) => r.status === 'pendente' || r.status === 'parcialmente_atendida');
    if (reqs.length > 0) {
      const targetReq = reqs[0];
      const item = targetReq.items[0];
      if (item) {
        const remaining = item.quantityRequested - item.quantityDelivered;
        const overDeliveryAttempt = dbService.fulfillRequisition(
          {
            requisitionId: targetReq.id,
            deliveredItems: [{ itemId: item.id, quantityToDeliver: remaining + 50 }],
          },
          { id: 'test-almo', name: 'Almoxarife Teste', role: 'almoxarife' }
        );
        results.push({
          id: 'sec-05',
          title: 'Prevenção de Entrega Superior ao Solicitado pelo TST',
          passed: !overDeliveryAttempt.success,
          details: overDeliveryAttempt.success
            ? 'FALHA: Foi entregue quantidade superior à autorizada pelo Técnico de Segurança.'
            : `SUCESSO: Bloqueado: "${overDeliveryAttempt.message}"`,
        });
      }
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['ID Log', 'Data/Hora', 'Usuário', 'Perfil', 'Ação', 'Entidade', 'ID Entidade', 'Detalhes', 'Sessão/Origem'],
    ];
    filteredLogs.forEach((l) => {
      rows.push([
        l.id,
        formatDateTimeBR(l.timestamp),
        l.userName,
        l.userRole,
        l.action,
        l.entity,
        l.entityId,
        l.details,
        l.ipOrSession,
      ]);
    });
    exportToCSV(`CPLU_Trilha_Auditoria_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q);

    const matchesEntity = selectedEntity === 'todos' || log.entity === selectedEntity;
    const matchesRole = selectedRole === 'todos' || log.userRole === selectedRole;

    return matchesSearch && matchesEntity && matchesRole;
  });

  if (!canViewAuditLogs) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-800">Acesso Restrito ao Administrador</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          A trilha de auditoria e testes de segurança são confidenciais e exigem privilégios de Administrador Geral. Alterne seu perfil no cabeçalho superior para inspecionar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-600" />
            Trilha de Auditoria & Segurança do Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro imutável de todas as ações, prevenção de fraudes e diagnósticos de integridade
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runSecurityDiagnostics}
            disabled={isRunningTests}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <PlayCircle className="w-4 h-4 text-orange-400" />
            Executar Testes de Segurança
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Auditoria (CSV)
          </button>
        </div>
      </div>

      {/* AUTOMATED SECURITY TEST RESULTS (If run) */}
      {testResults.length > 0 && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm">
                Resultado dos Testes de Segurança & Regras de Acesso
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              {testResults.filter((t) => t.passed).length} de {testResults.length} aprovados
            </span>
          </div>

          <div className="space-y-2">
            {testResults.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-slate-100">{t.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.details}</p>
                  </div>
                </div>
                <span
                  className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                    t.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}
                >
                  {t.passed ? 'APROVADO' : 'REPROVADO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuário, ação (ex: MOVIMENTACAO, ATENDIMENTO) ou detalhes..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Entity filter */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todas as Entidades</option>
            <option value="Material">Material</option>
            <option value="Movement">Movimentação</option>
            <option value="Requisition">Requisição</option>
            <option value="EPIDelivery">Entrega de EPI</option>
            <option value="Employee">Funcionário</option>
            <option value="User">Usuário</option>
            <option value="System">Sistema</option>
          </select>

          {/* Role filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          >
            <option value="todos">Todos os Perfis</option>
            <option value="administrador">Administrador</option>
            <option value="almoxarife">Almoxarife</option>
            <option value="tecnico_seguranca">Técnico de Segurança</option>
            <option value="gestor">Gestor</option>
          </select>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Usuário Responsável</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Ação Auditada</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">Detalhes da Transação</th>
                <th className="py-3 px-4">Sessão / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {formatDateTimeBR(log.timestamp)}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[10px] uppercase">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-orange-700 text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">{log.entity}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-md">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {log.ipOrSession}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LGPD & AUDIT CONSTITUTION CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Conformidade LGPD (Lei 13.709/2018)
          </h4>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            O sistema CPLU adota o princípio de <strong>minimização de dados</strong>. Apenas informações funcionais estritamente necessárias para a gestão do almoxarifado (nome, matrícula, setor e medidas de vestimenta) são armazenadas. Nenhum dado sensível é exposto ou transmitido para serviços de terceiros sem autorização.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-orange-600" />
            Imutabilidade dos Registros
          </h4>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            As movimentações e comprovantes de entrega de EPI são permanentemente auditados. Nenhuma baixa física pode ser apagada; correções são efetuadas exclusivamente por ajustes documentados com justificativa formal, garantindo histórico contínuo para auditorias internas e fiscais do trabalho.
          </p>
        </div>
      </div>
    </div>
  );
};
