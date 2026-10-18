import {
  Material,
  Movement,
  Employee,
  Requisition,
  EPIDelivery,
  ShelfLocation,
  AuditLog,
  SystemAlert,
  User,
  UserRole,
  Region,
  ExcelSyncLog,
} from '../types';

const STORAGE_KEYS = {
  MATERIALS: 'cplu_materials_v1',
  MOVEMENTS: 'cplu_movements_v1',
  EMPLOYEES: 'cplu_employees_v1',
  REQUISITIONS: 'cplu_requisitions_v1',
  EPI_DELIVERIES: 'cplu_epi_deliveries_v1',
  SHELVES: 'cplu_shelves_v1',
  AUDIT_LOGS: 'cplu_audit_logs_v1',
  USERS: 'cplu_users_v1',
  REGIONS: 'cplu_regions_v1',
  EXCEL_LOGS: 'cplu_excel_logs_v1',
  IDEMPOTENCY_KEYS: 'cplu_idempotency_keys_v1',
  IS_DEMO: 'cplu_is_demo_data_v1',
};

// Initial realistic seed dataset for Limpeza Urbana operations
export const SEED_REGIONS: Region[] = [
  {
    id: 'reg-001',
    code: 'REG-PLT',
    name: 'Paulista',
    supervisor: 'Carlos Alberto Siqueira',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'reg-002',
    code: 'REG-TQA',
    name: 'Taquá',
    supervisor: 'Renata Albuquerque',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'reg-003',
    code: 'REG-PNH',
    name: 'Penha',
    supervisor: 'Marcelo Pires de Castro',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'reg-004',
    code: 'REG-CEN',
    name: 'Sé / Centro',
    supervisor: 'Gilberto Ramos',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'reg-005',
    code: 'REG-SNT',
    name: 'Santana',
    supervisor: 'Luciana Freitas',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
];

// Initial realistic seed dataset for Limpeza Urbana operations
export const SEED_MATERIALS: Material[] = [
  {
    id: 'mat-001',
    code: 'EPI-LUV-01',
    name: 'Luva de Vaqueta Mista Reforçada',
    description: 'Luva de segurança em vaqueta na palma e raspa no dorso para serviços pesados de coleta e capina.',
    category: 'EPI',
    unit: 'PAR',
    currentStock: 120,
    minStock: 50,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'PRAT-EPI-01',
    status: 'ativo',
    supplier: 'Couros & Cia EPIs',
    isEpi: true,
    caNumber: '32456',
    validityMonths: 2,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'mat-002',
    code: 'EPI-BOT-02',
    name: 'Botina de Segurança Nobuck Bico Composite',
    description: 'Calçado de segurança fechado com biqueira composite e solado bi-densidade anti-perfuração.',
    category: 'EPI',
    unit: 'PAR',
    currentStock: 18, // Below minimum to trigger alert
    minStock: 30,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'PRAT-EPI-02',
    status: 'ativo',
    supplier: 'Vulcan Calçados de Segurança',
    isEpi: true,
    caNumber: '41980',
    validityMonths: 6,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-05T14:30:00Z',
  },
  {
    id: 'mat-003',
    code: 'EPI-COL-03',
    name: 'Colete Refletivo Laranja Alta Visibilidade Classe 2',
    description: 'Colete com faixas refletivas prismáticas homologado para trânsito e varrição noturna.',
    category: 'EPI',
    unit: 'UN',
    currentStock: 85,
    minStock: 40,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'PRAT-EPI-03',
    status: 'ativo',
    supplier: 'SignalTex Confeccoes',
    isEpi: true,
    caNumber: '38120',
    validityMonths: 12,
    createdAt: '2026-01-12T09:00:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
  },
  {
    id: 'mat-004',
    code: 'EPI-OCU-04',
    name: 'Óculos de Proteção Ampla Visão Anti-embaçante',
    description: 'Óculos de policarbonato incolor com ventilação indireta e tratamento UV.',
    category: 'EPI',
    unit: 'UN',
    currentStock: 4, // Critical stock!
    minStock: 25,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'PRAT-EPI-01',
    status: 'ativo',
    supplier: 'SafeEye Óptica Industrial',
    isEpi: true,
    caNumber: '19875',
    validityMonths: 12,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-10T09:15:00Z',
  },
  {
    id: 'mat-005',
    code: 'EPI-PRO-05',
    name: 'Protetor Auricular Tipo Concha 24dB',
    description: 'Atenuador de ruído acoplável a capacete para operadores de roçadeira e trituradores.',
    category: 'EPI',
    unit: 'UN',
    currentStock: 35,
    minStock: 20,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'PRAT-EPI-04',
    status: 'ativo',
    supplier: 'Sonics Proteção Auditiva',
    isEpi: true,
    caNumber: '27641',
    validityMonths: 24,
    createdAt: '2026-01-18T11:00:00Z',
    updatedAt: '2026-02-28T16:00:00Z',
  },
  {
    id: 'mat-006',
    code: 'FER-VAS-01',
    name: 'Vassoura Gari com Cabo Madeira Reforçado 60cm',
    description: 'Vassourão de piaçava mista com base plástica e cabo de eucalipto 1,50m rosqueável.',
    category: 'Ferramental',
    unit: 'UN',
    currentStock: 65,
    minStock: 30,
    location: 'Galpão B - Ferramentaria',
    shelf: 'PRAT-FER-01',
    status: 'ativo',
    supplier: 'Fibras do Brasil Indústria',
    isEpi: false,
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'mat-007',
    code: 'FER-PAA-02',
    name: 'Pá de Bico de Aço Carbono com Cabo Y',
    description: 'Pá estampada temperada com cabo de madeira tratada para recolhimento de entulhos.',
    category: 'Ferramental',
    unit: 'UN',
    currentStock: 42,
    minStock: 15,
    location: 'Galpão B - Ferramentaria',
    shelf: 'PRAT-FER-02',
    status: 'ativo',
    supplier: 'Metalúrgica Norte Sul',
    isEpi: false,
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-01-25T11:00:00Z',
  },
  {
    id: 'mat-008',
    code: 'CON-SAC-01',
    name: 'Saco Plástico para Lixo 100L Reforçado (Micra 0,08)',
    description: 'Fardo com 100 unidades em polietileno reciclado de alta resistência mecânica.',
    category: 'Consumíveis',
    unit: 'PCT',
    currentStock: 90,
    minStock: 40,
    location: 'Galpão C - Insumos',
    shelf: 'PRAT-CON-01',
    status: 'ativo',
    supplier: 'PlastClean Embalagens',
    isEpi: false,
    createdAt: '2026-01-08T09:00:00Z',
    updatedAt: '2026-03-02T15:00:00Z',
  },
  {
    id: 'mat-009',
    code: 'SIN-CON-01',
    name: 'Cone de Trânsito Flexível Laranja/Branco 75cm',
    description: 'Cone de sinalização viária com fitas refletivas para isolamento de equipes de varrição.',
    category: 'Sinalização',
    unit: 'UN',
    currentStock: 45,
    minStock: 20,
    location: 'Galpão C - Insumos',
    shelf: 'PRAT-SIN-01',
    status: 'ativo',
    supplier: 'Viasafe Sinalizadora',
    isEpi: false,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-18T13:00:00Z',
  },
  {
    id: 'mat-010',
    code: 'QUI-HIP-01',
    name: 'Hipoclorito de Sódio 5% Concentrado - Bombona 20L',
    description: 'Desinfetante bactericida para lavagem de feiras livres, banheiros públicos e praças.',
    category: 'Químicos & Limpeza',
    unit: 'LT',
    currentStock: 200,
    minStock: 100,
    location: 'Galpão D - Produtos Químicos',
    shelf: 'PRAT-QUI-01',
    status: 'ativo',
    supplier: 'Química Paulista Ltda',
    isEpi: false,
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-02-22T09:00:00Z',
  },
];

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    matricula: 'LU-10452',
    name: 'Raimundo Nonato da Silva',
    sector: 'Varrição Central',
    role: 'Gari / Agente de Limpeza',
    regionId: 'reg-001',
    regionName: 'Paulista',
    status: 'ativo',
    shoeSize: '41',
    gloveSize: 'G',
    uniformSize: 'G',
    admissionDate: '2024-03-15',
    createdAt: '2024-03-15T08:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'emp-002',
    matricula: 'LU-10884',
    name: 'Sebastião Alves de Lima',
    sector: 'Coleta Domiciliar',
    role: 'Motorista de Caminhão Coletor',
    regionId: 'reg-002',
    regionName: 'Taquá',
    status: 'ativo',
    shoeSize: '42',
    gloveSize: 'M',
    uniformSize: 'GG',
    admissionDate: '2023-08-01',
    createdAt: '2023-08-01T08:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'emp-003',
    matricula: 'LU-11230',
    name: 'Carlos Eduardo Ferreira',
    sector: 'Capina & Roçagem',
    role: 'Operador de Roçadeira Costal',
    regionId: 'reg-003',
    regionName: 'Penha',
    status: 'ativo',
    shoeSize: '40',
    gloveSize: 'G',
    uniformSize: 'M',
    admissionDate: '2025-01-20',
    createdAt: '2025-01-20T08:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'emp-004',
    matricula: 'LU-11455',
    name: 'Maria Conceição das Neves',
    sector: 'Coleta Seletiva',
    role: 'Agente de Triagem e Coleta',
    regionId: 'reg-001',
    regionName: 'Paulista',
    status: 'ativo',
    shoeSize: '37',
    gloveSize: 'P',
    uniformSize: 'M',
    admissionDate: '2024-11-10',
    createdAt: '2024-11-10T08:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
  },
  {
    id: 'emp-005',
    matricula: 'LU-12019',
    name: 'José Valdir Mendonça',
    sector: 'Manutenção de Frota',
    role: 'Mecânico de Veículos Pesados',
    regionId: 'reg-002',
    regionName: 'Taquá',
    status: 'ativo',
    shoeSize: '43',
    gloveSize: 'G',
    uniformSize: 'GG',
    admissionDate: '2023-02-14',
    createdAt: '2023-02-14T08:00:00Z',
    updatedAt: '2026-02-10T16:00:00Z',
  },
  {
    id: 'emp-006',
    matricula: 'LU-12240',
    name: 'Antônio Marcos de Souza',
    sector: 'Varrição Viária',
    role: 'Gari / Agente de Limpeza',
    regionId: 'reg-003',
    regionName: 'Penha',
    status: 'ativo',
    shoeSize: '41',
    gloveSize: 'G',
    uniformSize: 'G',
    admissionDate: '2024-05-18',
    createdAt: '2024-05-18T08:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'emp-007',
    matricula: 'LU-12501',
    name: 'Luciano Pereira Ramos',
    sector: 'Lavagem de Vias Públicas',
    role: 'Operador de Hidrojato',
    regionId: 'reg-004',
    regionName: 'Sé / Centro',
    status: 'ativo',
    shoeSize: '42',
    gloveSize: 'G',
    uniformSize: 'GG',
    admissionDate: '2023-09-01',
    createdAt: '2023-09-01T08:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'emp-008',
    matricula: 'LU-12889',
    name: 'Beatriz Silveira Santos',
    sector: 'Varrição Central',
    role: 'Gari / Agente de Limpeza',
    regionId: 'reg-005',
    regionName: 'Santana',
    status: 'ativo',
    shoeSize: '38',
    gloveSize: 'M',
    uniformSize: 'M',
    admissionDate: '2025-02-10',
    createdAt: '2025-02-10T08:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
];

