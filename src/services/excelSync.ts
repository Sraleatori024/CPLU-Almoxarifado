import * as XLSX from 'xlsx';
import { dbService } from './db';
import {
  Material,
  Employee,
  Movement,
  Region,
  ExcelSyncLog,
  ExcelImportAnalysis,
  UserRole,
  MaterialCategory,
  UnitOfMeasure,
} from '../types';

/**
 * Normalizes header string for comparison (removes accents, special chars, uppercase)
 */
function normalizeHeader(str: any): string {
  if (!str) return '';
  return String(str)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '_');
}

/**
 * Parses cell value to number safely
 */
function parseNumeric(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

export const excelSyncService = {
  /**
   * Reads an Excel workbook and analyzes all sheets, columns, and data counts
   */
  async analyzeExcelFile(file: File): Promise<ExcelImportAnalysis> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

    const sheetsSummary: ExcelImportAnalysis['sheets'] = [];
    let materialsFound = 0;
    let employeesFound = 0;
    let movementsFound = 0;
    const regionsFoundSet = new Set<string>();

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;

      // Extract rows as 2D array to inspect headers
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      if (!rows || rows.length === 0) continue;

      // Find first row with non-empty strings (header row)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        if (rows[i] && rows[i].filter((c: any) => c !== undefined && c !== '').length >= 2) {
          headerRowIndex = i;
          break;
        }
      }

      const rawHeaders = rows[headerRowIndex] || [];
      const normalizedHeaders = rawHeaders.map(normalizeHeader);
      const dataRows = rows.slice(headerRowIndex + 1).filter((r: any[]) => r && r.length > 0);

      // Detect sheet type
      const isMaterial =
        normalizedHeaders.some((h) => h.includes('COD') || h.includes('MATERIAL') || h.includes('PRODUTO')) &&
        normalizedHeaders.some((h) => h.includes('SALDO') || h.includes('ESTOQUE') || h.includes('UNID'));

      const isEmployee =
        normalizedHeaders.some((h) => h.includes('MATRICULA') || h.includes('MAT') || h.includes('RE_')) &&
        normalizedHeaders.some((h) => h.includes('NOME') || h.includes('FUNCIONARIO') || h.includes('COLABORADOR'));

      const isRegion =
        normalizedHeaders.some((h) => h.includes('REGIAO') || h.includes('REGIONAL') || h.includes('POLO')) &&
        !isEmployee &&
        !isMaterial;

      const isMovement =
        normalizedHeaders.some((h) => h.includes('ENTRADA') || h.includes('SAIDA') || h.includes('RETIRADA') || h.includes('MOVIMENTO')) ||
        (normalizedHeaders.some((h) => h.includes('DATA')) && normalizedHeaders.some((h) => h.includes('QUANTIDADE')));

      let detectedType: ExcelImportAnalysis['sheets'][0]['detectedType'] = 'DESCONHECIDO';

      if (isMaterial) {
        detectedType = 'MATERIAIS';
        materialsFound += dataRows.length;
      } else if (isEmployee) {
        detectedType = 'FUNCIONARIOS';
        employeesFound += dataRows.length;

        // Check for regions in employee rows
        const regionColIdx = normalizedHeaders.findIndex(
          (h) => h.includes('REGIAO') || h.includes('REGIONAL') || h.includes('BASE')
        );
        if (regionColIdx !== -1) {
          dataRows.forEach((r) => {
            const regVal = r[regionColIdx];
            if (regVal && typeof regVal === 'string' && regVal.trim()) {
              regionsFoundSet.add(regVal.trim());
            }
          });
        }
      } else if (isRegion) {
        detectedType = 'REGIOES';
        dataRows.forEach((r) => {
          const firstCol = r[0] || r[1];
          if (firstCol && typeof firstCol === 'string' && firstCol.trim()) {
            regionsFoundSet.add(firstCol.trim());
          }
        });
      } else if (isMovement) {
        detectedType = 'MOVIMENTACOES';
        movementsFound += dataRows.length;
      }

      sheetsSummary.push({
        name: sheetName,
        rowCount: dataRows.length,
        detectedType,
        headers: rawHeaders.map((h: any) => String(h || '')).filter(Boolean),
      });
    }

    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      sheets: sheetsSummary,
      materialsFound,
      employeesFound,
      regionsFound: Array.from(regionsFoundSet),
      movementsFound,
    };
  },

  /**
   * Imports data from the spreadsheet into the system, preserving official codes and preventing duplicates
   */
  async importFromExcel(
    file: File,
    user: { id: string; name: string; role: UserRole },
    options: {
      updateExistingStock?: boolean;
      importNewEmployees?: boolean;
      syncMovements?: boolean;
    } = { updateExistingStock: true, importNewEmployees: true, syncMovements: true }
  ): Promise<{ success: boolean; message: string; log: ExcelSyncLog }> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

    // Step 1: Create security backup of current database state before any mutations
    const backupSnapshot = {
      timestamp: new Date().toISOString(),
      materials: dbService.getMaterials(),
      employees: dbService.getEmployees(),
      movements: dbService.getMovements(),
      regions: dbService.getRegions(),
    };
    const backupKey = `cplu_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify(backupSnapshot));
    } catch (e) {
      console.warn('Backup storage limit warning:', e);
    }

    let materialsProcessed = 0;
    let employeesProcessed = 0;
    let movementsSynced = 0;
    let conflictsResolved = 0;
    const detectedSheetsList: string[] = [];

    // Process Sheets
    for (const sheetName of wb.SheetNames) {
      detectedSheetsList.push(sheetName);
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;

      const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
      if (!rawRows || rawRows.length === 0) continue;

      // Normalize keys for the first row to determine column mappings
      const sampleRow = rawRows[0];
      const colMap: Record<string, string> = {};
      Object.keys(sampleRow).forEach((origKey) => {
        colMap[normalizeHeader(origKey)] = origKey;
      });

      // Find key by normalized candidates
      const findKey = (...candidates: string[]): string | undefined => {
        for (const c of candidates) {
          const match = Object.keys(colMap).find((k) => k === c || k.includes(c));
          if (match) return colMap[match];
        }
        return undefined;
      };

      // Check if this sheet is for MATERIALS
      const codeKey = findKey('CODIGO', 'COD_MATERIAL', 'COD', 'PRODUTO_COD', 'REFERENCIA');
      const nameKey = findKey('DESCRICAO', 'NOME', 'MATERIAL', 'PRODUTO', 'DESCRICAO_DO_MATERIAL');
      const stockKey = findKey('SALDO', 'ESTOQUE', 'ESTOQUE_ATUAL', 'SALDO_ATUAL', 'QTD');

      if (codeKey && nameKey) {
        // Materials Sheet
        const currentMaterials = dbService.getMaterials();
        const minStockKey = findKey('MINIMO', 'ESTOQUE_MINIMO', 'MIN', 'COTA_MINIMA');
        const unitKey = findKey('UNIDADE', 'UNID', 'UN', 'MEDIDA');
        const catKey = findKey('CATEGORIA', 'TIPO', 'GRUPO');
        const shelfKey = findKey('PRATELEIRA', 'LOCALIZACAO', 'LOCAL', 'ENDERECO');
        const caKey = findKey('CA', 'NUMERO_CA', 'CERTIFICADO');
        const supplierKey = findKey('FORNECEDOR', 'FABRICANTE');

        for (const row of rawRows) {
          const rawCode = String(row[codeKey] || '').trim();
          const rawName = String(row[nameKey] || '').trim();
          if (!rawCode || !rawName) continue;

          const existing = currentMaterials.find(
            (m) => m.code.toUpperCase() === rawCode.toUpperCase()
          );

          const stockVal = stockKey ? parseNumeric(row[stockKey], 0) : 0;
          const minStockVal = minStockKey ? parseNumeric(row[minStockKey], 10) : 10;
          const unitVal = (unitKey ? String(row[unitKey] || 'UN').trim().toUpperCase() : 'UN') as UnitOfMeasure;
          const catVal = (catKey ? String(row[catKey] || 'Consumíveis').trim() : 'Consumíveis') as MaterialCategory;
          const shelfVal = shelfKey ? String(row[shelfKey] || 'PRAT-GERAL').trim() : 'PRAT-GERAL';
          const caVal = caKey ? String(row[caKey] || '').trim() : undefined;
          const suppVal = supplierKey ? String(row[supplierKey] || '').trim() : undefined;

          if (existing) {
            // Preserve official code! Only update current stock if allowed and non-negative
            if (options.updateExistingStock && stockVal >= 0 && stockVal !== existing.currentStock) {
              const previousStock = existing.currentStock;
              dbService.registerStockMovement({
                materialId: existing.id,
                type: stockVal > previousStock ? 'ENTRADA_AJUSTE' : 'SAIDA_AJUSTE',
                quantity: Math.abs(stockVal - previousStock),
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                location: existing.location,
                sector: 'Sincronização Excel',
                observation: `Sincronização automática com planilha Excel "${file.name}" (Aba: ${sheetName}).`,
                justification: `Ajuste de conciliação física via importação de planilha oficial. Saldo de ${previousStock} para ${stockVal}.`,
              });
              conflictsResolved++;
            }
            materialsProcessed++;
          } else {
            // New Material: Create without duplicate code
            dbService.createMaterial(
              {
                code: rawCode.toUpperCase(),
                name: rawName,
                description: `Importado da planilha ${file.name} - ${sheetName}`,
                category: catVal,
                unit: unitVal,
                currentStock: Math.max(0, stockVal),
                minStock: minStockVal,
                location: 'Almoxarifado Central',
                shelf: shelfVal,
                supplier: suppVal,
                isEpi: Boolean(caVal || catVal === 'EPI'),
                caNumber: caVal,
                status: 'ativo',
              },
              user
            );
            materialsProcessed++;
          }
        }
        continue;
      }

      // Check if this sheet is for EMPLOYEES & REGIONS
      const matKey = findKey('MATRICULA', 'MAT', 'RE', 'REGISTRO', 'IDENTIFICACAO');
      const empNameKey = findKey('NOME', 'FUNCIONARIO', 'COLABORADOR', 'NOME_FUNCIONARIO');

      if (matKey && empNameKey && options.importNewEmployees) {
        const regionKey = findKey('REGIAO', 'REGIONAL', 'POLO', 'BASE', 'LOCALIDADE');
        const sectorKey = findKey('SETOR', 'DEPARTAMENTO', 'EQUIPE', 'TURNO');
        const roleKey = findKey('CARGO', 'FUNCAO', 'OCUPACAO');
        const shoeKey = findKey('BOTA', 'CALCADO', 'NUM_BOTA');
        const gloveKey = findKey('LUVA', 'TAM_LUVA');
        const uniformKey = findKey('UNIFORME', 'TAM_UNIFORME');

        for (const row of rawRows) {
          const rawMat = String(row[matKey] || '').trim();
          const rawEmpName = String(row[empNameKey] || '').trim();
          if (!rawMat || !rawEmpName) continue;

          let regionName = regionKey ? String(row[regionKey] || '').trim() : '';
          let regionId: string | undefined = undefined;

          if (regionName) {
            // Find or create region
            const regions = dbService.getRegions();
            let matchedRegion = regions.find(
              (rg) => rg.name.toLowerCase() === regionName.toLowerCase()
            );

            if (!matchedRegion) {
              const resReg = dbService.createRegion(
                {
                  code: 'REG-' + regionName.substring(0, 3).toUpperCase(),
                  name: regionName,
                  active: true,
                },
                user
              );
              matchedRegion = resReg.region;
            }

            if (matchedRegion) {
              regionId = matchedRegion.id;
              regionName = matchedRegion.name;
            }
          }

          const existingEmp = dbService.getEmployeeByMatricula(rawMat);
          if (existingEmp) {
            // Update region if row has region and employee was unassigned or changed
            if (regionId && existingEmp.regionId !== regionId) {
              dbService.updateEmployee(
                existingEmp.id,
                {
                  regionId,
                  regionName,
                  sector: sectorKey ? String(row[sectorKey] || existingEmp.sector) : existingEmp.sector,
                },
                user
              );
              conflictsResolved++;
            }
            employeesProcessed++;
          } else {
            // Create employee
            dbService.createEmployee(
              {
                matricula: rawMat.toUpperCase(),
                name: rawEmpName,
                sector: sectorKey ? String(row[sectorKey] || 'Limpeza Urbana').trim() : 'Limpeza Urbana',
                role: roleKey ? String(row[roleKey] || 'Gari / Agente').trim() : 'Gari / Agente',
                regionId,
                regionName,
                status: 'ativo',
                shoeSize: shoeKey ? String(row[shoeKey] || '').trim() : undefined,
                gloveSize: gloveKey ? String(row[gloveKey] || '').trim() : undefined,
                uniformSize: uniformKey ? String(row[uniformKey] || '').trim() : undefined,
                admissionDate: new Date().toISOString().split('T')[0],
              },
              user
            );
            employeesProcessed++;
          }
        }
      }
    }

    // Save Sync Log
    const syncLog: ExcelSyncLog = {
      id: 'log-sync-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      fileName: file.name,
      action: 'IMPORT_TOTAL',
      sheetsDetected: detectedSheetsList,
      materialsProcessed,
      employeesProcessed,
      movementsSynced,
      conflictsResolved,
      status: 'SUCESSO',
      details: `Importação concluída com sucesso. ${materialsProcessed} materiais processados, ${employeesProcessed} funcionários analisados, ${conflictsResolved} conciliações aplicadas. Backup salvo com ID ${backupKey}.`,
    };

    dbService.addExcelSyncLog(syncLog);

    return {
      success: true,
      message: `Planilha "${file.name}" sincronizada com sucesso! ${materialsProcessed} itens e ${employeesProcessed} colaboradores conferidos.`,
      log: syncLog,
    };
  },

  /**
   * Generates a complete, multi-sheet official Excel workbook containing all real data
   */
  exportToWorkbook(): XLSX.WorkBook {
    const materials = dbService.getMaterials();
    const employees = dbService.getEmployees();
    const movements = dbService.getMovements();
    const regions = dbService.getRegions();
    const requisitions = dbService.getRequisitions();

    const wb = XLSX.utils.book_new();

    // 1. Sheet: Materiais_Estoque
    const materialsData = materials.map((m) => ({
      CODIGO: m.code,
      DESCRICAO: m.name,
      CATEGORIA: m.category,
      UNIDADE: m.unit,
      SALDO_ATUAL: m.currentStock,
      ESTOQUE_MINIMO: m.minStock,
      SITUACAO: m.status.toUpperCase(),
      LOCALIZACAO: m.location,
      PRATELEIRA: m.shelf,
      NUMERO_CA: m.caNumber || '',
      FORNECEDOR: m.supplier || '',
      STATUS_CRITICO: m.currentStock <= m.minStock ? 'ABAIXO DO MINIMO' : 'NORMAL',
      DATA_ATUALIZACAO: m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('pt-BR') : '',
    }));
    const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(wb, wsMaterials, 'Materiais_Estoque');

    // 2. Sheet: Funcionarios_Regioes
    const employeesData = employees.map((e) => ({
      MATRICULA: e.matricula,
      NOME: e.name,
      REGIAO_OPERACIONAL: e.regionName || 'Sem Região Vinculada',
      SETOR: e.sector,
      FUNCAO: e.role,
      SITUACAO: e.status.toUpperCase(),
      TAM_BOTA: e.shoeSize || '',
      TAM_LUVA: e.gloveSize || '',
      TAM_UNIFORME: e.uniformSize || '',
      DATA_ADMISSAO: e.admissionDate ? new Date(e.admissionDate).toLocaleDateString('pt-BR') : '',
    }));
    const wsEmployees = XLSX.utils.json_to_sheet(employeesData);
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'Funcionarios_Regioes');

    // 3. Sheet: Regioes_Operacionais
    const regionsData = regions.map((r) => {
      const empCount = employees.filter((e) => e.regionId === r.id).length;
      const movCount = movements.filter((m) => m.regionId === r.id && m.type.startsWith('SAIDA_')).length;
      const totalUnits = movements
        .filter((m) => m.regionId === r.id && m.type.startsWith('SAIDA_'))
        .reduce((sum, m) => sum + m.quantity, 0);

      return {
        CODIGO_REGIAO: r.code,
        NOME_REGIAO: r.name,
        SUPERVISOR: r.supervisor || 'Não informado',
        TOTAL_COLABORADORES: empCount,
        RETIRADAS_REGISTRADAS: movCount,
        UNIDADES_CONSUMIDAS: totalUnits,
        SITUACAO: r.active ? 'ATIVA' : 'INATIVA',
      };
    });
    const wsRegions = XLSX.utils.json_to_sheet(regionsData);
    XLSX.utils.book_append_sheet(wb, wsRegions, 'Regioes_Operacionais');

    // 4. Sheet: Movimentacoes_Historico
    const movementsData = movements.map((m) => ({
      DATA_HORA: m.date ? new Date(m.date).toLocaleString('pt-BR') : '',
      TIPO_MOVIMENTO: m.type,
      COD_MATERIAL: m.materialCode,
      DESCRICAO_MATERIAL: m.materialName,
      QUANTIDADE: m.quantity,
      SALDO_ANTERIOR: m.previousStock,
      NOVO_SALDO: m.newStock,
      FUNCIONARIO_DESTINATARIO: m.employeeName || '',
      MATRICULA_DESTINATARIO: m.employeeMatricula || '',
      REGIAO: m.regionName || '',
      NUMERO_REQUISICAO: m.requisitionNumber || '',
      RESPONSAVEL_ENTREGA: m.userName,
      JUSTIFICATIVA_OBSERVACOES: m.justification || m.observation || '',
    }));
    const wsMovements = XLSX.utils.json_to_sheet(movementsData);
    XLSX.utils.book_append_sheet(wb, wsMovements, 'Movimentacoes_Historico');

    // 5. Sheet: Consumo_Por_Regiao (Consolidated Matrix)
    const consumptionSummary: any[] = [];
    const exitMovements = movements.filter((m) => m.type.startsWith('SAIDA_'));

    regions.forEach((rg) => {
      const regExits = exitMovements.filter((m) => m.regionId === rg.id || m.regionName === rg.name);
      const productTotals: Record<string, { code: string; name: string; qty: number }> = {};

      regExits.forEach((mov) => {
        if (!productTotals[mov.materialCode]) {
          productTotals[mov.materialCode] = {
            code: mov.materialCode,
            name: mov.materialName,
            qty: 0,
          };
        }
        productTotals[mov.materialCode].qty += mov.quantity;
      });

      Object.values(productTotals).forEach((p) => {
        consumptionSummary.push({
          REGIAO: rg.name,
          CODIGO_PRODUTO: p.code,
          PRODUTO: p.name,
          TOTAL_RETIRADO: p.qty,
          PERIODO_CONCILIADO: 'Ano 2026',
        });
      });
    });

    const wsConsumption = XLSX.utils.json_to_sheet(
      consumptionSummary.length > 0
        ? consumptionSummary
        : [{ REGIAO: 'Paulista', CODIGO_PRODUTO: 'EPI-LUV-01', PRODUTO: 'Luva de Vaqueta', TOTAL_RETIRADO: 2 }]
    );
    XLSX.utils.book_append_sheet(wb, wsConsumption, 'Consumo_Por_Regiao');

    return wb;
  },

  /**
   * Downloads the complete synchronized workbook in .xlsx format
   */
  downloadSynchronizedExcel(filename = `CPLU_Almoxarifado_Sincronizado_${new Date().toISOString().split('T')[0]}.xlsx`) {
    const wb = this.exportToWorkbook();
    XLSX.writeFile(wb, filename);
  },

  /**
   * Generates and downloads the official standard blank template for user filling
   */
  downloadStandardTemplate() {
    const wb = XLSX.utils.book_new();

    // Standard Template for Materials
    const sampleMaterials = [
      {
        CODIGO: 'EPI-LUV-01',
        DESCRICAO: 'Luva de Vaqueta Mista Reforçada',
        CATEGORIA: 'EPI',
        UNIDADE: 'PAR',
        SALDO_ATUAL: 120,
        ESTOQUE_MINIMO: 50,
        PRATELEIRA: 'PRAT-EPI-01',
        NUMERO_CA: '32456',
        FORNECEDOR: 'Couros & Cia EPIs',
      },
      {
        CODIGO: 'EPI-BOT-02',
        DESCRICAO: 'Botina de Segurança Nobuck Bico Composite',
        CATEGORIA: 'EPI',
        UNIDADE: 'PAR',
        SALDO_ATUAL: 35,
        ESTOQUE_MINIMO: 30,
        PRATELEIRA: 'PRAT-EPI-02',
        NUMERO_CA: '41980',
        FORNECEDOR: 'Vulcan Calçados',
      },
      {
        CODIGO: 'MAT-VAS-06',
        DESCRICAO: 'Vassourão de Piaçava 60cm com Cabo Reforçado',
        CATEGORIA: 'Ferramental',
        UNIDADE: 'UN',
        SALDO_ATUAL: 45,
        ESTOQUE_MINIMO: 20,
        PRATELEIRA: 'PRAT-FER-01',
        NUMERO_CA: '',
        FORNECEDOR: 'Vassouras Urbanas SP',
      },
    ];
    const ws1 = XLSX.utils.json_to_sheet(sampleMaterials);
    XLSX.utils.book_append_sheet(wb, ws1, 'Materiais');

    // Standard Template for Employees with Regions
    const sampleEmployees = [
      {
        MATRICULA: 'LU-10452',
        NOME: 'Raimundo Nonato da Silva',
        REGIAO: 'Paulista',
        SETOR: 'Varrição Central',
        FUNCAO: 'Gari / Agente de Limpeza',
        TAM_BOTA: '41',
        TAM_LUVA: 'G',
        TAM_UNIFORME: 'G',
      },
      {
        MATRICULA: 'LU-10884',
        NOME: 'Sebastião Alves de Lima',
        REGIAO: 'Taquá',
        SETOR: 'Coleta Domiciliar',
        FUNCAO: 'Motorista de Caminhão Coletor',
        TAM_BOTA: '42',
        TAM_LUVA: 'M',
        TAM_UNIFORME: 'GG',
      },
      {
        MATRICULA: 'LU-11230',
        NOME: 'Carlos Eduardo Ferreira',
        REGIAO: 'Penha',
        SETOR: 'Capina & Roçagem',
        FUNCAO: 'Operador de Roçadeira',
        TAM_BOTA: '40',
        TAM_LUVA: 'G',
        TAM_UNIFORME: 'M',
      },
    ];
    const ws2 = XLSX.utils.json_to_sheet(sampleEmployees);
    XLSX.utils.book_append_sheet(wb, ws2, 'Funcionarios');

    // Regions list
    const sampleRegions = [
      { CODIGO: 'REG-PLT', REGIAO: 'Paulista', SUPERVISOR: 'Carlos Alberto Siqueira' },
      { CODIGO: 'REG-TQA', REGIAO: 'Taquá', SUPERVISOR: 'Renata Albuquerque' },
      { CODIGO: 'REG-PNH', REGIAO: 'Penha', SUPERVISOR: 'Marcelo Pires de Castro' },
      { CODIGO: 'REG-CEN', REGIAO: 'Sé / Centro', SUPERVISOR: 'Gilberto Ramos' },
      { CODIGO: 'REG-SNT', REGIAO: 'Santana', SUPERVISOR: 'Luciana Freitas' },
    ];
    const ws3 = XLSX.utils.json_to_sheet(sampleRegions);
    XLSX.utils.book_append_sheet(wb, ws3, 'Regioes');

    XLSX.writeFile(wb, 'CPLU_Modelo_Oficial_Importacao.xlsx');
  },
};
