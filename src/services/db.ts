import {
  Material,
  MaterialPhysicalLocation,
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
  Vehicle,
  FuelingRecord,
  MaintenancePlan,
  ServiceOrder,
  ServiceOrderPartItem,
  VehicleTimelineEvent,
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
  VEHICLES: 'cplu_vehicles_v1',
  FUELINGS: 'cplu_fuelings_v1',
  MAINTENANCE_PLANS: 'cplu_maintenance_plans_v1',
  SERVICE_ORDERS: 'cplu_service_orders_v1',
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
  {
    id: 'reg-006',
    code: 'REG-IPR',
    name: 'Ipiranga',
    supervisor: 'Eduardo Martins',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
];

// Initial realistic seed dataset for Limpeza Urbana operations with official IKKI codes and physical locations
export const SEED_MATERIALS: Material[] = [
  {
    id: 'mat-020',
    code: '005230',
    ikkiCode: '005230',
    name: 'Calça de Brim Azul Operacional',
    description: 'Calça operacional em brim 100% algodão azul royal com reforço entrepernas e elástico total.',
    category: 'Uniformes',
    unit: 'UN',
    currentStock: 50,
    minStock: 20,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'Corredor 2, Prat. 3, Nív. 2',
    physicalLocations: [
      {
        id: 'loc-020-1',
        aisle: 'Corredor 2',
        shelf: 'Prateleira 3',
        level: 'Nível 2',
        quantity: 50,
        updatedAt: '2026-03-01T08:00:00Z',
      },
    ],
    status: 'ativo',
    supplier: 'Tecidos & Uniformes Brasil',
    isEpi: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat-001',
    code: '001420',
    ikkiCode: '001420',
    name: 'Luva de Vaqueta Mista Reforçada',
    description: 'Luva de segurança em vaqueta na palma e raspa no dorso para serviços pesados de coleta e capina.',
    category: 'EPI',
    unit: 'PAR',
    currentStock: 120,
    minStock: 50,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'Corredor 1, Prat. 3, Nív. 2',
    physicalLocations: [
      {
        id: 'loc-001-1',
        aisle: 'Corredor 1',
        shelf: 'Prateleira 3',
        level: 'Nível 2',
        quantity: 80,
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'loc-001-2',
        aisle: 'Corredor 1',
        shelf: 'Prateleira 1',
        level: 'Nível 1',
        quantity: 40,
        updatedAt: '2026-03-01T10:00:00Z',
      },
    ],
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
    code: '001421',
    ikkiCode: '001421',
    name: 'Botina de Segurança Nobuck Bico Composite',
    description: 'Calçado de segurança fechado com biqueira composite e solado bi-densidade anti-perfuração.',
    category: 'EPI',
    unit: 'PAR',
    currentStock: 18, // Below minimum to trigger alert
    minStock: 30,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'Corredor 2, Prat. 2, Nív. 1',
    physicalLocations: [
      {
        id: 'loc-002-1',
        aisle: 'Corredor 2',
        shelf: 'Prateleira 2',
        level: 'Nível 1',
        quantity: 18,
        updatedAt: '2026-03-05T14:30:00Z',
      },
    ],
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
    code: '002105',
    ikkiCode: '002105',
    name: 'Colete Refletivo Laranja Alta Visibilidade Classe 2',
    description: 'Colete com faixas refletivas prismáticas homologado para trânsito e varrição noturna.',
    category: 'EPI',
    unit: 'UN',
    currentStock: 85,
    minStock: 40,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'Corredor 1, Prat. 4, Nív. 3',
    physicalLocations: [
      {
        id: 'loc-003-1',
        aisle: 'Corredor 1',
        shelf: 'Prateleira 4',
        level: 'Nível 3',
        quantity: 85,
        updatedAt: '2026-02-15T11:00:00Z',
      },
    ],
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
    code: '003890',
    ikkiCode: '003890',
    name: 'Óculos de Proteção Ampla Visão Anti-embaçante',
    description: 'Óculos de policarbonato incolor com ventilação indireta e tratamento UV.',
    category: 'EPI',
    unit: 'UN',
    currentStock: 4, // Critical stock!
    minStock: 25,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'Corredor 3, Prat. 1, Nív. 2',
    physicalLocations: [
      {
        id: 'loc-004-1',
        aisle: 'Corredor 3',
        shelf: 'Prateleira 1',
        level: 'Nível 2',
        quantity: 4,
        updatedAt: '2026-03-10T09:15:00Z',
      },
    ],
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
    code: '004510',
    ikkiCode: '004510',
    name: 'Protetor Auricular Tipo Concha 24dB',
    description: 'Atenuador de ruído acoplável a capacete para operadores de roçadeira e trituradores.',
    category: 'EPI',
    unit: 'UN',
    currentStock: 35,
    minStock: 20,
    location: 'Galpão A - Almoxarifado Central',
    shelf: 'Corredor 3, Prat. 2, Nív. 1',
    physicalLocations: [
      {
        id: 'loc-005-1',
        aisle: 'Corredor 3',
        shelf: 'Prateleira 2',
        level: 'Nível 1',
        quantity: 35,
        updatedAt: '2026-02-28T16:00:00Z',
      },
    ],
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
  {
    id: 'mat-mec-001',
    code: '008120',
    ikkiCode: '008120',
    name: 'Óleo Lubrificante 15W40 Mineral Motor Diesel',
    description: 'Óleo mineral multiviscoso API CI-4 para motores pesados de caminhões coletores.',
    category: 'Peças & Mecânica',
    unit: 'LT',
    currentStock: 240,
    minStock: 60,
    location: 'Galpão Mecânica - Lubrificantes',
    shelf: 'Corredor M1, Prat. 1, Nív. 1',
    physicalLocations: [
      {
        id: 'loc-mec-001',
        aisle: 'Corredor M1',
        shelf: 'Prateleira 1',
        level: 'Nível 1',
        quantity: 240,
        updatedAt: '2026-03-01T08:00:00Z',
      },
    ],
    status: 'ativo',
    supplier: 'Lubrificantes Ipiranga / Mobil',
    isEpi: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat-mec-002',
    code: '008121',
    ikkiCode: '008121',
    name: 'Filtro de Óleo Lubrificante Motor MB/VW',
    description: 'Elemento filtrante blindado de alta retenção para caminhões compactadores Atego e Constellation.',
    category: 'Peças & Mecânica',
    unit: 'UN',
    currentStock: 18,
    minStock: 6,
    location: 'Galpão Mecânica - Filtros',
    shelf: 'Corredor M1, Prat. 2, Nív. 2',
    physicalLocations: [
      {
        id: 'loc-mec-002',
        aisle: 'Corredor M1',
        shelf: 'Prateleira 2',
        level: 'Nível 2',
        quantity: 18,
        updatedAt: '2026-03-01T08:00:00Z',
      },
    ],
    status: 'ativo',
    supplier: 'Mann-Filter Brasil',
    isEpi: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat-mec-003',
    code: '008122',
    ikkiCode: '008122',
    name: 'Filtro Separador Combustível / Água Racor',
    description: 'Filtro sedimentador com dreno para proteção do sistema de injeção Common Rail contra umidade do diesel.',
    category: 'Peças & Mecânica',
    unit: 'UN',
    currentStock: 14,
    minStock: 5,
    location: 'Galpão Mecânica - Filtros',
    shelf: 'Corredor M1, Prat. 2, Nív. 3',
    status: 'ativo',
    supplier: 'Parker Hannifin',
    isEpi: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat-mec-004',
    code: '008123',
    ikkiCode: '008123',
    name: 'Jogo de Pastilhas de Freio Dianteiro Heavy Duty',
    description: 'Conjunto de pastilhas sinterizadas para freio a disco pneumático de eixos dianteiros.',
    category: 'Peças & Mecânica',
    unit: 'PAR',
    currentStock: 8,
    minStock: 4,
    location: 'Galpão Mecânica - Freios',
    shelf: 'Corredor M2, Prat. 1, Nív. 2',
    status: 'ativo',
    supplier: 'Fras-le Peças Automotivas',
    isEpi: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat-mec-005',
    code: '008124',
    ikkiCode: '008124',
    name: 'Chapa de Desgaste da Prensa Compactadora',
    description: 'Chapa de aço Hardox 450 antidesgaste para calha de compressão do compactador traseiro.',
    category: 'Peças & Mecânica',
    unit: 'UN',
    currentStock: 3,
    minStock: 2,
    location: 'Galpão Mecânica - Caldeiraria',
    shelf: 'Palete Metal 03',
    status: 'ativo',
    supplier: 'Usicamp Caçambas',
    isEpi: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat-mec-006',
    code: '008125',
    ikkiCode: '008125',
    name: 'Pneu Radial 275/80 R22.5 Borrachudo de Tração',
    description: 'Pneu para eixo de tração com desenho misto e alta durabilidade para tráfego urbano e transbordo.',
    category: 'Peças & Mecânica',
    unit: 'UN',
    currentStock: 12,
    minStock: 6,
    location: 'Galpão Mecânica - Pátio Pneus',
    shelf: 'Rack de Pneus 01',
    status: 'ativo',
    supplier: 'Michelin Brasil / Bridgestone',
    isEpi: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat-mec-007',
    code: '008126',
    ikkiCode: '008126',
    name: 'Graxa Especial de Lítio EP-2 com Bissulfeto (Balde 20kg)',
    description: 'Graxa de alta adesividade e extrema pressão para articulações da caçamba e pinos de compactadores.',
    category: 'Peças & Mecânica',
    unit: 'KG',
    currentStock: 60,
    minStock: 20,
    location: 'Galpão Mecânica - Lubrificantes',
    shelf: 'Corredor M1, Prat. 1, Nív. Chão',
    status: 'ativo',
    supplier: 'Texaco / Shell',
    isEpi: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
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
    stampedNumber: '08-14',
    regionName: 'Paulista',
    regionId: 'reg-001',
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
    regionName: 'Penha',
    regionId: 'reg-003',
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

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'veh-001',
    fleetNumber: 'COMP-01',
    plate: 'CPL-1947',
    type: 'compactador',
    brand: 'Mercedes-Benz',
    model: 'Atego 1729 Compactor 15m³',
    year: 2023,
    fuelType: 'diesel_s10',
    tankCapacityLiters: 210,
    currentOdometerKm: 48500,
    currentHourmeterHours: 3820,
    acquisitionDate: '2023-04-10',
    subRegion: 'Ipiranga',
    status: 'disponivel',
    notes: 'Caminhão compactador principal do setor Ipiranga. Equipado com prensa hidráulica Usicamp.',
    createdAt: '2023-04-10T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'veh-002',
    fleetNumber: 'COMP-02',
    plate: 'BRA2E19',
    type: 'compactador',
    brand: 'Volkswagen',
    model: 'Constellation 17.260 Compactor 15m³',
    year: 2024,
    fuelType: 'diesel_s10',
    tankCapacityLiters: 275,
    currentOdometerKm: 32400,
    currentHourmeterHours: 2650,
    acquisitionDate: '2024-02-15',
    subRegion: 'Paulista',
    status: 'em_operacao',
    notes: 'Operação de coleta noturna e diurna contínua na região da Avenida Paulista.',
    createdAt: '2024-02-15T08:00:00Z',
    updatedAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 'veh-003',
    fleetNumber: 'BASC-01',
    plate: 'FXP-4180',
    type: 'basculante',
    brand: 'Ford',
    model: 'Cargo 1723 Basculante Caçamba 8m³',
    year: 2022,
    fuelType: 'diesel_s10',
    tankCapacityLiters: 210,
    currentOdometerKm: 78900,
    currentHourmeterHours: 2150,
    acquisitionDate: '2022-07-20',
    subRegion: 'Taquá',
    status: 'disponivel',
    notes: 'Transporte de entulhos de capina, terra e podas pesadas na Regional Taquá.',
    createdAt: '2022-07-20T08:00:00Z',
    updatedAt: '2026-02-28T08:00:00Z',
  },
  {
    id: 'veh-004',
    fleetNumber: 'PIPA-01',
    plate: 'ETI-9912',
    type: 'pipa',
    brand: 'Mercedes-Benz',
    model: 'Atego 2730 6x4 Pipa 15.000 Litros',
    year: 2023,
    fuelType: 'diesel_s10',
    tankCapacityLiters: 300,
    currentOdometerKm: 34100,
    currentHourmeterHours: 1980,
    acquisitionDate: '2023-09-01',
    subRegion: 'Sé / Centro',
    status: 'disponivel',
    notes: 'Lavagem de feiras livres, calçadões do Centro Histórico e umectação de vias.',
    createdAt: '2023-09-01T08:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z',
  },
  {
    id: 'veh-005',
    fleetNumber: 'APOIO-01',
    plate: 'RHO-3C44',
    type: 'apoio',
    brand: 'Fiat',
    model: 'Strada Endurance 1.4 Cabine Plus',
    year: 2024,
    fuelType: 'gasolina',
    tankCapacityLiters: 55,
    currentOdometerKm: 28400,
    currentHourmeterHours: 740,
    acquisitionDate: '2024-05-10',
    subRegion: 'Penha',
    status: 'disponivel',
    notes: 'Veículo utilitário de fiscalização operacional e transporte rápido de ferramentas.',
    createdAt: '2024-05-10T08:00:00Z',
    updatedAt: '2026-03-08T08:00:00Z',
  },
  {
    id: 'veh-006',
    fleetNumber: 'COMP-03',
    plate: 'GDK-7104',
    type: 'compactador',
    brand: 'Iveco',
    model: 'Tector 17-300 Compactor 15m³',
    year: 2022,
    fuelType: 'diesel_s10',
    tankCapacityLiters: 275,
    currentOdometerKm: 91200,
    currentHourmeterHours: 6840,
    acquisitionDate: '2022-03-12',
    subRegion: 'Santana',
    status: 'em_manutencao',
    notes: 'Em manutenção corretiva na oficina central para substituição de vedação de pistão hidráulico.',
    createdAt: '2022-03-12T08:00:00Z',
    updatedAt: '2026-03-12T08:00:00Z',
  },
];

export const SEED_FUELINGS: FuelingRecord[] = [
  {
    id: 'fuel-001',
    vehicleId: 'veh-001',
    fleetNumber: 'COMP-01',
    plate: 'CPL-1947',
    dateTime: '2026-03-10T07:15:00Z',
    driverName: 'Antônio Marcos',
    fuelType: 'diesel_s10',
    liters: 130,
    unitPrice: 5.89,
    totalCost: 765.7,
    odometerKm: 48500,
    hourmeterHours: 3820,
    pumpMeterVolume: 130,
    pumpId: 'Bomba 01 - Diesel S10 Central',
    stationLocation: 'Posto Interno CPLU Almoxarifado',
    documentNumber: 'NF-66401',
    fullTank: true,
    kmDistanceSinceLast: 320,
    calculatedKmPerLiter: 2.46,
    costPerKm: 2.39,
    createdByUserName: 'Marcos Vinícius Dias',
    createdAt: '2026-03-10T07:15:00Z',
  },
  {
    id: 'fuel-002',
    vehicleId: 'veh-001',
    fleetNumber: 'COMP-01',
    plate: 'CPL-1947',
    dateTime: '2026-03-07T06:40:00Z',
    driverName: 'Antônio Marcos',
    fuelType: 'diesel_s10',
    liters: 135,
    unitPrice: 5.89,
    totalCost: 795.15,
    odometerKm: 48180,
    hourmeterHours: 3795,
    pumpMeterVolume: 135,
    pumpId: 'Bomba 01 - Diesel S10 Central',
    stationLocation: 'Posto Interno CPLU Almoxarifado',
    documentNumber: 'NF-66250',
    fullTank: true,
    kmDistanceSinceLast: 310,
    calculatedKmPerLiter: 2.30,
    costPerKm: 2.56,
    createdByUserName: 'Marcos Vinícius Dias',
    createdAt: '2026-03-07T06:40:00Z',
  },
  {
    id: 'fuel-003',
    vehicleId: 'veh-002',
    fleetNumber: 'COMP-02',
    plate: 'BRA2E19',
    dateTime: '2026-03-11T19:30:00Z',
    driverName: 'Sérgio Ricardo',
    fuelType: 'diesel_s10',
    liters: 160,
    unitPrice: 5.89,
    totalCost: 942.4,
    odometerKm: 32400,
    hourmeterHours: 2650,
    pumpMeterVolume: 160,
    pumpId: 'Bomba 01 - Diesel S10 Central',
    stationLocation: 'Posto Interno CPLU Almoxarifado',
    documentNumber: 'NF-66480',
    fullTank: true,
    kmDistanceSinceLast: 410,
    calculatedKmPerLiter: 2.56,
    costPerKm: 2.30,
    createdByUserName: 'Marcos Vinícius Dias',
    createdAt: '2026-03-11T19:30:00Z',
  },
  {
    id: 'fuel-004',
    vehicleId: 'veh-005',
    fleetNumber: 'APOIO-01',
    plate: 'RHO-3C44',
    dateTime: '2026-03-08T11:00:00Z',
    driverName: 'Leandro Viana',
    fuelType: 'gasolina',
    liters: 42,
    unitPrice: 6.15,
    totalCost: 258.3,
    odometerKm: 28400,
    hourmeterHours: 740,
    pumpMeterVolume: 42,
    pumpId: 'Bomba 03 - Gasolina Conveniada',
    stationLocation: 'Posto Conveniado Shell Radial',
    documentNumber: 'CUPOM-88319',
    fullTank: true,
    kmDistanceSinceLast: 480,
    calculatedKmPerLiter: 11.43,
    costPerKm: 0.54,
    createdByUserName: 'Marcos Vinícius Dias',
    createdAt: '2026-03-08T11:00:00Z',
  },
];

export const SEED_MAINTENANCE_PLANS: MaintenancePlan[] = [
  {
    id: 'plan-001',
    vehicleId: 'veh-001',
    fleetNumber: 'COMP-01',
    serviceCategory: 'Troca de Óleo de Motor & Filtros',
    description: 'Substituição de óleo 15W40 CI-4 e troca dos filtros de óleo e separador de combustível.',
    intervalKm: 10000,
    intervalHours: 250,
    lastExecutedDate: '2026-01-20T08:00:00Z',
    lastExecutedKm: 40000,
    lastExecutedHours: 3600,
    nextDueKm: 50000,
    nextDueHours: 3850,
    nextDueDate: '2026-04-20',
    status: 'proxima',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'plan-002',
    vehicleId: 'veh-001',
    fleetNumber: 'COMP-01',
    serviceCategory: 'Engraxamento de Chassi e Pinos da Prensa',
    description: 'Engraxamento minucioso dos pinos, mancais da caçamba e articulações da prensa hidráulica com graxa de lítio.',
    intervalHours: 100,
    intervalDays: 15,
    lastExecutedDate: '2026-03-01T08:00:00Z',
    lastExecutedKm: 47800,
    lastExecutedHours: 3750,
    nextDueHours: 3850,
    nextDueDate: '2026-03-16',
    status: 'em_dia',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'plan-003',
    vehicleId: 'veh-006',
    fleetNumber: 'COMP-03',
    serviceCategory: 'Revisão do Sistema de Freios e Cuícas',
    description: 'Inspeção de pastilhas, lonas, tambores e cuícas pneumáticas de acionamento.',
    intervalKm: 15000,
    lastExecutedDate: '2025-10-10T08:00:00Z',
    lastExecutedKm: 75000,
    lastExecutedHours: 5900,
    nextDueKm: 90000,
    nextDueDate: '2026-02-15',
    status: 'vencida',
    createdAt: '2025-10-10T08:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z',
  },
  {
    id: 'plan-004',
    vehicleId: 'veh-002',
    fleetNumber: 'COMP-02',
    serviceCategory: 'Troca de Óleo de Motor & Filtros',
    description: 'Revisão periódica motor Man D08 4 cilindros com óleo sintético/mineral.',
    intervalKm: 10000,
    intervalHours: 250,
    lastExecutedDate: '2026-02-05T08:00:00Z',
    lastExecutedKm: 25000,
    lastExecutedHours: 2420,
    nextDueKm: 35000,
    nextDueHours: 2670,
    nextDueDate: '2026-05-05',
    status: 'em_dia',
    createdAt: '2026-02-05T08:00:00Z',
    updatedAt: '2026-02-05T08:00:00Z',
  },
];

export const SEED_SERVICE_ORDERS: ServiceOrder[] = [
  {
    id: 'os-001',
    orderNumber: 'OS-2026-0001',
    vehicleId: 'veh-001',
    fleetNumber: 'COMP-01',
    plate: 'CPL-1947',
    openedAt: '2026-01-20T08:30:00Z',
    closedAt: '2026-01-20T16:00:00Z',
    type: 'preventiva',
    priority: 'normal',
    status: 'concluida',
    description: 'Manutenção preventiva programada de 40.000 km (Troca de óleo de motor e filtros).',
    diagnosis: 'Veículo em perfeito estado mecânico geral. Necessitou apenas troca rotineira de óleo e filtros.',
    servicesRendered: 'Substituição de 28 litros de óleo 15W40, troca do filtro de óleo lubrificante e dreno do sedimentador.',
    odometerKm: 40000,
    hourmeterHours: 3600,
    partsUsed: [
      {
        materialId: 'mat-mec-001',
        code: '008120',
        name: 'Óleo Lubrificante 15W40 Mineral Motor Diesel',
        quantity: 28,
        unitCost: 28.5,
        totalCost: 798,
      },
      {
        materialId: 'mat-mec-002',
        code: '008121',
        name: 'Filtro de Óleo Lubrificante Motor MB/VW',
        quantity: 1,
        unitCost: 95,
        totalCost: 95,
      },
    ],
    laborCost: 250,
    externalCost: 0,
    totalCost: 1143,
    downtimeHours: 7.5,
    mechanicName: 'José Valdir Mendonça',
    workshop: 'Oficina Interna CPLU',
    createdByUserName: 'Marcos Vinícius Dias',
    createdAt: '2026-01-20T08:30:00Z',
    updatedAt: '2026-01-20T16:00:00Z',
  },
  {
    id: 'os-002',
    orderNumber: 'OS-2026-0002',
    vehicleId: 'veh-006',
    fleetNumber: 'COMP-03',
    plate: 'GDK-7104',
    openedAt: '2026-03-12T08:00:00Z',
    type: 'corretiva',
    priority: 'alta',
    status: 'em_execucao',
    description: 'Vazamento excessivo de fluido hidráulico na haste do pistão da prensa traseira.',
    diagnosis: 'Retentor da haste danificado por resíduo cortante; necessária substituição de reparos e chapa guia.',
    servicesRendered: 'Desmontagem do cilindro hidráulico para brunimento e troca dos anéis raspadores.',
    odometerKm: 91200,
    hourmeterHours: 6840,
    partsUsed: [
      {
        materialId: 'mat-mec-007',
        code: '008126',
        name: 'Graxa Especial de Lítio EP-2 com Bissulfeto (Balde 20kg)',
        quantity: 5,
        unitCost: 42,
        totalCost: 210,
      },
    ],
    laborCost: 400,
    externalCost: 650,
    totalCost: 1260,
    downtimeHours: 24,
    mechanicName: 'José Valdir Mendonça',
    workshop: 'Oficina Interna CPLU',
    createdByUserName: 'Marcos Vinícius Dias',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-12T10:00:00Z',
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
    } else {
      // Ensure Ipiranga exists in stored regions
      const regionsRaw = localStorage.getItem(STORAGE_KEYS.REGIONS);
      if (!regionsRaw) {
        localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(SEED_REGIONS));
      } else {
        const regs: Region[] = JSON.parse(regionsRaw);
        if (!regs.some((r) => r.name.toLowerCase() === 'ipiranga')) {
          regs.push({
            id: 'reg-006',
            code: 'REG-IPR',
            name: 'Ipiranga',
            supervisor: 'Eduardo Martins',
            active: true,
            createdAt: '2026-01-01T08:00:00Z',
          });
          localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(regs));
        }
      }

      // Ensure 005230 (Calça de Brim Azul Operacional) exists in stored materials
      const matsRaw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (matsRaw) {
        const mats: Material[] = JSON.parse(matsRaw);
        if (!mats.some((m) => m.code === '005230' || m.name.toLowerCase().includes('calça de brim azul'))) {
          mats.unshift({
            id: 'mat-020',
            code: '005230',
            ikkiCode: '005230',
            name: 'Calça de Brim Azul Operacional',
            description: 'Calça operacional em brim 100% algodão azul royal com reforço entrepernas e elástico total.',
            category: 'Uniformes',
            unit: 'UN',
            currentStock: 50,
            minStock: 20,
            location: 'Galpão A - Almoxarifado Central',
            shelf: 'Corredor 2, Prat. 3, Nív. 2',
            physicalLocations: [
              {
                id: 'loc-020-1',
                aisle: 'Corredor 2',
                shelf: 'Prateleira 3',
                level: 'Nível 2',
                quantity: 50,
                updatedAt: '2026-03-01T08:00:00Z',
              },
            ],
            status: 'ativo',
            supplier: 'Tecidos & Uniformes Brasil',
            isEpi: false,
            createdAt: '2026-01-10T08:00:00Z',
            updatedAt: '2026-03-01T08:00:00Z',
          });
          localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(mats));
        }
      }

      // Ensure vehicles are initialized
      if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(SEED_VEHICLES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.FUELINGS)) {
        localStorage.setItem(STORAGE_KEYS.FUELINGS, JSON.stringify(SEED_FUELINGS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE_PLANS)) {
        localStorage.setItem(STORAGE_KEYS.MAINTENANCE_PLANS, JSON.stringify(SEED_MAINTENANCE_PLANS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(SEED_SERVICE_ORDERS));
      }

      // Ensure mechanical items exist in stored materials
      const existingMatsRaw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (existingMatsRaw) {
        const existingMats: Material[] = JSON.parse(existingMatsRaw);
        let updated = false;
        SEED_MATERIALS.filter((m) => m.category === 'Peças & Mecânica').forEach((mecItem) => {
          if (!existingMats.some((em) => em.code === mecItem.code)) {
            existingMats.push(mecItem);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(existingMats));
        }
      }
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
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(SEED_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.FUELINGS, JSON.stringify(SEED_FUELINGS));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_PLANS, JSON.stringify(SEED_MAINTENANCE_PLANS));
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(SEED_SERVICE_ORDERS));
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
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FUELINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_PLANS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify([]));
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
    const materials: Material[] = raw ? JSON.parse(raw) : [];
    return materials.map((m) => {
      // Ensure physicalLocations is populated
      if (!m.physicalLocations || m.physicalLocations.length === 0) {
        const defaultLoc: MaterialPhysicalLocation = {
          id: 'loc-' + m.id + '-1',
          aisle: 'Corredor 1',
          shelf: m.shelf || 'Prateleira 1',
          level: 'Nível 1',
          quantity: m.currentStock || 0,
          updatedAt: m.updatedAt || new Date().toISOString(),
        };
        m.physicalLocations = [defaultLoc];
      }
      return m;
    });
  },

  getMaterialById(id: string): Material | undefined {
    return this.getMaterials().find((m) => m.id === id);
  },

  getMaterialByCode(code: string): Material | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    const cleanNoZeros = clean.replace(/^0+/, '');
    return this.getMaterials().find(
      (m) =>
        m.code.toUpperCase() === clean ||
        (m.ikkiCode && m.ikkiCode.toUpperCase() === clean) ||
        m.id.toUpperCase() === clean ||
        (cleanNoZeros.length > 0 && m.code.toUpperCase().replace(/^0+/, '') === cleanNoZeros) ||
        (clean === 'EPI-LUV-01' && (m.code === '001420' || m.code === 'EPI-LUV-01')) ||
        (clean === 'EPI-BOT-02' && (m.code === '001421' || m.code === 'EPI-BOT-02')) ||
        (clean === 'EPI-COL-03' && (m.code === '002105' || m.code === 'EPI-COL-03')) ||
        (clean === 'EPI-OCU-04' && (m.code === '003890' || m.code === 'EPI-OCU-04')) ||
        (clean === 'EPI-PRO-05' && (m.code === '004510' || m.code === 'EPI-PRO-05'))
    );
  },

  getMaterialLocations(materialId: string): MaterialPhysicalLocation[] {
    const mat = this.getMaterialById(materialId);
    return mat?.physicalLocations || [];
  },

  formatPhysicalLocationsSummary(material: Material): string {
    const locs = material.physicalLocations || [];
    if (locs.length === 0) return material.shelf || 'Almoxarifado Central';
    return locs
      .map((l) => `${l.aisle}, ${l.shelf}, ${l.level} (${l.quantity} ${material.unit})`)
      .join(' • ');
  },

  addOrUpdateMaterialLocation(
    materialId: string,
    locationData: { aisle: string; shelf: string; level: string; quantity: number },
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; material?: Material } {
    const materials = this.getMaterials();
    const idx = materials.findIndex((m) => m.id === materialId);
    if (idx === -1) return { success: false, message: 'Material não encontrado.' };

    const mat = materials[idx];
    if (!mat.physicalLocations) mat.physicalLocations = [];

    const cleanAisle = locationData.aisle.trim();
    const cleanShelf = locationData.shelf.trim();
    const cleanLevel = locationData.level.trim();
    const now = new Date().toISOString();

    const existingLoc = mat.physicalLocations.find(
      (l) =>
        l.aisle.toLowerCase() === cleanAisle.toLowerCase() &&
        l.shelf.toLowerCase() === cleanShelf.toLowerCase() &&
        l.level.toLowerCase() === cleanLevel.toLowerCase()
    );

    if (existingLoc) {
      existingLoc.quantity = Math.max(0, locationData.quantity);
      existingLoc.updatedAt = now;
    } else {
      mat.physicalLocations.push({
        id: 'loc-' + Math.random().toString(36).substring(2, 9),
        aisle: cleanAisle,
        shelf: cleanShelf,
        level: cleanLevel,
        quantity: Math.max(0, locationData.quantity),
        updatedAt: now,
      });
    }

    mat.shelf = this.formatPhysicalLocationsSummary(mat);
    mat.updatedAt = now;
    materials[idx] = mat;

    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ATUALIZAR_LOCALIZACAO_FISICA',
      entity: 'Material',
      entityId: mat.id,
      details: `Localização física ajustada para ${mat.code} em ${cleanAisle}, ${cleanShelf}, ${cleanLevel} (${locationData.quantity} ${mat.unit}).`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return { success: true, message: 'Localização física cadastrada com sucesso!', material: mat };
  },

  transferMaterialLocation(params: {
    materialId: string;
    sourceLocationId: string;
    targetAisle: string;
    targetShelf: string;
    targetLevel: string;
    quantity: number;
    user: { id: string; name: string; role: UserRole };
    observation?: string;
  }): { success: boolean; message: string; movement?: Movement } {
    if (params.quantity <= 0) {
      return { success: false, message: 'A quantidade a transferir deve ser maior que zero.' };
    }

    const materials = this.getMaterials();
    const idx = materials.findIndex((m) => m.id === params.materialId);
    if (idx === -1) {
      return { success: false, message: 'Material não encontrado no sistema.' };
    }

    const mat = materials[idx];
    if (!mat.physicalLocations || mat.physicalLocations.length === 0) {
      return { success: false, message: 'Nenhuma localização física cadastrada para este material.' };
    }

    const srcLoc = mat.physicalLocations.find((l) => l.id === params.sourceLocationId);
    if (!srcLoc) {
      return { success: false, message: 'Localização de origem não encontrada.' };
    }

    if (srcLoc.quantity < params.quantity) {
      return {
        success: false,
        message: `Saldo insuficiente na localização de origem! Disponível no local: ${srcLoc.quantity} ${mat.unit}, Solicitado: ${params.quantity} ${mat.unit}.`,
      };
    }

    const cleanTargetAisle = params.targetAisle.trim();
    const cleanTargetShelf = params.targetShelf.trim();
    const cleanTargetLevel = params.targetLevel.trim();

    if (!cleanTargetAisle || !cleanTargetShelf || !cleanTargetLevel) {
      return { success: false, message: 'Informe corredor, prateleira e nível de destino.' };
    }

    const now = new Date().toISOString();

    // 1. Decrement source location
    srcLoc.quantity -= params.quantity;
    srcLoc.updatedAt = now;

    // 2. Increment or create target location
    let targetLoc = mat.physicalLocations.find(
      (l) =>
        l.aisle.toLowerCase() === cleanTargetAisle.toLowerCase() &&
        l.shelf.toLowerCase() === cleanTargetShelf.toLowerCase() &&
        l.level.toLowerCase() === cleanTargetLevel.toLowerCase()
    );

    if (targetLoc) {
      targetLoc.quantity += params.quantity;
      targetLoc.updatedAt = now;
    } else {
      mat.physicalLocations.push({
        id: 'loc-' + Math.random().toString(36).substring(2, 9),
        aisle: cleanTargetAisle,
        shelf: cleanTargetShelf,
        level: cleanTargetLevel,
        quantity: params.quantity,
        updatedAt: now,
      });
    }

    // Filter out 0-quantity locations if other locations exist
    if (mat.physicalLocations.filter((l) => l.quantity > 0).length > 0) {
      mat.physicalLocations = mat.physicalLocations.filter((l) => l.quantity > 0);
    }

    // IMPORTANT: Total currentStock does NOT change!
    mat.shelf = this.formatPhysicalLocationsSummary(mat);
    mat.updatedAt = now;
    materials[idx] = mat;

    // 3. Register Movement of type TRANSFERENCIA_LOCAL
    const movements = this.getMovements();
    const movId = 'mov-' + Math.random().toString(36).substring(2, 9);
    const newMovement: Movement = {
      id: movId,
      materialId: mat.id,
      materialCode: mat.code,
      materialName: mat.name,
      type: 'TRANSFERENCIA_LOCAL',
      quantity: params.quantity,
      previousStock: mat.currentStock,
      newStock: mat.currentStock, // Saldo total inalterado!
      date: now,
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      location: mat.location,
      sourceLocation: `${srcLoc.aisle}, ${srcLoc.shelf}, ${srcLoc.level}`,
      targetLocation: `${cleanTargetAisle}, ${cleanTargetShelf}, ${cleanTargetLevel}`,
      observation:
        params.observation?.trim() ||
        `Transferência interna de ${params.quantity} ${mat.unit} de ${srcLoc.aisle}, ${srcLoc.shelf}, ${srcLoc.level} para ${cleanTargetAisle}, ${cleanTargetShelf}, ${cleanTargetLevel}.`,
    };

    movements.unshift(newMovement);

    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));

    this.addAuditLog({
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      action: 'TRANSFERENCIA_LOCAL',
      entity: 'Movement',
      entityId: movId,
      details: `Reorganização física: ${params.quantity} ${mat.unit} de ${mat.code} transferidos de [${newMovement.sourceLocation}] para [${newMovement.targetLocation}]. Saldo total mantido: ${mat.currentStock} ${mat.unit}.`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return {
      success: true,
      message: `Transferência concluída com sucesso! ${params.quantity} ${mat.unit} movidos para ${cleanTargetAisle}, ${cleanTargetShelf}, ${cleanTargetLevel}. Saldo total: ${mat.currentStock} ${mat.unit}.`,
      movement: newMovement,
    };
  },

  registerGoodsReceipt(params: {
    materialIdOrCode: string;
    quantity: number;
    supplier?: string;
    invoiceNumber?: string;
    receiptDate?: string;
    aisle: string;
    shelf: string;
    level: string;
    user: { id: string; name: string; role: UserRole };
    observation?: string;
    idempotencyKey?: string;
  }): { success: boolean; message: string; movement?: Movement } {
    if (params.idempotencyKey && this.isIdempotencyKeyProcessed(params.idempotencyKey)) {
      return { success: false, message: 'Esta entrada de mercadorias já foi processada anteriormente (proteção contra duplicidade).' };
    }

    if (params.quantity <= 0) {
      return { success: false, message: 'A quantidade recebida deve ser maior que zero.' };
    }

    const cleanAisle = params.aisle.trim();
    const cleanShelf = params.shelf.trim();
    const cleanLevel = params.level.trim();

    if (!cleanAisle || !cleanShelf || !cleanLevel) {
      return { success: false, message: 'Informe o corredor, prateleira e nível de armazenamento.' };
    }

    const materials = this.getMaterials();
    const searchKey = params.materialIdOrCode.trim().toUpperCase();
    const idx = materials.findIndex(
      (m) =>
        m.id === params.materialIdOrCode ||
        m.code.toUpperCase() === searchKey ||
        (m.ikkiCode && m.ikkiCode.toUpperCase() === searchKey) ||
        (searchKey === 'EPI-LUV-01' && m.code === '001420') ||
        (searchKey === 'EPI-BOT-02' && m.code === '001421') ||
        (searchKey === 'EPI-COL-03' && m.code === '002105')
    );

    if (idx === -1) {
      return { success: false, message: `Material com código/identificador "${params.materialIdOrCode}" não encontrado no catálogo.` };
    }

    const mat = materials[idx];
    const previousStock = mat.currentStock;
    const newStock = previousStock + params.quantity;
    const now = new Date().toISOString();

    // Update physical locations
    if (!mat.physicalLocations) mat.physicalLocations = [];

    let targetLoc = mat.physicalLocations.find(
      (l) =>
        l.aisle.toLowerCase() === cleanAisle.toLowerCase() &&
        l.shelf.toLowerCase() === cleanShelf.toLowerCase() &&
        l.level.toLowerCase() === cleanLevel.toLowerCase()
    );

    if (targetLoc) {
      targetLoc.quantity += params.quantity;
      targetLoc.updatedAt = now;
    } else {
      mat.physicalLocations.push({
        id: 'loc-' + Math.random().toString(36).substring(2, 9),
        aisle: cleanAisle,
        shelf: cleanShelf,
        level: cleanLevel,
        quantity: params.quantity,
        updatedAt: now,
      });
    }

    mat.currentStock = newStock;
    mat.shelf = this.formatPhysicalLocationsSummary(mat);
    if (params.supplier && (!mat.supplier || mat.supplier === 'Não informado')) {
      mat.supplier = params.supplier.trim();
    }
    mat.updatedAt = now;
    materials[idx] = mat;

    const movements = this.getMovements();
    const movId = 'mov-' + Math.random().toString(36).substring(2, 9);
    const newMovement: Movement = {
      id: movId,
      materialId: mat.id,
      materialCode: mat.code,
      materialName: mat.name,
      type: 'ENTRADA_RECEBIMENTO',
      quantity: params.quantity,
      previousStock,
      newStock,
      date: now,
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      location: mat.location,
      sector: 'Almoxarifado Central',
      invoiceNumber: params.invoiceNumber?.trim() || undefined,
      supplier: params.supplier?.trim() || mat.supplier,
      receivedDate: params.receiptDate || now.split('T')[0],
      targetLocation: `${cleanAisle}, ${cleanShelf}, ${cleanLevel}`,
      observation:
        params.observation?.trim() ||
        `Entrada de mercadorias conforme NF ${params.invoiceNumber || 'S/N'}. Fornecedor: ${params.supplier || mat.supplier || 'N/A'}. Armazenado em ${cleanAisle}, ${cleanShelf}, ${cleanLevel}.`,
      idempotencyKey: params.idempotencyKey,
    };

    if (params.idempotencyKey) {
      this.markIdempotencyKeyProcessed(params.idempotencyKey);
    }

    movements.unshift(newMovement);

    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));

    this.addAuditLog({
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      action: 'ENTRADA_RECEBIMENTO',
      entity: 'Movement',
      entityId: movId,
      details: `Entrada física: +${params.quantity} ${mat.unit} de ${mat.code} - ${mat.name} (NF: ${params.invoiceNumber || 'S/N'}). Local: ${cleanAisle}, ${cleanShelf}, ${cleanLevel}. Saldo: ${previousStock} -> ${newStock}.`,
      ipOrSession: 'Sessão Web',
    });

    notifyListeners();
    return {
      success: true,
      message: `Entrada de ${params.quantity} ${mat.unit} registrada com sucesso em ${cleanAisle}, ${cleanShelf}, ${cleanLevel}! Novo saldo total: ${newStock} ${mat.unit}.`,
      movement: newMovement,
    };
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
      date?: string;
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
        date: params.date || now,
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
      requisitionNumber?: string;
      regionName: string;
      regionId?: string;
      employeeId?: string;
      priority: Requisition['priority'];
      justification?: string;
      observations?: string;
      items: { materialId: string; quantityRequested: number }[];
      isDraft?: boolean;
    },
    user: { id: string; name: string; role: UserRole; matricula?: string }
  ): { success: boolean; message: string; requisition?: Requisition } {
    const cleanRegion = data.regionName?.trim();
    if (!cleanRegion) {
      return { success: false, message: 'A região solicitante é obrigatória (ex: Ipiranga, Paulista, etc.).' };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, message: 'Adicione pelo menos um item à requisição.' };
    }

    const emp = data.employeeId ? this.getEmployeeById(data.employeeId) : undefined;

    const materials = this.getMaterials();
    const formattedItems: Requisition['items'] = [];

    for (const item of data.items) {
      const mat = materials.find((m) => m.id === item.materialId || m.code === item.materialId || m.ikkiCode === item.materialId);
      if (!mat) {
        return { success: false, message: `Material ${item.materialId} não encontrado no catálogo.` };
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
    let reqNumber = data.requisitionNumber?.trim();

    if (reqNumber) {
      const exists = requisitions.some(
        (r) => r.number.toUpperCase() === reqNumber!.toUpperCase()
      );
      if (exists) {
        return {
          success: false,
          message: `Já existe uma requisição cadastrada com o número ${reqNumber}. Verifique o número original da empresa.`,
        };
      }
    } else {
      const year = new Date().getFullYear();
      const nextSeq = String(requisitions.length + 1).padStart(4, '0');
      reqNumber = `REQ-${year}-${nextSeq}`;
    }

    const now = new Date().toISOString();
    const status: Requisition['status'] = data.isDraft ? 'rascunho' : 'enviada';

    // Resolve region ID if available
    let resolvedRegionId = data.regionId || emp?.regionId;
    if (!resolvedRegionId) {
      const regObj = this.getRegions().find(
        (r) => r.name.toLowerCase() === cleanRegion.toLowerCase()
      );
      if (regObj) resolvedRegionId = regObj.id;
    }

    const newReq: Requisition = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      number: reqNumber,
      regionName: cleanRegion,
      regionId: resolvedRegionId,
      employeeId: emp?.id,
      employeeName: emp?.name,
      employeeMatricula: emp?.matricula,
      sector: emp?.sector || cleanRegion,
      status,
      priority: data.priority,
      justification: data.justification?.trim() || 'Requisição técnica de EPIs / Materiais',
      observations: data.observations,
      requestedByUserId: user.id,
      requestedByName: user.name, // Nome do Técnico de Segurança responsável pela emissão
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
        ? `Rascunho ${newReq.number} salvo pelo TST ${user.name} (${user.matricula || user.role}) para a Região ${cleanRegion}.`
        : `Requisição ${newReq.number} emitida e enviada pelo TST ${user.name} (${user.matricula || user.role}) para a Região ${cleanRegion}.`,
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

  setRequisitionStampedNumber(
    requisitionId: string,
    stampedNumber: string,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; message: string; requisition?: Requisition } {
    const cleanNum = stampedNumber.trim();
    if (!cleanNum) {
      return { success: false, message: 'O número oficial carimbado não pode estar vazio.' };
    }

    const requisitions = this.getRequisitions();
    const idx = requisitions.findIndex((r) => r.id === requisitionId);
    if (idx === -1) {
      return { success: false, message: 'Requisição não encontrada no sistema.' };
    }

    // Check duplicate stamped number across other requisitions to prevent collision
    const duplicate = requisitions.find(
      (r) =>
        r.id !== requisitionId &&
        r.stampedNumber &&
        r.stampedNumber.trim().toUpperCase() === cleanNum.toUpperCase()
    );
    if (duplicate) {
      return {
        success: false,
        message: `O número oficial carimbado "${cleanNum}" já foi registrado na requisição ${duplicate.number}. Cada papel físico possui número único.`,
      };
    }

    const now = new Date().toISOString();
    const req = requisitions[idx];
    req.stampedNumber = cleanNum;
    req.stampedAt = now;
    req.stampedBy = user.name;
    req.stampedByUserId = user.id;
    req.updatedAt = now;
    requisitions[idx] = req;

    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(requisitions));

    // Also update any movements or deliveries linked to this requisition
    const movements = this.getMovements();
    let movUpdated = false;
    movements.forEach((m) => {
      if (m.requisitionId === req.id || m.requisitionNumber === req.number) {
        m.stampedNumber = cleanNum;
        movUpdated = true;
      }
    });
    if (movUpdated) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    }

    const deliveries = this.getEPIDeliveries();
    let delUpdated = false;
    deliveries.forEach((d) => {
      if (d.requisitionId === req.id || d.requisitionNumber === req.number) {
        d.stampedNumber = cleanNum;
        delUpdated = true;
      }
    });
    if (delUpdated) {
      localStorage.setItem(STORAGE_KEYS.EPI_DELIVERIES, JSON.stringify(deliveries));
    }

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'VINCULAR_NUMERO_CARIMBADO',
      entity: 'Requisition',
      entityId: req.id,
      details: `Número oficial carimbado "${cleanNum}" registrado para a requisição ${req.number} (Região ${req.regionName}) por ${user.name} (${user.role}).`,
      ipOrSession: 'Sessão Web Almoxarifado',
    });

    notifyListeners();
    return {
      success: true,
      message: `Número carimbado "${cleanNum}" vinculado com sucesso à requisição ${req.number}!`,
      requisition: req,
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

      const emp = req.employeeId ? this.getEmployeeById(req.employeeId) : undefined;
      const resolvedRegionId = req.regionId || emp?.regionId;
      const resolvedRegionName = req.regionName || emp?.regionName;

      for (const itemDelivery of validDeliveries) {
        const reqItem = req.items.find((i) => i.id === itemDelivery.itemId)!;
        const matIdx = materials.findIndex((m) => m.id === reqItem.materialId);
        const mat = materials[matIdx];

        const previousStock = mat.currentStock;
        const newStock = previousStock - itemDelivery.quantityToDeliver;
        mat.currentStock = newStock;

        // Deduct from physical locations
        if (mat.physicalLocations && mat.physicalLocations.length > 0) {
          let remainingToDeduct = itemDelivery.quantityToDeliver;
          // Sort descending by quantity to deduct from location with highest stock first
          mat.physicalLocations.sort((a, b) => b.quantity - a.quantity);
          for (const loc of mat.physicalLocations) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(loc.quantity, remainingToDeduct);
            loc.quantity -= deduct;
            remainingToDeduct -= deduct;
            loc.updatedAt = now;
          }
          if (mat.physicalLocations.filter((l) => l.quantity > 0).length > 0) {
            mat.physicalLocations = mat.physicalLocations.filter((l) => l.quantity > 0);
          }
          mat.shelf = this.formatPhysicalLocationsSummary(mat);
        }

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
          sector: req.sector || req.regionName,
          employeeId: req.employeeId,
          employeeName: req.employeeName,
          employeeMatricula: req.employeeMatricula,
          regionId: resolvedRegionId,
          regionName: resolvedRegionName,
          requisitionId: req.id,
          requisitionNumber: req.number,
          stampedNumber: req.stampedNumber,
          idempotencyKey: params.idempotencyKey,
          observation: `Atendimento de requisição ${req.number}${req.stampedNumber ? ` (Nº Carimbado: ${req.stampedNumber})` : ''} - Região: ${resolvedRegionName}`,
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
        stampedNumber: req.stampedNumber,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        employeeMatricula: req.employeeMatricula,
        sector: req.sector || req.regionName,
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
          message: `Solicitação para ${r.employeeName || r.regionName} (${r.sector || r.regionName}) aguardando atendimento do almoxarife.`,
          severity: r.priority === 'critica' ? 'danger' : 'warning',
          date: r.createdAt,
          resolved: false,
          link: `/atendimento?req=${r.number}`,
        });
      });

    // Check overdue maintenance plans
    const maintenancePlans = this.getMaintenancePlans();
    maintenancePlans
      .filter((p) => p.status === 'vencida')
      .forEach((p) => {
        alerts.push({
          id: 'alert-maint-' + p.id,
          type: 'CRITICAL_STOCK',
          title: `Manutenção Vencida: ${p.fleetNumber}`,
          message: `O plano "${p.serviceCategory}" para o veículo ${p.fleetNumber} está VENCIDO e requer intervenção mecânica imediata.`,
          severity: 'danger',
          date: p.updatedAt,
          resolved: false,
        });
      });

    return alerts;
  },

  // ==========================================
  // MÓDULO MECÂNICA E GESTÃO DE FROTA
  // ==========================================

  getVehicles(): Vehicle[] {
    if (typeof window === 'undefined') return SEED_VEHICLES;
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return raw ? JSON.parse(raw) : SEED_VEHICLES;
  },

  getVehicleById(id: string): Vehicle | undefined {
    return this.getVehicles().find((v) => v.id === id);
  },

  getVehicleByFleetNumber(fleetNumber: string): Vehicle | undefined {
    return this.getVehicles().find((v) => v.fleetNumber.toUpperCase() === fleetNumber.trim().toUpperCase());
  },

  createVehicle(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle {
    const vehicles = this.getVehicles();
    const now = new Date().toISOString();
    const newVehicle: Vehicle = {
      ...data,
      id: 'veh-' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    vehicles.unshift(newVehicle);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));

    this.addAuditLog({
      action: 'CADASTRAR_VEICULO',
      entity: 'System',
      entityId: newVehicle.id,
      details: `Novo veículo cadastrado na frota: ${newVehicle.fleetNumber} (${newVehicle.plate}) - ${newVehicle.model} - Sub-região: ${newVehicle.subRegion}`,
    });

    notifyListeners();
    return newVehicle;
  },

  updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle {
    const vehicles = this.getVehicles();
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error(`Veículo com id ${id} não encontrado.`);

    const updatedVehicle: Vehicle = {
      ...vehicles[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    vehicles[idx] = updatedVehicle;
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));

    this.addAuditLog({
      action: 'ATUALIZAR_VEICULO',
      entity: 'System',
      entityId: id,
      details: `Dados do veículo ${updatedVehicle.fleetNumber} (${updatedVehicle.plate}) atualizados. Status: ${updatedVehicle.status}`,
    });

    notifyListeners();
    return updatedVehicle;
  },

  deleteVehicle(id: string): void {
    const vehicles = this.getVehicles();
    const target = vehicles.find((v) => v.id === id);
    const filtered = vehicles.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(filtered));

    if (target) {
      this.addAuditLog({
        action: 'EXCLUIR_VEICULO',
        entity: 'System',
        entityId: id,
        details: `Veículo ${target.fleetNumber} (${target.plate}) removido do sistema.`,
      });
    }

    notifyListeners();
  },

  // ------------------------------------------
  // ABASTECIMENTO (FUELINGS)
  // ------------------------------------------

  getFuelings(vehicleId?: string): FuelingRecord[] {
    if (typeof window === 'undefined') return SEED_FUELINGS;
    const raw = localStorage.getItem(STORAGE_KEYS.FUELINGS);
    const fuelings: FuelingRecord[] = raw ? JSON.parse(raw) : SEED_FUELINGS;
    if (vehicleId) {
      return fuelings.filter((f) => f.vehicleId === vehicleId);
    }
    return fuelings.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  },

  registerFueling(data: {
    vehicleId: string;
    fleetNumber: string;
    plate: string;
    dateTime: string;
    driverName?: string;
    fuelType: Vehicle['fuelType'];
    liters: number;
    unitPrice: number;
    totalCost: number;
    odometerKm: number;
    hourmeterHours: number;
    pumpMeterVolume: number;
    pumpId?: string;
    stationLocation: string;
    documentNumber?: string;
    fullTank: boolean;
    notes?: string;
    createdByUserName: string;
    allowOdometerOverride?: boolean;
  }): { success: boolean; error?: string; record?: FuelingRecord } {
    const vehicles = this.getVehicles();
    const vehicle = vehicles.find((v) => v.id === data.vehicleId);
    if (!vehicle) {
      return { success: false, error: 'Veículo selecionado não encontrado na frota.' };
    }

    // Previous fuelings for this vehicle
    const vehicleFuelings = this.getFuelings(vehicle.id).sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
    const lastFueling = vehicleFuelings[vehicleFuelings.length - 1];

    const prevOdometer = lastFueling ? lastFueling.odometerKm : vehicle.currentOdometerKm;

    // Strict validation: Odometer must be >= previous recorded odometer unless override explicitly authorized
    if (data.odometerKm < prevOdometer && !data.allowOdometerOverride) {
      return {
        success: false,
        error: `Odômetro informado (${data.odometerKm.toLocaleString()} km) é MENOR que o último registro (${prevOdometer.toLocaleString()} km). Verifique a leitura no painel ou marque a justificativa de override.`,
      };
    }

    let kmDistanceSinceLast: number | undefined = undefined;
    let calculatedKmPerLiter: number | undefined = undefined;
    let costPerKm: number | undefined = undefined;
    let anomalyAlert: string | undefined = undefined;

    if (data.odometerKm > prevOdometer) {
      kmDistanceSinceLast = data.odometerKm - prevOdometer;
      if (data.fullTank && data.liters > 0) {
        calculatedKmPerLiter = Number((kmDistanceSinceLast / data.liters).toFixed(2));
        costPerKm = Number((data.totalCost / kmDistanceSinceLast).toFixed(2));

        // Anomaly checks based on vehicle type
        if (vehicle.type === 'compactador') {
          // Compactors typically get 1.5 - 3.8 km/L due to continuous PTO hydraulic compaction
          if (calculatedKmPerLiter < 1.1) {
            anomalyAlert = `Atenção: Consumo elevado detectado (${calculatedKmPerLiter} km/L). Verificar se houve operação prolongada de prensa ou vazamento.`;
          } else if (calculatedKmPerLiter > 4.5) {
            anomalyAlert = `Atenção: Média calculada incomumente alta (${calculatedKmPerLiter} km/L). Verifique se o odômetro anterior estava correto.`;
          }
        } else if (vehicle.type === 'apoio') {
          if (calculatedKmPerLiter < 6.0) {
            anomalyAlert = `Atenção: Consumo anormal para veículo leve (${calculatedKmPerLiter} km/L).`;
          }
        }
      }
    }

    const newRecord: FuelingRecord = {
      id: 'fuel-' + Date.now(),
      vehicleId: data.vehicleId,
      fleetNumber: data.fleetNumber,
      plate: data.plate,
      dateTime: data.dateTime || new Date().toISOString(),
      driverName: data.driverName?.trim() || undefined,
      fuelType: data.fuelType,
      liters: Number(data.liters),
      unitPrice: Number(data.unitPrice),
      totalCost: Number(data.totalCost),
      odometerKm: Number(data.odometerKm),
      hourmeterHours: Number(data.hourmeterHours),
      pumpMeterVolume: Number(data.pumpMeterVolume),
      pumpId: data.pumpId,
      stationLocation: data.stationLocation,
      documentNumber: data.documentNumber?.trim(),
      fullTank: data.fullTank,
      kmDistanceSinceLast,
      calculatedKmPerLiter,
      costPerKm,
      notes: data.notes?.trim(),
      anomalyAlert,
      createdByUserName: data.createdByUserName,
      createdAt: new Date().toISOString(),
    };

    const allFuelings = this.getFuelings();
    allFuelings.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.FUELINGS, JSON.stringify(allFuelings));

    // Update vehicle current readings
    this.updateVehicle(vehicle.id, {
      currentOdometerKm: Math.max(vehicle.currentOdometerKm, data.odometerKm),
      currentHourmeterHours: Math.max(vehicle.currentHourmeterHours, data.hourmeterHours),
    });

    this.addAuditLog({
      action: 'REGISTRAR_ABASTECIMENTO',
      entity: 'System',
      entityId: newRecord.id,
      details: `Abastecimento registrado para ${vehicle.fleetNumber}: ${data.liters}L (${data.fuelType}) no valor de R$ ${data.totalCost.toFixed(2)}. Odômetro: ${data.odometerKm} km. Medidor Bomba: ${data.pumpMeterVolume}L.`,
    });

    // Recheck maintenance plans for this vehicle since mileage/hours updated
    this.checkMaintenancePlanStatusForVehicle(vehicle.id);

    notifyListeners();
    return { success: true, record: newRecord };
  },

  // ------------------------------------------
  // MANUTENÇÃO PREVENTIVA (PLANS)
  // ------------------------------------------

  getMaintenancePlans(vehicleId?: string): MaintenancePlan[] {
    if (typeof window === 'undefined') return SEED_MAINTENANCE_PLANS;
    const raw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_PLANS);
    const plans: MaintenancePlan[] = raw ? JSON.parse(raw) : SEED_MAINTENANCE_PLANS;
    if (vehicleId) {
      return plans.filter((p) => p.vehicleId === vehicleId);
    }
    return plans;
  },

  createMaintenancePlan(data: Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt' | 'status'>): MaintenancePlan {
    const plans = this.getMaintenancePlans();
    const now = new Date().toISOString();
    const vehicle = this.getVehicleById(data.vehicleId);

    // Compute initial status
    let status: MaintenancePlan['status'] = 'em_dia';
    if (vehicle) {
      if (data.nextDueKm && vehicle.currentOdometerKm >= data.nextDueKm) status = 'vencida';
      else if (data.nextDueKm && vehicle.currentOdometerKm >= data.nextDueKm - 500) status = 'proxima';
      else if (data.nextDueHours && vehicle.currentHourmeterHours >= data.nextDueHours) status = 'vencida';
      else if (data.nextDueDate && new Date(data.nextDueDate).getTime() <= Date.now()) status = 'vencida';
    }

    const newPlan: MaintenancePlan = {
      ...data,
      id: 'plan-' + Date.now(),
      status,
      createdAt: now,
      updatedAt: now,
    };
    plans.push(newPlan);
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_PLANS, JSON.stringify(plans));

    this.addAuditLog({
      action: 'CRIAR_PLANO_PREVENTIVO',
      entity: 'System',
      entityId: newPlan.id,
      details: `Novo plano de manutenção preventiva cadastrado para ${data.fleetNumber}: ${data.serviceCategory}`,
    });

    notifyListeners();
    return newPlan;
  },

  updateMaintenancePlan(id: string, updates: Partial<MaintenancePlan>): MaintenancePlan {
    const plans = this.getMaintenancePlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Plano com id ${id} não encontrado.`);

    const updatedPlan: MaintenancePlan = {
      ...plans[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    plans[idx] = updatedPlan;
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_PLANS, JSON.stringify(plans));
    notifyListeners();
    return updatedPlan;
  },

  deleteMaintenancePlan(id: string): void {
    const plans = this.getMaintenancePlans();
    const filtered = plans.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_PLANS, JSON.stringify(filtered));
    notifyListeners();
  },

  checkMaintenancePlanStatusForVehicle(vehicleId: string) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) return;
    const plans = this.getMaintenancePlans(vehicleId);
    let changed = false;

    plans.forEach((plan) => {
      let newStatus: MaintenancePlan['status'] = 'em_dia';
      if (plan.nextDueKm && vehicle.currentOdometerKm >= plan.nextDueKm) {
        newStatus = 'vencida';
      } else if (plan.nextDueKm && vehicle.currentOdometerKm >= plan.nextDueKm - 500) {
        newStatus = 'proxima';
      } else if (plan.nextDueHours && vehicle.currentHourmeterHours >= plan.nextDueHours) {
        newStatus = 'vencida';
      } else if (plan.nextDueHours && vehicle.currentHourmeterHours >= plan.nextDueHours - 20) {
        newStatus = 'proxima';
      } else if (plan.nextDueDate) {
        const dueTime = new Date(plan.nextDueDate).getTime();
        const diffDays = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) newStatus = 'vencida';
        else if (diffDays <= 7) newStatus = 'proxima';
      }

      if (newStatus !== plan.status) {
        plan.status = newStatus;
        plan.updatedAt = new Date().toISOString();
        changed = true;
      }
    });

    if (changed) {
      const allPlans = this.getMaintenancePlans();
      const updatedAll = allPlans.map((p) => {
        const found = plans.find((x) => x.id === p.id);
        return found || p;
      });
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE_PLANS, JSON.stringify(updatedAll));
    }
  },

  // ------------------------------------------
  // ORDENS DE SERVIÇO (SERVICE ORDERS)
  // ------------------------------------------

  getServiceOrders(vehicleId?: string): ServiceOrder[] {
    if (typeof window === 'undefined') return SEED_SERVICE_ORDERS;
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    const orders: ServiceOrder[] = raw ? JSON.parse(raw) : SEED_SERVICE_ORDERS;
    if (vehicleId) {
      return orders.filter((o) => o.vehicleId === vehicleId);
    }
    return orders.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  },

  getServiceOrderById(id: string): ServiceOrder | undefined {
    return this.getServiceOrders().find((o) => o.id === id);
  },

  getNextServiceOrderNumber(): string {
    const year = new Date().getFullYear();
    const orders = this.getServiceOrders();
    const currentYearOrders = orders.filter((o) => o.orderNumber.startsWith(`OS-${year}`));
    const nextSeq = currentYearOrders.length + 1;
    return `OS-${year}-${String(nextSeq).padStart(4, '0')}`;
  },

  createServiceOrder(data: Omit<ServiceOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): ServiceOrder {
    const orders = this.getServiceOrders();
    const now = new Date().toISOString();
    const orderNumber = this.getNextServiceOrderNumber();

    const partsCost = (data.partsUsed || []).reduce((acc, p) => acc + (p.totalCost || 0), 0);
    const totalCost = partsCost + (data.laborCost || 0) + (data.externalCost || 0);

    const newOrder: ServiceOrder = {
      ...data,
      id: 'os-' + Date.now(),
      orderNumber,
      partsUsed: data.partsUsed || [],
      laborCost: data.laborCost || 0,
      externalCost: data.externalCost || 0,
      totalCost,
      createdAt: now,
      updatedAt: now,
    };

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));

    // If vehicle status needs to be set to em_manutencao
    if (newOrder.status !== 'concluida' && newOrder.status !== 'cancelada') {
      const vehicle = this.getVehicleById(newOrder.vehicleId);
      if (vehicle && vehicle.status === 'disponivel') {
        this.updateVehicle(vehicle.id, { status: 'em_manutencao' });
      }
    }

    this.addAuditLog({
      action: 'ABRIR_ORDEM_SERVICO',
      entity: 'System',
      entityId: newOrder.id,
      details: `Ordem de Serviço ${newOrder.orderNumber} aberta para o veículo ${newOrder.fleetNumber} (${newOrder.plate}). Tipo: ${newOrder.type} - Prioridade: ${newOrder.priority}`,
    });

    notifyListeners();
    return newOrder;
  },

  updateServiceOrder(id: string, updates: Partial<ServiceOrder>): ServiceOrder {
    const orders = this.getServiceOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`Ordem de serviço ${id} não encontrada.`);

    const current = orders[idx];
    const partsUsed = updates.partsUsed !== undefined ? updates.partsUsed : current.partsUsed;
    const laborCost = updates.laborCost !== undefined ? updates.laborCost : current.laborCost;
    const externalCost = updates.externalCost !== undefined ? updates.externalCost : current.externalCost;
    const partsCost = partsUsed.reduce((acc, p) => acc + (p.totalCost || 0), 0);
    const totalCost = partsCost + laborCost + externalCost;

    const updatedOrder: ServiceOrder = {
      ...current,
      ...updates,
      partsUsed,
      laborCost,
      externalCost,
      totalCost,
      updatedAt: new Date().toISOString(),
    };

    orders[idx] = updatedOrder;
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));
    notifyListeners();
    return updatedOrder;
  },

  completeServiceOrder(
    id: string,
    completionData: {
      diagnosis?: string;
      servicesRendered?: string;
      mechanicName?: string;
      laborCost?: number;
      externalCost?: number;
      downtimeHours?: number;
      partsUsed?: ServiceOrderPartItem[];
      deductPartsFromStock?: boolean;
    }
  ): ServiceOrder {
    const order = this.getServiceOrderById(id);
    if (!order) throw new Error(`OS ${id} não encontrada.`);

    const now = new Date().toISOString();
    const parts = completionData.partsUsed || order.partsUsed || [];

    // Deduct parts from inventory stock if requested
    if (completionData.deductPartsFromStock !== false && parts.length > 0) {
      parts.forEach((part) => {
        const material = this.getMaterialById(part.materialId) || this.getMaterialByCode(part.code);
        if (material && part.quantity > 0) {
          const prevStock = material.currentStock;
          const newStock = Math.max(0, prevStock - part.quantity);
          this.updateMaterial(material.id, { currentStock: newStock });

          this.addMovement({
            materialId: material.id,
            materialCode: material.code,
            materialName: material.name,
            type: 'SAIDA_CONSUMO',
            quantity: part.quantity,
            previousStock: prevStock,
            newStock,
            date: now,
            userId: 'usr-mec',
            userName: completionData.mechanicName || order.mechanicName || 'Oficina Mecânica',
            userRole: 'almoxarife',
            location: material.location || 'Oficina de Mecânica & Frota',
            sector: 'Mecânica e Frota',
            observation: `Aplicação de peças na ${order.orderNumber} - Veículo: ${order.fleetNumber} (${order.plate})`,
          });
        }
      });
    }

    const updatedOrder = this.updateServiceOrder(id, {
      ...completionData,
      status: 'concluida',
      closedAt: now,
    });

    // Restore vehicle status to 'disponivel'
    const vehicle = this.getVehicleById(order.vehicleId);
    if (vehicle && vehicle.status === 'em_manutencao') {
      this.updateVehicle(vehicle.id, { status: 'disponivel' });
    }

    this.addAuditLog({
      action: 'CONCLUIR_ORDEM_SERVICO',
      entity: 'System',
      entityId: id,
      details: `Ordem de Serviço ${order.orderNumber} finalizada com sucesso. Veículo ${order.fleetNumber} liberado para operação. Custo Total: R$ ${updatedOrder.totalCost.toFixed(2)}.`,
    });

    notifyListeners();
    return updatedOrder;
  },

  // ------------------------------------------
  // HISTÓRICO CONSOLIDADO DO VEÍCULO (TIMELINE)
  // ------------------------------------------

  getVehicleTimeline(vehicleId: string): VehicleTimelineEvent[] {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) return [];

    const events: VehicleTimelineEvent[] = [];

    // 1. Fueling events
    const fuelings = this.getFuelings(vehicleId);
    fuelings.forEach((f) => {
      events.push({
        id: 'evt-fuel-' + f.id,
        vehicleId,
        fleetNumber: vehicle.fleetNumber,
        type: 'abastecimento',
        date: f.dateTime,
        title: `Abastecimento: ${f.liters}L ${f.fuelType.toUpperCase()}`,
        description: `Posto: ${f.stationLocation}. Custo: R$ ${f.totalCost.toFixed(2)} (${f.calculatedKmPerLiter ? f.calculatedKmPerLiter + ' km/L' : 'Tanque Parcial'}). Motorista: ${f.driverName || 'Não informado'}`,
        odometerKm: f.odometerKm,
        hourmeterHours: f.hourmeterHours,
        cost: f.totalCost,
        details: f,
      });
    });

    // 2. Service Orders events
    const serviceOrders = this.getServiceOrders(vehicleId);
    serviceOrders.forEach((os) => {
      events.push({
        id: 'evt-os-' + os.id,
        vehicleId,
        fleetNumber: vehicle.fleetNumber,
        type: 'ordem_servico',
        date: os.openedAt,
        title: `Ordem de Serviço ${os.orderNumber} (${os.type.toUpperCase()})`,
        description: `${os.description} - Status: ${os.status.toUpperCase()} - Mecânico: ${os.mechanicName || 'Oficina'} - Custo: R$ ${os.totalCost.toFixed(2)}`,
        odometerKm: os.odometerKm,
        hourmeterHours: os.hourmeterHours,
        cost: os.totalCost,
        details: os,
      });
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // ------------------------------------------
  // MÉTRICAS GERAIS DA FROTA
  // ------------------------------------------

  getFleetMetrics() {
    const vehicles = this.getVehicles();
    const fuelings = this.getFuelings();
    const orders = this.getServiceOrders();
    const plans = this.getMaintenancePlans();

    const totalVehicles = vehicles.length;
    const availableCount = vehicles.filter((v) => v.status === 'disponivel').length;
    const inOperationCount = vehicles.filter((v) => v.status === 'em_operacao').length;
    const inMaintenanceCount = vehicles.filter((v) => v.status === 'em_manutencao').length;
    const stoppedCount = vehicles.filter((v) => v.status === 'parado' || v.status === 'baixado').length;

    // Fuel metrics this month
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyFuelings = fuelings.filter((f) => f.dateTime.startsWith(currentMonthPrefix));

    const monthlyFuelCost = monthlyFuelings.reduce((sum, f) => sum + f.totalCost, 0);
    const monthlyFuelLiters = monthlyFuelings.reduce((sum, f) => sum + f.liters, 0);

    const fullTankFuelingsWithKmL = fuelings.filter((f) => f.calculatedKmPerLiter && f.calculatedKmPerLiter > 0);
    const avgFleetKmL =
      fullTankFuelingsWithKmL.length > 0
        ? Number(
            (
              fullTankFuelingsWithKmL.reduce((sum, f) => sum + (f.calculatedKmPerLiter || 0), 0) /
              fullTankFuelingsWithKmL.length
            ).toFixed(2)
          )
        : 2.65;

    const openOrdersCount = orders.filter((o) => o.status !== 'concluida' && o.status !== 'cancelada').length;
    const overduePlansCount = plans.filter((p) => p.status === 'vencida').length;
    const upcomingPlansCount = plans.filter((p) => p.status === 'proxima').length;

    const totalMaintenanceCost = orders.reduce((sum, o) => sum + o.totalCost, 0);

    return {
      totalVehicles,
      availableCount,
      inOperationCount,
      inMaintenanceCount,
      stoppedCount,
      fleetAvailabilityRate: totalVehicles > 0 ? Number((((availableCount + inOperationCount) / totalVehicles) * 100).toFixed(1)) : 100,
      monthlyFuelCost,
      monthlyFuelLiters,
      avgFleetKmL,
      openOrdersCount,
      overduePlansCount,
      upcomingPlansCount,
      totalMaintenanceCost,
    };
  },
};