export const SEED_SHELVES: ShelfLocation[] = [
  {
    id: 'shelf-001',
    code: 'PRAT-EPI-01',
    zone: 'Galpão A',
    aisle: 'Corredor 1',
    shelfLevel: 'Nível 1 (Mãos)',
    capacity: 250,
    description: 'Estante de EPIs de proteção das mãos e visual',
  },
  {
    id: 'shelf-002',
    code: 'PRAT-EPI-02',
    zone: 'Galpão A',
    aisle: 'Corredor 1',
    shelfLevel: 'Nível 2 (Calçados)',
    capacity: 100,
    description: 'Estante de botinas e botas impermeáveis em caixas',
  },
  {
    id: 'shelf-003',
    code: 'PRAT-EPI-03',
    zone: 'Galpão A',
    aisle: 'Corredor 2',
    shelfLevel: 'Nível 1 (Vestimentas)',
    capacity: 150,
    description: 'Araras e prateleiras de capas e coletes refletivos',
  },
  {
    id: 'shelf-004',
    code: 'PRAT-FER-01',
    zone: 'Galpão B',
    aisle: 'Corredor 1',
    shelfLevel: 'Nível Chão',
    capacity: 80,
    description: 'Suporte vertical para vassourões e pás com cabo',
  },
  {
    id: 'shelf-005',
    code: 'PRAT-CON-01',
    zone: 'Galpão C',
    aisle: 'Corredor 1',
    shelfLevel: 'Palete Aéreo',
    capacity: 500,
    description: 'Palete dedicado a fardos de sacos de lixo 100L',
  },
];

export const SEED_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Roberto Valadares',
    email: 'admin@cplu.gov.br',
    role: 'administrador',
    matricula: 'ADM-001',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-almo',
    name: 'Marcos Vinícius Dias',
    email: 'almoxarife@cplu.gov.br',
    role: 'almoxarife',
    matricula: 'ALM-102',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-tec',
    name: 'Engª Juliana Prado',
    email: 'seguranca@cplu.gov.br',
    role: 'tecnico_seguranca',
    matricula: 'TST-045',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-gestor',
    name: 'Dr. Fernando Siqueira',
    email: 'gestor@cplu.gov.br',
    role: 'gestor',
    matricula: 'DIR-009',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
];

export const SEED_REQUISITIONS: Requisition[] = [
  {
    id: 'req-001',
    number: 'REQ-2026-0001',
    employeeId: 'emp-001',
    employeeName: 'Raimundo Nonato da Silva',
    employeeMatricula: 'LU-10452',
    sector: 'Varrição Central',
    status: 'parcialmente_atendida',
    priority: 'alta',
    justification: 'Substituição periódica de EPIs desgastados e fornecimento de novos óculos de proteção para rota solar.',
    observations: 'Colaborador atua na Avenida Principal com intenso tráfego.',
    requestedByUserId: 'usr-tec',
    requestedByName: 'Engª Juliana Prado',
    items: [
      {
        id: 'ri-001',
        materialId: 'mat-001',
        materialCode: 'EPI-LUV-01',
        materialName: 'Luva de Vaqueta Mista Reforçada',
        unit: 'PAR',
        isEpi: true,
        caNumber: '32456',
        quantityRequested: 2,
        quantityDelivered: 2,
        status: 'entregue',
      },
      {
        id: 'ri-002',
        materialId: 'mat-004',
        materialCode: 'EPI-OCU-04',
        materialName: 'Óculos de Proteção Ampla Visão Anti-embaçante',
        unit: 'UN',
        isEpi: true,
        caNumber: '19875',
        quantityRequested: 1,
        quantityDelivered: 0,
        status: 'pendente',
      },
    ],
    createdAt: '2026-03-12T09:30:00Z',
    updatedAt: '2026-03-12T14:20:00Z',
  },
  {
    id: 'req-002',
    number: 'REQ-2026-0002',
    employeeId: 'emp-003',
    employeeName: 'Carlos Eduardo Ferreira',
    employeeMatricula: 'LU-11230',
    sector: 'Capina & Roçagem',
    status: 'pendente',
    priority: 'critica',
    justification: 'Início de nova frente de trabalho no anel viário. Necessidade urgente de protetor concha e botina.',
    observations: 'Operação com equipamento motorizado.',
    requestedByUserId: 'usr-tec',
    requestedByName: 'Engª Juliana Prado',
    items: [
      {
        id: 'ri-003',
        materialId: 'mat-002',
        materialCode: 'EPI-BOT-02',
        materialName: 'Botina de Segurança Nobuck Bico Composite',
        unit: 'PAR',
        isEpi: true,
        caNumber: '41980',
        quantityRequested: 1,
        quantityDelivered: 0,
        status: 'pendente',
      },
      {
        id: 'ri-004',
        materialId: 'mat-005',
        materialCode: 'EPI-PRO-05',
        materialName: 'Protetor Auricular Tipo Concha 24dB',
        unit: 'UN',
        isEpi: true,
        caNumber: '27641',
        quantityRequested: 1,
        quantityDelivered: 0,
        status: 'pendente',
      },
    ],
    createdAt: '2026-03-14T11:00:00Z',
    updatedAt: '2026-03-14T11:00:00Z',
  },
];

