export type UserRole = 'administrador' | 'almoxarife' | 'tecnico_seguranca' | 'gestor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  matricula: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
}

export type MaterialCategory =
  | 'EPI'
  | 'Ferramental'
  | 'Uniformes'
  | 'Químicos & Limpeza'
  | 'Sinalização'
  | 'Consumíveis'
  | 'Manutenção';

export type UnitOfMeasure = 'UN' | 'PAR' | 'CX' | 'KG' | 'LT' | 'PCT' | 'M';

export interface MaterialPhysicalLocation {
  id: string;
  aisle: string; // Corredor (ex: "Corredor 1" ou "1")
  shelf: string; // Prateleira (ex: "Prateleira 3" ou "3")
  level: string; // Nível ou andar (ex: "Nível 2" ou "2")
  quantity: number; // Quantidade armazenada naquele local
  updatedAt?: string;
}

export interface Material {
  id: string;
  code: string; // Código oficial IKKI (preservando zeros à esquerda, ex: "001420", "EPI-LUV-01")
  ikkiCode?: string; // Código IKKI oficial explícito
  name: string;
  description: string;
  category: MaterialCategory;
  unit: UnitOfMeasure;
  currentStock: number;
  minStock: number;
  location: string; // e.g. "Galpão A - Almoxarifado Central"
  shelf: string; // e.g. "PRAT-EPI-01" ou resumo da localização principal
  physicalLocations?: MaterialPhysicalLocation[]; // Controle de múltiplos locais físicos com quantidade por local
  status: 'ativo' | 'inativo';
  supplier?: string;
  isEpi: boolean;
  caNumber?: string; // Certificado de Aprovação do MTE
  validityMonths?: number;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'ENTRADA_COMPRA'
  | 'ENTRADA_RECEBIMENTO'
  | 'ENTRADA_DEVOLUCAO'
  | 'ENTRADA_AJUSTE'
  | 'SAIDA_REQUISICAO'
  | 'SAIDA_CONSUMO'
  | 'SAIDA_TRANSFERENCIA'
  | 'SAIDA_AJUSTE'
  | 'TRANSFERENCIA_LOCAL'; // Reorganização física entre corredores/prateleiras sem alterar saldo total

export interface Movement {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  location: string;
  sector?: string;
  employeeId?: string;
  employeeName?: string;
  employeeMatricula?: string;
  regionId?: string;
  regionName?: string;
  requisitionId?: string;
  requisitionNumber?: string;
  stampedNumber?: string; // Número oficial carimbado no almoxarifado (ex: "19-47")
  idempotencyKey?: string;
  observation?: string;
  justification?: string;
  invoiceNumber?: string; // Nota Fiscal (quando aplicável)
  supplier?: string; // Fornecedor / Empresa
  receivedDate?: string; // Data de recebimento informada
  sourceLocation?: string; // Localização de origem na transferência física
  targetLocation?: string; // Localização de destino na transferência física
}

export type EmployeeStatus = 'ativo' | 'afastado' | 'ferias' | 'desligado';

export interface Region {
  id: string;
  code: string; // e.g. "REG-PLT", "REG-TQA", "REG-PNH", "REG-IPR"
  name: string; // "Paulista", "Taquá", "Penha", "Ipiranga"
  supervisor?: string;
  active: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  matricula: string;
  name: string;
  sector: string; // e.g. "Varrição Central", "Coleta Domiciliar", "Capina & Roçagem"
  role: string; // e.g. "Gari / Agente de Limpeza", "Motorista Coletor", "Operador de Roçadeira"
  regionId?: string;
  regionName?: string;
  status: EmployeeStatus;
  shoeSize?: string;
  gloveSize?: string;
  uniformSize?: string;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
}

export type RequisitionStatus =
  | 'rascunho'
  | 'enviada'
  | 'pendente'
  | 'parcialmente_atendida'
  | 'atendida'
  | 'cancelada'
  | 'rejeitada';

export type RequisitionPriority = 'baixa' | 'normal' | 'alta' | 'critica';

export interface RequisitionItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: UnitOfMeasure;
  isEpi: boolean;
  caNumber?: string;
  quantityRequested: number;
  quantityDelivered: number;
  status: 'pendente' | 'parcial' | 'entregue' | 'cancelado';
}

