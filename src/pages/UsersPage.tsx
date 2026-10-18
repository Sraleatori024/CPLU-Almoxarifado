import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Search,
  CheckCircle2,
  Lock,
  Edit2,
  Power,
  X,
  Users,
  AlertTriangle,
  Mail,
  BadgeCheck,
} from 'lucide-react';
import { dbService } from '../services/db';
import { User, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeBR } from '../utils/formatters';

export const UsersPage: React.FC = () => {
  const { currentUser, role, loginAs, canManageUsers } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('almoxarife');
  const [formMatricula, setFormMatricula] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Status and feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setUsers(dbService.getUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('almoxarife');
    setFormMatricula(`USR-${Math.floor(100 + Math.random() * 900)}`);
    setFormActive(true);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormMatricula(user.matricula);
    setFormActive(user.active);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (targetUser: User) => {
    if (!currentUser) return;
    const res = dbService.toggleUserStatus(targetUser.id, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formName.trim() || !formEmail.trim() || !formMatricula.trim()) return;

    if (editingUser) {
      const res = dbService.updateUser(
        editingUser.id,
        {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          matricula: formMatricula.trim().toUpperCase(),
          active: formActive,
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );

      if (!res.success) {
        setFeedback({ type: 'error', message: res.message });
        return;
      }

      setFeedback({ type: 'success', message: res.message });
    } else {
      const res = dbService.createUser(
        {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          matricula: formMatricula.trim().toUpperCase(),
          active: formActive,
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );

      if (!res.success) {
        setFeedback({ type: 'error', message: res.message });
        return;
      }

      setFeedback({ type: 'success', message: res.message });
    }

    loadData();
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.matricula.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const permissionsMatrix: {
    permission: string;
    admin: boolean;
    almoxarife: boolean;
    tst: boolean;
    gestor: boolean;
  }[] = [
    { permission: 'Visualizar Dashboard e Saldo de Estoque', admin: true, almoxarife: true, tst: true, gestor: true },
    { permission: 'Registrar Entradas de Materiais (Compras/NF-e)', admin: true, almoxarife: true, tst: false, gestor: false },
    { permission: 'Atender Requisições & Entregar EPIs (NR-6)', admin: true, almoxarife: true, tst: false, gestor: false },
    { permission: 'Cadastrar e Emitir Requisições Digitais de EPI', admin: true, almoxarife: false, tst: true, gestor: false },
    { permission: 'Cadastrar Funcionários da Limpeza Urbana', admin: true, almoxarife: false, tst: true, gestor: false },
    { permission: 'Ajuste de Balanço com Justificativa', admin: true, almoxarife: true, tst: false, gestor: false },
    { permission: 'Gerar e Imprimir Etiquetas com QR Code', admin: true, almoxarife: true, tst: true, gestor: false },
    { permission: 'Acessar Trilha Imutável de Auditoria', admin: true, almoxarife: false, tst: false, gestor: false },
    { permission: 'Gerenciamento de Usuários e Permissões', admin: true, almoxarife: false, tst: false, gestor: false },
    { permission: 'Limpeza e Reset do Banco de Demonstração', admin: true, almoxarife: false, tst: false, gestor: false },
  ];

  if (!canManageUsers) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-800">Acesso Restrito ao Administrador</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          O gerenciamento de contas de usuário e controle de acessos é exclusivo do perfil Administrador Geral. Alterne seu perfil no cabeçalho superior para acessar.
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
            <UserCheck className="w-6 h-6 text-orange-600" />
            Controle de Usuários & Perfis de Acesso
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão dos 4 perfis operacionais (Administrador, Almoxarife, TST e Gestor) com controle RBAC
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
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
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário por nome, e-mail corporativo ou matrícula..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 shrink-0">
          Total: {filteredUsers.length} usuário(s)
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">E-mail Corporativo</th>
                <th className="py-3 px-4">Matrícula</th>
                <th className="py-3 px-4">Perfil / Atribuição</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum usuário encontrado com os termos pesquisados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] text-orange-600 font-bold">(Você)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 font-mono font-bold text-orange-700">{u.matricula}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold text-[10px] uppercase border border-slate-200">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.active ? 'ATIVO' : 'BLOQUEADO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Editar Usuário"
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.active ? 'Bloquear Acesso' : 'Ativar Usuário'}
                          className={`p-1.5 rounded-lg transition disabled:opacity-30 ${
                            u.active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => loginAs(u.role)}
                          className="px-2 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          Simular Sessão
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC PERMISSIONS MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5">
        <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-orange-600" />
          Matriz de Autorizações e Permissões (RBAC)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Regras de validação aplicadas tanto na interface visual quanto na camada de persistência
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Funcionalidade / Operação</th>
                <th className="py-2.5 px-3 text-center">Administrador</th>
                <th className="py-2.5 px-3 text-center">Almoxarife</th>
                <th className="py-2.5 px-3 text-center">Técnico Seg. (TST)</th>
                <th className="py-2.5 px-3 text-center">Gestor / Consulta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-medium text-slate-800">{row.permission}</td>
                  <td className="py-2.5 px-3 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.almoxarife ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.tst ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.gestor ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Nome do operador"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  placeholder="usuario@cplu.gov.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Perfil de Acesso *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="administrador">Administrador</option>
                    <option value="almoxarife">Almoxarife</option>
                    <option value="tecnico_seguranca">Técnico de Segurança</option>
                    <option value="gestor">Gestor / Consulta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Identificação / Matrícula</label>
                  <input
                    type="text"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <span>Usuário Ativo (Permitir acesso ao sistema)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