export const SEED_MOVEMENTS: Movement[] = [
  {
    id: 'mov-001',
    materialId: 'mat-001',
    materialCode: 'EPI-LUV-01',
    materialName: 'Luva de Vaqueta Mista Reforçada',
    type: 'ENTRADA_COMPRA',
    quantity: 100,
    previousStock: 22,
    newStock: 122,
    date: '2026-03-01T10:00:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão A - Almoxarifado Central',
    sector: 'Almoxarifado',
    observation: 'Recebimento de lote conforme NF-e 44921 da Couros & Cia.',
  },
  {
    id: 'mov-002',
    materialId: 'mat-001',
    materialCode: 'EPI-LUV-01',
    materialName: 'Luva de Vaqueta Mista Reforçada',
    type: 'SAIDA_REQUISICAO',
    quantity: 2,
    previousStock: 122,
    newStock: 120,
    date: '2026-03-12T14:20:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão A - Almoxarifado Central',
    sector: 'Varrição Central',
    employeeId: 'emp-001',
    employeeName: 'Raimundo Nonato da Silva',
    employeeMatricula: 'LU-10452',
    regionId: 'reg-001',
    regionName: 'Paulista',
    requisitionId: 'req-001',
    requisitionNumber: 'REQ-2026-0001',
    observation: 'Entrega com assinatura eletrônica NR-6 realizada no balcão do almoxarifado.',
  },
  {
    id: 'mov-003',
    materialId: 'mat-006',
    materialCode: 'MAT-VAS-06',
    materialName: 'Vassourão de Piaçava 60cm com Cabo Reforçado',
    type: 'SAIDA_CONSUMO',
    quantity: 15,
    previousStock: 60,
    newStock: 45,
    date: '2026-03-10T08:30:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão B - Ferramentaria',
    sector: 'Varrição Viária',
    employeeId: 'emp-001',
    employeeName: 'Raimundo Nonato da Silva',
    employeeMatricula: 'LU-10452',
    regionId: 'reg-001',
    regionName: 'Paulista',
    observation: 'Substituição mensal de ferramentais para a Regional Paulista.',
  },
  {
    id: 'mov-004',
    materialId: 'mat-008',
    materialCode: 'MAT-SAC-08',
    materialName: 'Saco de Lixo Reforçado 100L Preto (Fardo 100 un)',
    type: 'SAIDA_CONSUMO',
    quantity: 20,
    previousStock: 160,
    newStock: 140,
    date: '2026-03-08T09:15:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão C - Insumos',
    sector: 'Coleta Domiciliar',
    employeeId: 'emp-002',
    employeeName: 'Sebastião Alves de Lima',
    employeeMatricula: 'LU-10884',
    regionId: 'reg-002',
    regionName: 'Taquá',
    observation: 'Fornecimento semanal de sacos de alta resistência para a Regional Taquá.',
  },
  {
    id: 'mov-005',
    materialId: 'mat-007',
    materialCode: 'MAT-PA-07',
    materialName: 'Pá Coletora de Aço com Cabo de Madeira 1,20m',
    type: 'SAIDA_CONSUMO',
    quantity: 8,
    previousStock: 36,
    newStock: 28,
    date: '2026-03-05T11:00:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão B - Ferramentaria',
    sector: 'Capina & Roçagem',
    employeeId: 'emp-003',
    employeeName: 'Carlos Eduardo Ferreira',
    employeeMatricula: 'LU-11230',
    regionId: 'reg-003',
    regionName: 'Penha',
    observation: 'Pás para remoção de resíduos na Regional Penha.',
  },
  {
    id: 'mov-006',
    materialId: 'mat-009',
    materialCode: 'QUI-DES-09',
    materialName: 'Desinfetante Concentrado Floral Galão 5 Litros',
    type: 'SAIDA_CONSUMO',
    quantity: 6,
    previousStock: 48,
    newStock: 42,
    date: '2026-03-03T14:00:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão D - Produtos Químicos',
    sector: 'Lavagem de Feiras & Calçadões',
    employeeId: 'emp-007',
    employeeName: 'Luciano Pereira Ramos',
    employeeMatricula: 'LU-12501',
    regionId: 'reg-004',
    regionName: 'Sé / Centro',
    observation: 'Desinfecção diária de vias públicas na Sé.',
  },
  {
    id: 'mov-007',
    materialId: 'mat-001',
    materialCode: 'EPI-LUV-01',
    materialName: 'Luva de Vaqueta Mista Reforçada',
    type: 'SAIDA_CONSUMO',
    quantity: 12,
    previousStock: 134,
    newStock: 122,
    date: '2026-02-25T10:00:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão A - Almoxarifado Central',
    sector: 'Capina & Roçagem',
    employeeId: 'emp-003',
    employeeName: 'Carlos Eduardo Ferreira',
    employeeMatricula: 'LU-11230',
    regionId: 'reg-003',
    regionName: 'Penha',
    observation: 'Consumo do mês anterior (Fevereiro/2026) da Regional Penha.',
  },
  {
    id: 'mov-008',
    materialId: 'mat-008',
    materialCode: 'MAT-SAC-08',
    materialName: 'Saco de Lixo Reforçado 100L Preto (Fardo 100 un)',
    type: 'SAIDA_CONSUMO',
    quantity: 25,
    previousStock: 185,
    newStock: 160,
    date: '2026-02-20T08:00:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão C - Insumos',
    sector: 'Varrição Central',
    employeeId: 'emp-001',
    employeeName: 'Raimundo Nonato da Silva',
    employeeMatricula: 'LU-10452',
    regionId: 'reg-001',
    regionName: 'Paulista',
    observation: 'Consumo do mês anterior (Fevereiro/2026) da Regional Paulista.',
  },
  {
    id: 'mov-009',
    materialId: 'mat-006',
    materialCode: 'MAT-VAS-06',
    materialName: 'Vassourão de Piaçava 60cm com Cabo Reforçado',
    type: 'SAIDA_CONSUMO',
    quantity: 10,
    previousStock: 70,
    newStock: 60,
    date: '2026-02-18T14:30:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    location: 'Galpão B - Ferramentaria',
    sector: 'Coleta Domiciliar',
    employeeId: 'emp-002',
    employeeName: 'Sebastião Alves de Lima',
    employeeMatricula: 'LU-10884',
    regionId: 'reg-002',
    regionName: 'Taquá',
    observation: 'Consumo do mês anterior (Fevereiro/2026) da Regional Taquá.',
  },
];

export const SEED_DELIVERIES: EPIDelivery[] = [
  {
    id: 'del-001',
    requisitionId: 'req-001',
    requisitionNumber: 'REQ-2026-0001',
    employeeId: 'emp-001',
    employeeName: 'Raimundo Nonato da Silva',
    employeeMatricula: 'LU-10452',
    sector: 'Varrição Central',
    deliveredByUserId: 'usr-almo',
    deliveredByName: 'Marcos Vinícius Dias',
    date: '2026-03-12T14:20:00Z',
    items: [
      {
        materialId: 'mat-001',
        materialCode: 'EPI-LUV-01',
        materialName: 'Luva de Vaqueta Mista Reforçada',
        caNumber: '32456',
        quantity: 2,
        unit: 'PAR',
      },
    ],
    observations: 'Entrega regular. O colaborador foi orientado sobre a conservação conforme NR-6.',
  },
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-03-01T10:00:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    action: 'ENTRADA_ESTOQUE',
    entity: 'Material',
    entityId: 'mat-001',
    details: 'Entrada de 100 PAR do material EPI-LUV-01 por NF 44921. Saldo anterior: 22, novo saldo: 122.',
    ipOrSession: 'Sessão 192.168.1.45',
  },
  {
    id: 'log-002',
    timestamp: '2026-03-12T09:30:00Z',
    userId: 'usr-tec',
    userName: 'Engª Juliana Prado',
    userRole: 'tecnico_seguranca',
    action: 'CRIAR_REQUISICAO',
    entity: 'Requisition',
    entityId: 'req-001',
    details: 'Criação da requisição REQ-2026-0001 para o funcionário Raimundo Nonato da Silva (LU-10452).',
    ipOrSession: 'Sessão 192.168.1.88',
  },
  {
    id: 'log-003',
    timestamp: '2026-03-12T14:20:00Z',
    userId: 'usr-almo',
    userName: 'Marcos Vinícius Dias',
    userRole: 'almoxarife',
    action: 'ENTREGA_EPI_NR6',
    entity: 'EPIDelivery',
    entityId: 'del-001',
    details: 'Entrega de 2 PAR de Luva de Vaqueta para Raimundo Nonato da Silva com registro biométrico/assinatura.',
    ipOrSession: 'Sessão 192.168.1.45',
  },
];

