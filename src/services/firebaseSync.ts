import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import { dbService } from './db';
import { Material, Employee, Requisition, Movement, EPIDelivery, AuditLog } from '../types';

export interface FirebaseSyncStatus {
  lastSyncTime: string | null;
  syncedMaterialsCount: number;
  syncedEmployeesCount: number;
  syncedRequisitionsCount: number;
  syncedMovementsCount: number;
  isOnline: boolean;
  statusMessage: string;
}

const SYNC_STATUS_KEY = 'cplu_firebase_sync_status_v1';

export const firebaseSyncService = {
  getSyncStatus(): FirebaseSyncStatus {
    const raw = localStorage.getItem(SYNC_STATUS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return {
      lastSyncTime: null,
      syncedMaterialsCount: 0,
      syncedEmployeesCount: 0,
      syncedRequisitionsCount: 0,
      syncedMovementsCount: 0,
      isOnline: true,
      statusMessage: 'Pronto para sincronização com Firestore (Projeto: cplu-almxarifado).',
    };
  },

  saveSyncStatus(status: FirebaseSyncStatus): void {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  },

  /**
   * Pushes all current warehouse data to the user's Firestore cloud database
   */
  async pushAllToFirestore(user: { id: string; name: string; role: any }): Promise<{
    success: boolean;
    message: string;
    details: { materials: number; employees: number; requisitions: number; movements: number };
  }> {
    try {
      const isConnected = await testFirestoreConnection();
      if (!isConnected) {
        return {
          success: false,
          message: 'Não foi possível conectar ao Firestore. Verifique a conexão com a internet ou o console Firebase.',
          details: { materials: 0, employees: 0, requisitions: 0, movements: 0 },
        };
      }

      const materials = dbService.getMaterials();
      const employees = dbService.getEmployees();
      const requisitions = dbService.getRequisitions();
      const movements = dbService.getMovements();

      // 1. Sync Materials in batches (max 500 ops per batch)
      let matBatch = writeBatch(db);
      let opCount = 0;
      let totalMats = 0;

      for (const mat of materials) {
        const ref = doc(db, 'materials', mat.id);
        matBatch.set(ref, {
          ...mat,
          syncedAt: new Date().toISOString(),
          syncedBy: user.name,
        }, { merge: true });
        opCount++;
        totalMats++;

        if (opCount >= 400) {
          await matBatch.commit();
          matBatch = writeBatch(db);
          opCount = 0;
        }
      }
      if (opCount > 0) {
        await matBatch.commit();
      }

      // 2. Sync Employees
      let empBatch = writeBatch(db);
      opCount = 0;
      let totalEmps = 0;
      for (const emp of employees) {
        const ref = doc(db, 'employees', emp.id);
        empBatch.set(ref, {
          ...emp,
          syncedAt: new Date().toISOString(),
        }, { merge: true });
        opCount++;
        totalEmps++;
        if (opCount >= 400) {
          await empBatch.commit();
          empBatch = writeBatch(db);
          opCount = 0;
        }
      }
      if (opCount > 0) {
        await empBatch.commit();
      }

      // 3. Sync Requisitions
      let reqBatch = writeBatch(db);
      opCount = 0;
      let totalReqs = 0;
      for (const req of requisitions) {
        const ref = doc(db, 'requisitions', req.id);
        reqBatch.set(ref, {
          ...req,
          syncedAt: new Date().toISOString(),
        }, { merge: true });
        opCount++;
        totalReqs++;
        if (opCount >= 400) {
          await reqBatch.commit();
          reqBatch = writeBatch(db);
          opCount = 0;
        }
      }
      if (opCount > 0) {
        await reqBatch.commit();
      }

      // 4. Sync Movements (last 200 to keep within quick sync quota)
      let movBatch = writeBatch(db);
      opCount = 0;
      let totalMovs = 0;
      for (const mov of movements.slice(0, 200)) {
        const ref = doc(db, 'movements', mov.id);
        movBatch.set(ref, {
          ...mov,
          syncedAt: new Date().toISOString(),
        }, { merge: true });
        opCount++;
        totalMovs++;
        if (opCount >= 400) {
          await movBatch.commit();
          movBatch = writeBatch(db);
          opCount = 0;
        }
      }
      if (opCount > 0) {
        await movBatch.commit();
      }

      const syncResult: FirebaseSyncStatus = {
        lastSyncTime: new Date().toISOString(),
        syncedMaterialsCount: totalMats,
        syncedEmployeesCount: totalEmps,
        syncedRequisitionsCount: totalReqs,
        syncedMovementsCount: totalMovs,
        isOnline: true,
        statusMessage: `Sincronização com Cloud Firestore concluída com sucesso! ${totalMats} materiais, ${totalEmps} colaboradores, ${totalReqs} requisições e ${totalMovs} movimentações enviadas para o projeto "cplu-almxarifado".`,
      };

      this.saveSyncStatus(syncResult);

      dbService.addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'EXPORTAR_FIRESTORE',
        entity: 'System',
        entityId: 'cplu-almxarifado',
        details: `Sincronização completa de dados para o Cloud Firestore (Projeto: cplu-almxarifado). ${totalMats} materiais, ${totalEmps} colaboradores, ${totalReqs} requisições.`,
        ipOrSession: 'Sessão Web Segura',
      });

      return {
        success: true,
        message: `Sincronização concluída com sucesso para o Cloud Firestore (${totalMats} materiais, ${totalEmps} funcionários, ${totalReqs} requisições)!`,
        details: { materials: totalMats, employees: totalEmps, requisitions: totalReqs, movements: totalMovs },
      };
    } catch (error: any) {
      console.error('Erro na sincronização Firestore:', error);
      return {
        success: false,
        message: 'Erro durante a sincronização com o Firestore: ' + (error?.message || String(error)),
        details: { materials: 0, employees: 0, requisitions: 0, movements: 0 },
      };
    }
  },

  /**
   * Pulls data from Cloud Firestore into the local database
   */
  async pullAllFromFirestore(user: { id: string; name: string; role: any }): Promise<{
    success: boolean;
    message: string;
    details: { materials: number; employees: number; requisitions: number };
  }> {
    try {
      const matSnap = await getDocs(collection(db, 'materials'));
      const empSnap = await getDocs(collection(db, 'employees'));
      const reqSnap = await getDocs(collection(db, 'requisitions'));

      let matsImported = 0;
      let empsImported = 0;
      let reqsImported = 0;

      if (!matSnap.empty) {
        const cloudMaterials: Material[] = [];
        matSnap.forEach((d) => {
          cloudMaterials.push(d.data() as Material);
        });
        if (cloudMaterials.length > 0) {
          localStorage.setItem('cplu_materials_v1', JSON.stringify(cloudMaterials));
          matsImported = cloudMaterials.length;
        }
      }

      if (!empSnap.empty) {
        const cloudEmployees: Employee[] = [];
        empSnap.forEach((d) => {
          cloudEmployees.push(d.data() as Employee);
        });
        if (cloudEmployees.length > 0) {
          localStorage.setItem('cplu_employees_v1', JSON.stringify(cloudEmployees));
          empsImported = cloudEmployees.length;
        }
      }

      if (!reqSnap.empty) {
        const cloudRequisitions: Requisition[] = [];
        reqSnap.forEach((d) => {
          cloudRequisitions.push(d.data() as Requisition);
        });
        if (cloudRequisitions.length > 0) {
          localStorage.setItem('cplu_requisitions_v1', JSON.stringify(cloudRequisitions));
          reqsImported = cloudRequisitions.length;
        }
      }

      const syncResult: FirebaseSyncStatus = {
        lastSyncTime: new Date().toISOString(),
        syncedMaterialsCount: matsImported,
        syncedEmployeesCount: empsImported,
        syncedRequisitionsCount: reqsImported,
        syncedMovementsCount: 0,
        isOnline: true,
        statusMessage: `Download do Cloud Firestore concluído. ${matsImported} materiais, ${empsImported} colaboradores e ${reqsImported} requisições atualizados na base local.`,
      };

      this.saveSyncStatus(syncResult);

      return {
        success: true,
        message: `Dados baixados do Firestore com sucesso! ${matsImported} materiais, ${empsImported} colaboradores e ${reqsImported} requisições atualizados.`,
        details: { materials: matsImported, employees: empsImported, requisitions: reqsImported },
      };
    } catch (error: any) {
      console.error('Erro ao baixar dados do Firestore:', error);
      return {
        success: false,
        message: 'Erro ao baixar dados do Firestore: ' + (error?.message || String(error)),
        details: { materials: 0, employees: 0, requisitions: 0 },
      };
    }
  },
};
