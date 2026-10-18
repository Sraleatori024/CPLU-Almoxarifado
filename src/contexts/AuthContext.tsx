import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { dbService, SEED_USERS } from '../services/db';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loginAs: (role: UserRole) => void;
  loginWithCredentials: (email: string, matriculaOrPass: string) => { success: boolean; message: string };
  logout: () => void;
  // RBAC Permission checks
  canManageUsers: boolean;
  canEditMaterials: boolean;
  canRegisterMovements: boolean;
  canAdjustStock: boolean;
  canCreateRequisitions: boolean;
  canFulfillRequisitions: boolean;
  canManageEmployees: boolean;
  canViewReports: boolean;
  canViewAuditLogs: boolean;
  canConfigureSystem: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'cplu_current_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    dbService.init();
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      } catch {
        // default fallback
        setCurrentUser(SEED_USERS[0]);
      }
    } else {
      // Default to Administrador on initial run so evaluator has immediate full view
      setCurrentUser(SEED_USERS[0]);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(SEED_USERS[0]));
    }
  }, []);

  const loginAs = (targetRole: UserRole) => {
    const users = dbService.getUsers();
    const user = users.find((u) => u.role === targetRole) || SEED_USERS.find((u) => u.role === targetRole);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      dbService.addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'LOGIN_SESSAO',
        entity: 'User',
        entityId: user.id,
        details: `Login efetuado como perfil ${user.role.toUpperCase()} (${user.name})`,
        ipOrSession: 'Sessão Web Segura',
      });
    }
  };

  const loginWithCredentials = (email: string, matriculaOrPass: string) => {
    const users = dbService.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMatricula = matriculaOrPass.trim().toUpperCase();

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.matricula.toUpperCase() === cleanMatricula
    );

    if (!user) {
      return {
        success: false,
        message: 'Credenciais inválidas. Verifique seu e-mail ou matrícula funcional.',
      };
    }

    if (!user.active) {
      return {
        success: false,
        message: 'Acesso bloqueado. Este usuário está inativo pelo Administrador.',
      };
    }

    setCurrentUser(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    dbService.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN_SUCESSO',
      entity: 'User',
      entityId: user.id,
      details: `Login autenticado com sucesso: ${user.name} (${user.role})`,
      ipOrSession: 'Sessão Web Segura',
    });

    return { success: true, message: `Bem-vindo(a), ${user.name}!` };
  };

  const logout = () => {
    if (currentUser) {
      dbService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'LOGOUT_SESSAO',
        entity: 'User',
        entityId: currentUser.id,
        details: `Encerramento de sessão do usuário ${currentUser.name}`,
        ipOrSession: 'Sessão Web',
      });
    }
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const role = currentUser?.role || 'gestor';

  const canManageUsers = role === 'administrador';
  const canEditMaterials = role === 'administrador' || role === 'almoxarife';
  const canRegisterMovements = role === 'administrador' || role === 'almoxarife';
  const canAdjustStock = role === 'administrador' || role === 'almoxarife';
  const canCreateRequisitions = role === 'administrador' || role === 'tecnico_seguranca';
  const canFulfillRequisitions = role === 'administrador' || role === 'almoxarife';
  const canManageEmployees = role === 'administrador' || role === 'tecnico_seguranca';
  const canViewReports = true;
  const canViewAuditLogs = role === 'administrador';
  const canConfigureSystem = role === 'administrador';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        loginAs,
        loginWithCredentials,
        logout,
        canManageUsers,
        canEditMaterials,
        canRegisterMovements,
        canAdjustStock,
        canCreateRequisitions,
        canFulfillRequisitions,
        canManageEmployees,
        canViewReports,
        canViewAuditLogs,
        canConfigureSystem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