// In-memory mutex for atomic transactions
let isTransactionLocked = false;
const listeners: (() => void)[] = [];

// Real-time synchronization bus across tabs / windows
const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('cplu_sync_bus')
    : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Sync listener error:', e);
      }
    });
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Storage sync error:', e);
      }
    });
  });
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Listener callback error:', e);
    }
  });
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
    } catch (e) {
      console.warn('SyncChannel postMessage warning:', e);
    }
  }
}

export const dbService = {
  subscribe(callback: () => void) {
    listeners.push(callback);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },

  // Initialize storage
  init() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
      this.resetToSeedData();
    } else if (!localStorage.getItem(STORAGE_KEYS.REGIONS)) {
      localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(SEED_REGIONS));
    }
  },

  isDemoData(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
  },

  resetToSeedData() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(SEED_MATERIALS));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(SEED_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify(SEED_SHELVES));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(SEED_REGIONS));
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(SEED_REQUISITIONS));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(SEED_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.EPI_DELIVERIES, JSON.stringify(SEED_DELIVERIES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.EXCEL_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
    notifyListeners();
  },

  clearAllData() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS)); // Keep base user logins
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EPI_DELIVERIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([
      {
        id: 'log-clean-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: 'system',
        userName: 'Administrador do Sistema',
        userRole: 'administrador',
        action: 'LIMPAR_BANCO',
        entity: 'System',
        entityId: 'database',
        details: 'Banco de dados de demonstração limpo pelo usuário. Iniciando modo de produção vazio.',
        ipOrSession: 'Sessão Local',
      },
    ]));
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'false');
    notifyListeners();
  },

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  },

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...entry,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 500 logs to avoid unbounded local storage
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    return newLog;
  },

  // MATERIALS
  getMaterials(): Material[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    return raw ? JSON.parse(raw) : [];
  },

  getMaterialById(id: string): Material | undefined {
    return this.getMaterials().find((m) => m.id === id);
  },

  getMaterialByCode(code: string): Material | undefined {
    const clean = code.trim().toUpperCase();
    return this.getMaterials().find((m) => m.code.toUpperCase() === clean);
  },

  createMaterial(
    material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; material?: Material } {
    const materials = this.getMaterials();

    // Check duplicate code
    const duplicate = materials.find(
      (m) => m.code.trim().toUpperCase() === material.code.trim().toUpperCase()
    );
    if (duplicate) {
      return { success: false, message: `Já existe um material cadastrado com o código "${material.code}".` };
    }

    if (material.currentStock < 0) {
      return { success: false, message: 'O saldo inicial não pode ser negativo.' };
    }

    const now = new Date().toISOString();
    const newMaterial: Material = {
      ...material,
      id: 'mat-' + Math.random().toString(36).substring(2, 9),
      code: material.code.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };

    materials.push(newMaterial);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    // Audit log
    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CADASTRAR_MATERIAL',
      entity: 'Material',
      entityId: newMaterial.id,
      details: `Material cadastrado: ${newMaterial.code} - ${newMaterial.name} (Saldo Inicial: ${newMaterial.currentStock} ${newMaterial.unit})`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: 'Material cadastrado com sucesso!', material: newMaterial };
  },

  updateMaterial(
    id: string,
    updates: Partial<Omit<Material, 'id' | 'code' | 'createdAt' | 'currentStock'>>,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string } {
    const materials = this.getMaterials();
    const idx = materials.findIndex((m) => m.id === id);
    if (idx === -1) {
      return { success: false, message: 'Material não encontrado no sistema.' };
    }

    const current = materials[idx];
    const updated: Material = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    materials[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ATUALIZAR_MATERIAL',
      entity: 'Material',
      entityId: id,
      details: `Atualização de cadastro para ${updated.code} - ${updated.name}`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: 'Dados do material atualizados com sucesso!' };
  },

  toggleMaterialStatus(
    id: string,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; newStatus?: 'ativo' | 'inativo' } {
    const materials = this.getMaterials();
    const idx = materials.findIndex((m) => m.id === id);
    if (idx === -1) return { success: false, message: 'Material não encontrado.' };

    const newStatus = materials[idx].status === 'ativo' ? 'inativo' : 'ativo';
    materials[idx].status = newStatus;
    materials[idx].updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: newStatus === 'inativo' ? 'INATIVAR_MATERIAL' : 'REATIVAR_MATERIAL',
      entity: 'Material',
      entityId: id,
      details: `Situação do material ${materials[idx].code} alterada para ${newStatus.toUpperCase()}`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: `Material ${newStatus === 'ativo' ? 'reativado' : 'inativado'} com sucesso!`, newStatus };
  },

  // Delete material: Allowed ONLY if NO movements exist!
  deleteMaterial(
    id: string,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string } {
    const movements = this.getMovements().filter((m) => m.materialId === id);
    if (movements.length > 0) {
      return {
        success: false,
        message: `Não é permitido excluir fisicamente materiais que possuem movimentações auditadas (${movements.length} registradas). Inative o item para preservar o histórico.`,
      };
    }

    const materials = this.getMaterials();
    const item = materials.find((m) => m.id === id);
    if (!item) return { success: false, message: 'Material não encontrado.' };

    const filtered = materials.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'EXCLUIR_MATERIAL',
      entity: 'Material',
      entityId: id,
      details: `Exclusão física do material virgem ${item.code} - ${item.name}`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: 'Material removido com sucesso.' };
  },

  // MOVEMENTS
  getMovements(): Movement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * Atomic Transactional Stock Movement Registration
   * Ensures no concurrent race conditions, validates non-negative stock,
   * creates immutable movement log, updates material balance, and logs audit.
   */
  registerStockMovement(
    params: {
      materialId: string;
      type: Movement['type'];
      quantity: number;
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
      idempotencyKey?: string;
      observation?: string;
      justification?: string;
    }
  ): { success: boolean; message: string; movement?: Movement } {
    if (params.idempotencyKey && this.isIdempotencyKeyProcessed(params.idempotencyKey)) {
      return { success: false, message: 'Operação já processada anteriormente (proteção contra clique duplo ou reenvio).' };
    }

    if (isTransactionLocked) {
      return { success: false, message: 'Outra transação de estoque está em andamento. Tente novamente em instantes.' };
    }

    try {
      isTransactionLocked = true;

      if (!params.quantity || params.quantity <= 0) {
        return { success: false, message: 'A quantidade deve ser maior que zero.' };
      }

      const materials = this.getMaterials();
      const matIndex = materials.findIndex((m) => m.id === params.materialId);
      if (matIndex === -1) {
        return { success: false, message: 'Material não localizado no almoxarifado.' };
      }

      const mat = materials[matIndex];
      const isExit = params.type.startsWith('SAIDA_');
      const isAdjustment = params.type.includes('AJUSTE');

      if (isAdjustment && (!params.justification || params.justification.trim().length < 5)) {
        return { success: false, message: 'Ajustes de estoque exigem justificativa detalhada e autorizada.' };
      }

      const previousStock = mat.currentStock;
      let newStock = previousStock;

      if (isExit) {
        if (previousStock < params.quantity) {
          return {
            success: false,
            message: `Saldo insuficiente para saída! Saldo atual em estoque: ${previousStock} ${mat.unit}. Solicitado: ${params.quantity} ${mat.unit}.`,
          };
        }
        newStock = previousStock - params.quantity;
      } else {
        newStock = previousStock + params.quantity;
      }

      // Auto-detect region if employee specified
      let resolvedRegionId = params.regionId;
      let resolvedRegionName = params.regionName;
      if (params.employeeId && (!resolvedRegionId || !resolvedRegionName)) {
        const emp = this.getEmployeeById(params.employeeId);
        if (emp) {
          resolvedRegionId = resolvedRegionId || emp.regionId;
          resolvedRegionName = resolvedRegionName || emp.regionName;
        }
      }

      const now = new Date().toISOString();
      const movementId = 'mov-' + Math.random().toString(36).substring(2, 9);
      const newMovement: Movement = {
        id: movementId,
        materialId: mat.id,
        materialCode: mat.code,
        materialName: mat.name,
        type: params.type,
        quantity: params.quantity,
        previousStock,
        newStock,
        date: now,
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        location: params.location || mat.location,
        sector: params.sector,
        employeeId: params.employeeId,
        employeeName: params.employeeName,
        employeeMatricula: params.employeeMatricula,
        regionId: resolvedRegionId,
        regionName: resolvedRegionName,
        requisitionId: params.requisitionId,
        requisitionNumber: params.requisitionNumber,
        idempotencyKey: params.idempotencyKey,
        observation: params.observation,
        justification: params.justification,
      };

      if (params.idempotencyKey) {
        this.markIdempotencyKeyProcessed(params.idempotencyKey);
      }

      // Atomic commit
      mat.currentStock = newStock;
      mat.updatedAt = now;
      materials[matIndex] = mat;

      const movements = this.getMovements();
      movements.unshift(newMovement);

      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));

      // Audit log
      this.addAuditLog({
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        action: `MOVIMENTACAO_${params.type}`,
        entity: 'Movement',
        entityId: movementId,
        details: `${params.type}: ${params.quantity} ${mat.unit} de ${mat.code} - ${mat.name}. Saldo: ${previousStock} -> ${newStock}.`,
        ipOrSession: 'Sessão Web',
      });

      notifyListeners();
      return {
        success: true,
        message: `Movimentação registrada com sucesso! Novo saldo: ${newStock} ${mat.unit}.`,
        movement: newMovement,
      };
    } finally {
      isTransactionLocked = false;
    }
  },

  // EMPLOYEES
  getEmployees(): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return raw ? JSON.parse(raw) : [];
  },

  getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find((e) => e.id === id);
  },

  getEmployeeByMatricula(matricula: string): Employee | undefined {
    const clean = matricula.trim().toUpperCase();
    return this.getEmployees().find((e) => e.matricula.toUpperCase() === clean);
  },

  createEmployee(
    employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; employee?: Employee } {
    const employees = this.getEmployees();
    const duplicate = employees.find(
      (e) => e.matricula.trim().toUpperCase() === employee.matricula.trim().toUpperCase()
    );
    if (duplicate) {
      return { success: false, message: `Já existe um funcionário com a matrícula "${employee.matricula}".` };
    }

    const now = new Date().toISOString();
    const newEmp: Employee = {
      ...employee,
      id: 'emp-' + Math.random().toString(36).substring(2, 9),
      matricula: employee.matricula.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };

    employees.push(newEmp);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CADASTRAR_FUNCIONARIO',
      entity: 'Employee',
      entityId: newEmp.id,
      details: `Cadastro de colaborador: ${newEmp.matricula} - ${newEmp.name} (${newEmp.sector})`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: 'Funcionário cadastrado com sucesso!', employee: newEmp };
  },

  updateEmployee(
    id: string,
    updates: Partial<Omit<Employee, 'id' | 'matricula' | 'createdAt'>>,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string } {
    const employees = this.getEmployees();
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) return { success: false, message: 'Funcionário não encontrado.' };

    employees[idx] = {
      ...employees[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ATUALIZAR_FUNCIONARIO',
      entity: 'Employee',
      entityId: id,
      details: `Atualização de dados do funcionário ${employees[idx].matricula} - ${employees[idx].name}`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: 'Cadastro do colaborador atualizado com sucesso!' };
  },

  // REQUISITIONS
  getRequisitions(): Requisition[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUISITIONS);
    return raw ? JSON.parse(raw) : [];
  },

  getRequisitionById(id: string): Requisition | undefined {
    return this.getRequisitions().find((r) => r.id === id);
  },

  getRequisitionByNumber(num: string): Requisition | undefined {
    const clean = num.trim().toUpperCase();
    return this.getRequisitions().find((r) => r.number.toUpperCase() === clean);
  },

  createRequisition(
    data: {
      employeeId: string;
      priority: Requisition['priority'];
      justification: string;
      observations?: string;
      items: { materialId: string; quantityRequested: number }[];
      isDraft?: boolean;
    },
    user: { id: string; name: string; role: UserRole; matricula?: string }
  ): { success: boolean; message: string; requisition?: Requisition } {
    const emp = this.getEmployeeById(data.employeeId);
    if (!emp) return { success: false, message: 'Funcionário selecionado não existe.' };

    if (!data.items || data.items.length === 0) {
      return { success: false, message: 'Adicione pelo menos um item à requisição.' };
    }

    const materials = this.getMaterials();
    const formattedItems: Requisition['items'] = [];

    for (const item of data.items) {
      const mat = materials.find((m) => m.id === item.materialId);
      if (!mat) {
        return { success: false, message: `Material ID ${item.materialId} não encontrado.` };
      }
      if (item.quantityRequested <= 0) {
        return { success: false, message: `A quantidade para ${mat.name} deve ser maior que zero.` };
      }

      formattedItems.push({
        id: 'ri-' + Math.random().toString(36).substring(2, 9),
        materialId: mat.id,
        materialCode: mat.code,
        materialName: mat.name,
        unit: mat.unit,
        isEpi: mat.isEpi,
        caNumber: mat.caNumber,
        quantityRequested: item.quantityRequested,
        quantityDelivered: 0,
        status: 'pendente',
      });
    }

    const requisitions = this.getRequisitions();
    const year = new Date().getFullYear();
    const nextSeq = String(requisitions.length + 1).padStart(4, '0');
    const reqNumber = `REQ-${year}-${nextSeq}`;

    const now = new Date().toISOString();
    const status: Requisition['status'] = data.isDraft ? 'rascunho' : 'enviada';

    const newReq: Requisition = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      number: reqNumber,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeMatricula: emp.matricula,
      sector: emp.sector,
      regionId: emp.regionId,
      regionName: emp.regionName,
      status,
      priority: data.priority,
      justification: data.justification,
      observations: data.observations,
      requestedByUserId: user.id,
      requestedByName: user.name,
      requestedByMatricula: user.matricula,
      sentAt: data.isDraft ? undefined : now,
      isNewNotification: !data.isDraft,
      items: formattedItems,
      createdAt: now,
      updatedAt: now,
    };

    requisitions.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(requisitions));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: data.isDraft ? 'RASCUNHO_REQUISICAO' : 'ENVIAR_REQUISICAO',
      entity: 'Requisition',
      entityId: newReq.id,
      details: data.isDraft
        ? `Rascunho ${newReq.number} salvo pelo TST ${user.name} (${user.matricula || user.role}) para ${emp.name}.`
        : `Requisição ${newReq.number} emitida e enviada pelo TST ${user.name} (${user.matricula || user.role}) para ${emp.name} (${emp.matricula}).`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return {
      success: true,
      message: data.isDraft
        ? `Rascunho ${newReq.number} salvo com sucesso!`
        : `Requisição ${newReq.number} enviada ao Almoxarifado em tempo real!`,
      requisition: newReq,
    };
  },

  sendDraftRequisition(
    requisitionId: string,
    user: { id: string; name: string; role: UserRole; matricula?: string }
  ): { success: boolean; message: string; requisition?: Requisition } {
    const requisitions = this.getRequisitions();
    const idx = requisitions.findIndex((r) => r.id === requisitionId);
    if (idx === -1) return { success: false, message: 'Requisição não encontrada.' };

    const req = requisitions[idx];
    if (req.status !== 'rascunho') {
      return { success: false, message: `Esta requisição já está no status "${req.status.toUpperCase()}".` };
    }

    const now = new Date().toISOString();
    req.status = 'enviada';
    req.sentAt = now;
    req.isNewNotification = true;
    req.updatedAt = now;
    requisitions[idx] = req;

    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(requisitions));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ENVIAR_RASCUNHO_REQUISICAO',
      entity: 'Requisition',
      entityId: req.id,
      details: `Rascunho ${req.number} enviado ao Almoxarifado pelo TST ${user.name} (${user.matricula || user.role}).`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return { success: true, message: `Requisição ${req.number} enviada ao Almoxarifado!`, requisition: req };
  },

  cancelRequisition(
    requisitionId: string,
    cancellationReason: string,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string } {
    const requisitions = this.getRequisitions();
    const idx = requisitions.findIndex((r) => r.id === requisitionId);
    if (idx === -1) return { success: false, message: 'Requisição não encontrada.' };

    const req = requisitions[idx];
    if (req.status === 'atendida') {
      return { success: false, message: 'Não é possível cancelar uma requisição já atendida.' };
    }

    if (!cancellationReason.trim()) {
      return { success: false, message: 'Informe a justificativa do cancelamento.' };
    }

    const now = new Date().toISOString();
    req.status = 'cancelada';
    req.cancellationReason = cancellationReason.trim();
    req.isNewNotification = false;
    req.updatedAt = now;
    requisitions[idx] = req;

    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(requisitions));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CANCELAR_REQUISICAO',
      entity: 'Requisition',
      entityId: req.id,
      details: `Requisição ${req.number} cancelada por ${user.name}. Motivo: ${cancellationReason}`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return { success: true, message: `Requisição ${req.number} cancelada com sucesso.` };
  },

  markRequisitionViewed(requisitionId: string) {
    const requisitions = this.getRequisitions();
    const idx = requisitions.findIndex((r) => r.id === requisitionId);
    if (idx !== -1 && requisitions[idx].isNewNotification) {
      requisitions[idx].isNewNotification = false;
      localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(requisitions));
      notifyListeners();
    }
  },

  /**
   * Fulfill Requisition and deliver EPI / Material with Electronic Confirmation
   * Enforces:
   * - Cannot deliver more than remaining requested quantity
   * - Atomic stock deduction
   * - Generation of EPIDelivery voucher with signature
   * - Status transition (pendente -> parcialmente_atendida -> atendida)
   * - Protection against duplicate submissions
   */
  fulfillRequisition(
    params: {
      requisitionId: string;
      deliveredItems: { itemId: string; quantityToDeliver: number }[];
      signatureDataUrl?: string;
      observations?: string;
      idempotencyKey?: string;
    },
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; delivery?: EPIDelivery } {
    if (params.idempotencyKey && this.isIdempotencyKeyProcessed(params.idempotencyKey)) {
      return { success: false, message: 'Esta entrega já foi confirmada e processada anteriormente (proteção contra clique duplo).' };
    }

    if (isTransactionLocked) {
      return { success: false, message: 'Operação concorrente em andamento. Aguarde um instante.' };
    }

    try {
      isTransactionLocked = true;

      const requisitions = this.getRequisitions();
      const reqIdx = requisitions.findIndex((r) => r.id === params.requisitionId);
      if (reqIdx === -1) {
        return { success: false, message: 'Requisição não encontrada.' };
      }

      const req = requisitions[reqIdx];
      if (req.status === 'atendida' || req.status === 'cancelada' || req.status === 'rejeitada') {
        return { success: false, message: `Esta requisição já está no status "${req.status.toUpperCase()}" e não pode ser atendida.` };
      }

      const validDeliveries = params.deliveredItems.filter((di) => di.quantityToDeliver > 0);
      if (validDeliveries.length === 0) {
        return { success: false, message: 'Informe a quantidade entregue para pelo menos um item.' };
      }

      const materials = this.getMaterials();
      const deliveriesToRecord: {
        materialId: string;
        materialCode: string;
        materialName: string;
        caNumber?: string;
        quantity: number;
        unit: string;
      }[] = [];

      // 1. Pre-validation: check stock and remaining quantity for all items
      for (const itemDelivery of validDeliveries) {
        const reqItem = req.items.find((i) => i.id === itemDelivery.itemId);
        if (!reqItem) {
          return { success: false, message: `Item da requisição não encontrado: ${itemDelivery.itemId}` };
        }

        const remainingRequested = reqItem.quantityRequested - reqItem.quantityDelivered;
        if (itemDelivery.quantityToDeliver > remainingRequested) {
          return {
            success: false,
            message: `Quantidade informada (${itemDelivery.quantityToDeliver}) excede o saldo restante solicitado (${remainingRequested}) para o item "${reqItem.materialName}".`,
          };
        }

        const mat = materials.find((m) => m.id === reqItem.materialId);
        if (!mat) {
          return { success: false, message: `Material ${reqItem.materialName} não encontrado no cadastro.` };
        }

        if (mat.currentStock < itemDelivery.quantityToDeliver) {
          return {
            success: false,
            message: `Estoque insuficiente para "${mat.name}". Disponível: ${mat.currentStock} ${mat.unit}, Requerido para entrega: ${itemDelivery.quantityToDeliver} ${mat.unit}.`,
          };
        }

        deliveriesToRecord.push({
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          caNumber: mat.caNumber,
          quantity: itemDelivery.quantityToDeliver,
          unit: mat.unit,
        });
      }

      // 2. Perform atomic operations
      const now = new Date().toISOString();
      const movements = this.getMovements();

      const emp = this.getEmployeeById(req.employeeId);
      const resolvedRegionId = req.regionId || emp?.regionId;
      const resolvedRegionName = req.regionName || emp?.regionName;

      for (const itemDelivery of validDeliveries) {
        const reqItem = req.items.find((i) => i.id === itemDelivery.itemId)!;
        const matIdx = materials.findIndex((m) => m.id === reqItem.materialId);
        const mat = materials[matIdx];

        const previousStock = mat.currentStock;
        const newStock = previousStock - itemDelivery.quantityToDeliver;
        mat.currentStock = newStock;
        mat.updatedAt = now;
        materials[matIdx] = mat;

        // Record stock exit movement
        const movId = 'mov-' + Math.random().toString(36).substring(2, 9);
        movements.unshift({
          id: movId,
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          type: 'SAIDA_REQUISICAO',
          quantity: itemDelivery.quantityToDeliver,
          previousStock,
          newStock,
          date: now,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          location: mat.location,
          sector: req.sector,
          employeeId: req.employeeId,
          employeeName: req.employeeName,
          employeeMatricula: req.employeeMatricula,
          regionId: resolvedRegionId,
          regionName: resolvedRegionName,
          requisitionId: req.id,
          requisitionNumber: req.number,
          idempotencyKey: params.idempotencyKey,
          observation: `Atendimento de requisição ${req.number} - Comprovante NR-6`,
        });

        // Update requisition item delivered quantity and status
        reqItem.quantityDelivered += itemDelivery.quantityToDeliver;
        if (reqItem.quantityDelivered >= reqItem.quantityRequested) {
          reqItem.status = 'entregue';
        } else {
          reqItem.status = 'parcial';
        }
      }

      if (params.idempotencyKey) {
        this.markIdempotencyKeyProcessed(params.idempotencyKey);
      }

      // Evaluate new overall requisition status
      const allDelivered = req.items.every((i) => i.status === 'entregue' || i.quantityDelivered >= i.quantityRequested);
      req.status = allDelivered ? 'atendida' : 'parcialmente_atendida';
      req.updatedAt = now;
      requisitions[reqIdx] = req;

      // 3. Record EPIDelivery voucher
      const deliveryId = 'del-' + Math.random().toString(36).substring(2, 9);
      const newDelivery: EPIDelivery = {
        id: deliveryId,
        requisitionId: req.id,
        requisitionNumber: req.number,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        employeeMatricula: req.employeeMatricula,
        sector: req.sector,
        regionId: resolvedRegionId,
        regionName: resolvedRegionName,
        deliveredByUserId: user.id,
        deliveredByName: user.name,
        signatureDataUrl: params.signatureDataUrl,
        date: now,
        items: deliveriesToRecord,
        observations: params.observations,
      };

      const deliveries = this.getEPIDeliveries();
      deliveries.unshift(newDelivery);

      // Commit to persistent storage
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
      localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(requisitions));
      localStorage.setItem(STORAGE_KEYS.EPI_DELIVERIES, JSON.stringify(deliveries));

      // Audit log
      this.addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'ATENDIMENTO_REQUISICAO',
        entity: 'EPIDelivery',
        entityId: deliveryId,
        details: `Entrega de materiais da requisição ${req.number} para ${req.employeeName}. Status atual: ${req.status.toUpperCase()}.`,
        ipOrSession: 'Sessão Web',
      });

      notifyListeners();
      return {
        success: true,
        message: `Entrega confirmada com sucesso! Requisição atualizada para "${req.status === 'atendida' ? 'Atendida Totalmente' : 'Parcialmente Atendida'}".`,
        delivery: newDelivery,
      };
    } finally {
      isTransactionLocked = false;
    }
  },

  // EPI DELIVERIES
  getEPIDeliveries(): EPIDelivery[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EPI_DELIVERIES);
    return raw ? JSON.parse(raw) : [];
  },

  getEPIDeliveriesByEmployee(employeeId: string): EPIDelivery[] {
    return this.getEPIDeliveries().filter((d) => d.employeeId === employeeId);
  },

  // SHELVES
  getShelves(): ShelfLocation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SHELVES);
    return raw ? JSON.parse(raw) : [];
  },

  getShelfByCode(code: string): ShelfLocation | undefined {
    const clean = code.trim().toUpperCase();
    return this.getShelves().find((s) => s.code.toUpperCase() === clean);
  },

  createShelf(
    shelf: Omit<ShelfLocation, 'id'>,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; shelf?: ShelfLocation } {
    const shelves = this.getShelves();
    const duplicate = shelves.find((s) => s.code.toUpperCase() === shelf.code.trim().toUpperCase());
    if (duplicate) {
      return { success: false, message: `A localização "${shelf.code}" já está cadastrada.` };
    }

    const newShelf: ShelfLocation = {
      ...shelf,
      id: 'shelf-' + Math.random().toString(36).substring(2, 9),
      code: shelf.code.trim().toUpperCase(),
    };

    shelves.push(newShelf);
    localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify(shelves));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CADASTRAR_LOCALIZACAO',
      entity: 'System',
      entityId: newShelf.id,
      details: `Nova prateleira cadastrada: ${newShelf.code} (${newShelf.zone})`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: 'Localização cadastrada com sucesso!', shelf: newShelf };
  },

  // USERS
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : SEED_USERS;
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  createUser(
    userData: { name: string; email: string; role: UserRole; matricula: string; active?: boolean },
    byUser: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanMatricula = userData.matricula.trim().toUpperCase();

    const duplicateEmail = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      return { success: false, message: `Já existe um usuário com o e-mail "${userData.email}".` };
    }

    const duplicateMat = users.find((u) => u.matricula.toUpperCase() === cleanMatricula);
    if (duplicateMat) {
      return { success: false, message: `Já existe um usuário com a matrícula "${userData.matricula}".` };
    }

    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: userData.name.trim(),
      email: cleanEmail,
      role: userData.role,
      matricula: cleanMatricula,
      active: userData.active !== undefined ? userData.active : true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addAuditLog({
      userId: byUser.id,
      userName: byUser.name,
      userRole: byUser.role,
      action: 'CADASTRAR_USUARIO',
      entity: 'System',
      entityId: newUser.id,
      details: `Novo usuário cadastrado: ${newUser.name} (${newUser.matricula}, Perfil: ${newUser.role}).`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return { success: true, message: 'Usuário cadastrado com sucesso!', user: newUser };
  },

  updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>,
    byUser: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, message: 'Usuário não encontrado.' };

    const target = users[idx];

    if (updates.email && updates.email.toLowerCase() !== target.email.toLowerCase()) {
      const dup = users.find(
        (u) => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase()
      );
      if (dup) return { success: false, message: `O e-mail "${updates.email}" já está em uso.` };
    }

    if (updates.matricula && updates.matricula.toUpperCase() !== target.matricula.toUpperCase()) {
      const dup = users.find(
        (u) => u.id !== id && u.matricula.toUpperCase() === updates.matricula!.toUpperCase()
      );
      if (dup) return { success: false, message: `A matrícula "${updates.matricula}" já está em uso.` };
    }

    const updated: User = {
      ...target,
      ...updates,
      name: updates.name ? updates.name.trim() : target.name,
      email: updates.email ? updates.email.trim().toLowerCase() : target.email,
      matricula: updates.matricula ? updates.matricula.trim().toUpperCase() : target.matricula,
    };

    users[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addAuditLog({
      userId: byUser.id,
      userName: byUser.name,
      userRole: byUser.role,
      action: 'ATUALIZAR_USUARIO',
      entity: 'System',
      entityId: id,
      details: `Atualização de cadastro do usuário ${updated.name} (${updated.matricula}, Perfil: ${updated.role}, Situação: ${updated.active ? 'Ativo' : 'Bloqueado'}).`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return { success: true, message: 'Dados do usuário atualizados com sucesso!', user: updated };
  },

  toggleUserStatus(
    id: string,
    byUser: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; active?: boolean } {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, message: 'Usuário não encontrado.' };

    const target = users[idx];
    if (target.id === byUser.id) {
      return { success: false, message: 'Você não pode desativar seu próprio usuário em sessão.' };
    }

    target.active = !target.active;
    users[idx] = target;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addAuditLog({
      userId: byUser.id,
      userName: byUser.name,
      userRole: byUser.role,
      action: 'ALTERAR_SITUACAO_USUARIO',
      entity: 'System',
      entityId: id,
      details: `Situação do usuário ${target.name} (${target.matricula}) alterada para ${target.active ? 'ATIVO' : 'BLOQUEADO'}.`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return {
      success: true,
      message: `Usuário ${target.name} foi ${target.active ? 'reativado' : 'bloqueado'} com sucesso.`,
      active: target.active,
    };
  },

  // REGIONS (Paulista, Taquá, Penha, etc.)
  getRegions(): Region[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REGIONS);
    return raw ? JSON.parse(raw) : SEED_REGIONS;
  },

  getRegionById(id: string): Region | undefined {
    return this.getRegions().find((r) => r.id === id);
  },

  createRegion(
    data: { code: string; name: string; supervisor?: string; active?: boolean },
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; region?: Region } {
    const regions = this.getRegions();
    const cleanName = data.name.trim();
    const cleanCode = data.code.trim().toUpperCase();

    const exists = regions.find(
      (r) => r.name.toLowerCase() === cleanName.toLowerCase() || r.code.toUpperCase() === cleanCode
    );
    if (exists) {
      return { success: false, message: `A região "${cleanName}" ou código "${cleanCode}" já está cadastrada.` };
    }

    const newRegion: Region = {
      id: 'reg-' + Math.random().toString(36).substring(2, 9),
      code: cleanCode,
      name: cleanName,
      supervisor: data.supervisor ? data.supervisor.trim() : undefined,
      active: data.active !== undefined ? data.active : true,
      createdAt: new Date().toISOString(),
    };

    regions.push(newRegion);
    localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(regions));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CADASTRAR_REGIAO',
      entity: 'System',
      entityId: newRegion.id,
      details: `Nova região operacional cadastrada: ${newRegion.name} (${newRegion.code}).`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return { success: true, message: `Região "${newRegion.name}" cadastrada com sucesso!`, region: newRegion };
  },

  updateRegion(
    id: string,
    updates: Partial<Omit<Region, 'id' | 'createdAt'>>,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; region?: Region } {
    const regions = this.getRegions();
    const idx = regions.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, message: 'Região não encontrada.' };

    const target = regions[idx];
    const updated: Region = {
      ...target,
      ...updates,
      name: updates.name ? updates.name.trim() : target.name,
      code: updates.code ? updates.code.trim().toUpperCase() : target.code,
    };

    regions[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(regions));

    // Update employees assigned to this region if name was updated
    if (updates.name && updates.name.trim() !== target.name) {
      const employees = this.getEmployees();
      let changed = false;
      employees.forEach((emp) => {
        if (emp.regionId === id) {
          emp.regionName = updates.name!.trim();
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
      }
    }

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ATUALIZAR_REGIAO',
      entity: 'System',
      entityId: id,
      details: `Região atualizada: ${updated.name} (${updated.code}).`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return { success: true, message: `Região "${updated.name}" atualizada com sucesso!`, region: updated };
  },

  assignEmployeeRegion(
    employeeId: string,
    regionId: string,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string } {
    const employees = this.getEmployees();
    const empIdx = employees.findIndex((e) => e.id === employeeId);
    if (empIdx === -1) return { success: false, message: 'Funcionário não encontrado.' };

    const regions = this.getRegions();
    const reg = regions.find((r) => r.id === regionId);
    if (!reg) return { success: false, message: 'Região selecionada não existe.' };

    const emp = employees[empIdx];
    emp.regionId = reg.id;
    emp.regionName = reg.name;
    emp.updatedAt = new Date().toISOString();
    employees[empIdx] = emp;

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'VINCULAR_REGIAO_FUNCIONARIO',
      entity: 'Employee',
      entityId: emp.id,
      details: `Colaborador ${emp.matricula} - ${emp.name} vinculado à Regional ${reg.name}.`,
      ipOrSession: 'Sessão Web Segura',
    });

    notifyListeners();
    return { success: true, message: `Colaborador ${emp.name} vinculado à região ${reg.name}!` };
  },

  // REGIONAL CONSUMPTION & MONTHLY COMPARISON
  getRegionalConsumptionSummary(selectedMonth?: string) {
    const movements = this.getMovements();
    const regions = this.getRegions();
    const materials = this.getMaterials();
    const employees = this.getEmployees();

    // Filter only exit movements (withdrawals/consumptions)
    let exitMovements = movements.filter((m) => m.type.startsWith('SAIDA_'));

    if (selectedMonth && selectedMonth !== 'todos') {
      exitMovements = exitMovements.filter((m) => m.date.startsWith(selectedMonth));
    }

    // Aggregates by Region
    const regionStats: Record<
      string,
      {
        regionId: string;
        regionName: string;
        code: string;
        totalUnits: number;
        totalMovements: number;
        employeesCount: number;
        topProducts: Record<string, { code: string; name: string; qty: number; category: string }>;
        categoryBreakdown: Record<string, number>;
      }
    > = {};

    regions.forEach((rg) => {
      const empsInReg = employees.filter((e) => e.regionId === rg.id).length;
      regionStats[rg.id] = {
        regionId: rg.id,
        regionName: rg.name,
        code: rg.code,
        totalUnits: 0,
        totalMovements: 0,
        employeesCount: empsInReg,
        topProducts: {},
        categoryBreakdown: {},
      };
    });

    exitMovements.forEach((mov) => {
      // Find matching region
      let regId = mov.regionId;
      if (!regId && mov.regionName) {
        const found = regions.find((r) => r.name.toLowerCase() === mov.regionName?.toLowerCase());
        if (found) regId = found.id;
      }
      if (!regId && mov.employeeId) {
        const emp = employees.find((e) => e.id === mov.employeeId);
        if (emp && emp.regionId) regId = emp.regionId;
      }

      if (regId && regionStats[regId]) {
        const stat = regionStats[regId];
        stat.totalUnits += mov.quantity;
        stat.totalMovements += 1;

        // Product stats
        if (!stat.topProducts[mov.materialCode]) {
          const mat = materials.find((m) => m.code === mov.materialCode);
          stat.topProducts[mov.materialCode] = {
            code: mov.materialCode,
            name: mov.materialName,
            qty: 0,
            category: mat ? mat.category : 'Consumíveis',
          };
        }
        stat.topProducts[mov.materialCode].qty += mov.quantity;

        // Category stats
        const cat = stat.topProducts[mov.materialCode].category;
        stat.categoryBreakdown[cat] = (stat.categoryBreakdown[cat] || 0) + mov.quantity;
      }
    });

    return {
      regionsList: Object.values(regionStats),
      totalGlobalUnits: exitMovements.reduce((sum, m) => sum + m.quantity, 0),
      totalExitMovementsCount: exitMovements.length,
      exitMovements,
    };
  },

  // EXCEL SYNC LOGS
  getExcelSyncLogs(): ExcelSyncLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXCEL_LOGS);
    return raw ? JSON.parse(raw) : [];
  },

  addExcelSyncLog(log: ExcelSyncLog) {
    const logs = this.getExcelSyncLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.EXCEL_LOGS, JSON.stringify(logs.slice(0, 50)));
    notifyListeners();
  },

  // IDEMPOTENCY LOCK
  isIdempotencyKeyProcessed(key?: string): boolean {
    if (!key) return false;
    const raw = localStorage.getItem(STORAGE_KEYS.IDEMPOTENCY_KEYS);
    const keys: string[] = raw ? JSON.parse(raw) : [];
    return keys.includes(key);
  },

  markIdempotencyKeyProcessed(key?: string) {
    if (!key) return;
    const raw = localStorage.getItem(STORAGE_KEYS.IDEMPOTENCY_KEYS);
    const keys: string[] = raw ? JSON.parse(raw) : [];
    if (!keys.includes(key)) {
      keys.push(key);
      localStorage.setItem(STORAGE_KEYS.IDEMPOTENCY_KEYS, JSON.stringify(keys.slice(-500)));
    }
  },

  // SYSTEM METRICS (Dynamically computed from live database, never hardcoded!)
  getSystemMetrics() {
    const materials = this.getMaterials();
    const movements = this.getMovements();
    const requisitions = this.getRequisitions();
    const deliveries = this.getEPIDeliveries();

    const activeMaterials = materials.filter((m) => m.status === 'ativo');
    const totalUnits = activeMaterials.reduce((acc, m) => acc + m.currentStock, 0);
    const belowMinStockItems = activeMaterials.filter((m) => m.currentStock <= m.minStock);
    const criticalZeroStock = activeMaterials.filter((m) => m.currentStock === 0);

    const pendingRequisitions = requisitions.filter(
      (r) => r.status === 'enviada' || r.status === 'pendente' || r.status === 'parcialmente_atendida'
    );
    const newRequisitionsCount = requisitions.filter(
      (r) => r.isNewNotification || r.status === 'enviada'
    ).length;

    const totalEpiDelivered = deliveries.reduce((acc, d) => {
      return acc + d.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    // Calculate movements in the current month
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyMovements = movements.filter((m) => m.date.startsWith(currentMonthPrefix));

    const totalEntriesCount = movements.filter((m) => m.type.startsWith('ENTRADA_')).length;
    const totalExitsCount = movements.filter((m) => m.type.startsWith('SAIDA_')).length;

    const totalEntriesQty = movements
      .filter((m) => m.type.startsWith('ENTRADA_'))
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalExitsQty = movements
      .filter((m) => m.type.startsWith('SAIDA_'))
      .reduce((sum, m) => sum + m.quantity, 0);

    return {
      totalUnits,
      registeredMaterialsCount: activeMaterials.length,
      belowMinStockCount: belowMinStockItems.length,
      criticalZeroStockCount: criticalZeroStock.length,
      belowMinStockItems,
      pendingRequisitionsCount: pendingRequisitions.length,
      newRequisitionsCount,
      totalEpiDelivered,
      totalEntriesCount,
      totalExitsCount,
      totalEntriesQty,
      totalExitsQty,
      monthlyMovementsCount: monthlyMovements.length,
      allMovementsCount: movements.length,
    };
  },

  // ACTIVE SYSTEM ALERTS
  getSystemAlerts(): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    const materials = this.getMaterials();
    const requisitions = this.getRequisitions();

    // Critical stock items
    materials
      .filter((m) => m.status === 'ativo' && m.currentStock <= m.minStock)
      .forEach((m) => {
        if (m.currentStock === 0) {
          alerts.push({
            id: 'alert-zero-' + m.id,
            type: 'OUT_OF_STOCK',
            title: `Material Esgotado: ${m.code}`,
            message: `O item "${m.name}" está com saldo ZERO na localização ${m.shelf}.`,
            severity: 'danger',
            date: m.updatedAt,
            resolved: false,
            link: `/materiais?id=${m.id}`,
          });
        } else {
          alerts.push({
            id: 'alert-low-' + m.id,
            type: 'CRITICAL_STOCK',
            title: `Estoque Baixo: ${m.code}`,
            message: `Saldo atual (${m.currentStock} ${m.unit}) abaixo do mínimo exigido (${m.minStock} ${m.unit}).`,
            severity: 'warning',
            date: m.updatedAt,
            resolved: false,
            link: `/materiais?id=${m.id}`,
          });
        }
      });

    // Pending high/critical requisitions
    requisitions
      .filter((r) => r.status === 'pendente' && (r.priority === 'alta' || r.priority === 'critica'))
      .forEach((r) => {
        alerts.push({
          id: 'alert-req-' + r.id,
          type: 'PENDING_REQ',
          title: `Requisição Urgente Pendente: ${r.number}`,
          message: `Solicitação para ${r.employeeName} (${r.sector}) aguardando atendimento do almoxarife.`,
          severity: r.priority === 'critica' ? 'danger' : 'warning',
          date: r.createdAt,
          resolved: false,
          link: `/atendimento?req=${r.number}`,
        });
      });

    return alerts;
  },
};