export interface Requisition {
  id: string;
  number: string; // e.g. "REQ-2026-0042"
  stampedNumber?: string; // Número oficial carimbado no almoxarifado em papel (ex: "19-47")
  stampedAt?: string; // Data e hora em que o número foi registrado
  stampedBy?: string; // Nome do almoxarife que registrou o carimbo
  stampedByUserId?: string;
  regionName: string; // Região solicitante obrigatória (ex: "Ipiranga")
  regionId?: string;
  employeeId?: string; // Opcional - desvinculado do consumo obrigatório
  employeeName?: string;
  employeeMatricula?: string;
  sector?: string;
  status: RequisitionStatus;
  priority: RequisitionPriority;
  justification: string;
  observations?: string;
  rejectionReason?: string;
  requestedByUserId: string;
  requestedByName: string; // Nome do Técnico de Segurança que criou a requisição
  requestedByMatricula?: string;
  sentAt?: string;
  isNewNotification?: boolean;
  items: RequisitionItem[];
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
}

export interface EPIDelivery {
  id: string;
  requisitionId: string;
  requisitionNumber: string;
  stampedNumber?: string; // Número oficial carimbado
  employeeId?: string;
  employeeName?: string;
  employeeMatricula?: string;
  sector?: string;
  regionId?: string;
  regionName?: string;
  deliveredByUserId: string;
  deliveredByName: string;
  signatureDataUrl?: string;
  date: string;
  items: {
    materialId: string;
    materialCode: string;
    materialName: string;
    caNumber?: string;
    quantity: number;
    unit: string;
  }[];
  observations?: string;
}

export interface ShelfLocation {
  id: string;
  code: string; // e.g. "PRAT-A1-01"
  zone: string; // "Galpão A", "Galpão B", "Área de EPIs"
  aisle: string; // "Corredor 1"
  shelfLevel: string; // "Nível 1 (Chão)", "Nível 2", "Nível 3"
  capacity: number;
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: 'Material' | 'Movement' | 'Employee' | 'Requisition' | 'EPIDelivery' | 'User' | 'System';
  entityId: string;
  details: string;
  ipOrSession: string;
}

export interface SystemAlert {
  id: string;
  type: 'CRITICAL_STOCK' | 'OUT_OF_STOCK' | 'PENDING_REQ' | 'PARTIAL_REQ' | 'SECURITY_VIOLATION';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  date: string;
  resolved: boolean;
  link?: string;
}

export interface StorageStatus {
  source: 'local_storage' | 'firestore';
  connected: boolean;
  isDemoData: boolean;
  lastSync: string;
  itemCount: number;
}

export interface ExcelSyncLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  fileName: string;
  action: 'IMPORT_TOTAL' | 'IMPORT_PARCIAL' | 'EXPORT_SYNC' | 'BACKUP_CRIADO';
  sheetsDetected: string[];
  materialsProcessed: number;
  employeesProcessed: number;
  movementsSynced: number;
  conflictsResolved: number;
  status: 'SUCESSO' | 'ALERTA' | 'ERRO';
  details: string;
  backupDataUrl?: string;
}

export interface ExcelSheetReport {
  name: string;
  rowCount: number;
  detectedType:
    | 'LIST_IKKI'
    | 'CONSUMO'
    | 'ENTRADAS'
    | 'SALDO_AGOSTO'
    | 'CONSOLIDADO'
    | 'EPI'
    | 'MATERIAIS'
    | 'FUNCIONARIOS'
    | 'REGIOES'
    | 'MOVIMENTACOES'
    | 'DESCONHECIDO';
  headers: string[];
  validRowsCount: number;
  ignoredRowsCount: number;
  errorCount: number;
  sampleErrors: string[];
  samplePreview: any[];
}

export interface ExcelImportAnalysis {
  fileName: string;
  fileSizeBytes: number;
  sheets: ExcelSheetReport[];
  materialsFound: number;
  employeesFound: number;
  regionsFound: string[];
  movementsFound: number;
  totalValidRecords: number;
  totalIgnoredRecords: number;
  totalErrors: number;
  detectedOfficialIkkiSheet: boolean;
}

