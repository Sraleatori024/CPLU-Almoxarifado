import * as XLSX from 'xlsx';
import { dbService } from './db';
import {
  Material,
  Employee,
  Movement,
  Region,
  ExcelSyncLog,
  ExcelImportAnalysis,
  ExcelSheetReport,
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

/**
 * Preserves exact code string including leading zeros.
 * If a numeric code has 1-5 digits, pads it with leading zeros to 6 digits (official IKKI standard: 001420).
 */
function formatCodeValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (/^\d{1,5}$/.test(str)) {
    return str.padStart(6, '0');
  }
  return str;
}

/**
 * Parses dates from various formats (Excel serial number, DD/MM/YYYY, ISO string, Date object)
 */
function parseExcelDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel serial number
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  }
  const s = String(val).trim();
  const brMatch = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}`;
  }
  return s;
}

/**
 * Checks if a value represents a spreadsheet formula error
 */
function isFormulaError(val: any): boolean {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  return (
    s.startsWith('#REF!') ||
    s.startsWith('#VALUE!') ||
    s.startsWith('#VALOR!') ||
    s.startsWith('#N/A') ||
    s.startsWith('#DIV/0!') ||
    s.startsWith('#NAME?') ||
    s.startsWith('#NOME?') ||
    s.startsWith('#NULL!') ||
    s.startsWith('#NULO!') ||
    s.startsWith('#NUM!')
  );
}

interface ExtractedSheetData {
  headers: string[];
  normalizedHeaders: string[];
  colMap: Record<string, string>;
  rows: Record<string, any>[];
  dataRowsArray: any[][];
  headerRowIndex: number;
}

function extractSheetRowsAndHeaders(sheet: XLSX.WorkSheet): ExtractedSheetData {
  const rawGrid: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });

  if (!rawGrid || rawGrid.length === 0) {
    return {
      headers: [],
      normalizedHeaders: [],
      colMap: {},
      rows: [],
      dataRowsArray: [],
      headerRowIndex: 0,
    };
  }

  const headerKeywords = [
    'COD', 'IKKI', 'MATRICULA', 'MATERIAL', 'DESCRICAO', 'DESC',
    'ITEM', 'PRODUTO', 'EQUIPAMENTO', 'UNID', 'UNIDADE', 'SALDO',
    'ESTOQUE', 'QUANTIDADE', 'QTD', 'DATA', 'REQUISICAO', 'PEDIDO',
    'FORNECEDOR', 'EMPRESA', 'NOTA', 'NF', 'CA', 'REGIAO', 'SETOR',
    'COLABORADOR', 'FUNCIONARIO', 'NOME', 'CARGO'
  ];

  let headerRowIndex = 0;
  let bestScore = -1;

  for (let r = 0; r < Math.min(rawGrid.length, 15); r++) {
    const row = rawGrid[r];
    if (!row || !Array.isArray(row)) continue;
    const nonEmpty = row.filter((c: any) => c !== null && c !== undefined && String(c).trim() !== '');
    if (nonEmpty.length < 2) continue;

    let score = 0;
    nonEmpty.forEach((c: any) => {
      const norm = normalizeHeader(c);
      if (headerKeywords.some((kw) => norm.includes(kw))) {
        score++;
      }
    });

    if (score > bestScore && score >= 1) {
      bestScore = score;
      headerRowIndex = r;
    }
  }

  if (bestScore <= 0) {
    for (let r = 0; r < Math.min(rawGrid.length, 10); r++) {
      const row = rawGrid[r];
      if (!row || !Array.isArray(row)) continue;
      const nonEmpty = row.filter((c: any) => c !== null && c !== undefined && String(c).trim() !== '');
      if (nonEmpty.length >= 2) {
        headerRowIndex = r;
        break;
      }
    }
  }

  const rawHeaders: string[] = (rawGrid[headerRowIndex] || []).map((h: any) => String(h || '').trim());
  const colMap: Record<string, string> = {};
  const normalizedHeaders: string[] = [];

  rawHeaders.forEach((h, idx) => {
    const norm = normalizeHeader(h) || `COLUNA_${idx + 1}`;
    normalizedHeaders.push(norm);
    colMap[norm] = h || `Coluna ${idx + 1}`;
  });

  const rows: Record<string, any>[] = [];
  const dataRowsArray: any[][] = [];

  for (let r = headerRowIndex + 1; r < rawGrid.length; r++) {
    const row = rawGrid[r];
    if (!row || !Array.isArray(row)) continue;

    const isTotalRow = row.some((c: any) => {
      const s = String(c || '').toUpperCase();
      return s.includes('TOTAL GERAL') || s.includes('SUBTOTAL') || s.startsWith('TOTAL:');
    });
    const isEmpty = row.every((c: any) => c === null || c === undefined || String(c).trim() === '');

    if (isEmpty || isTotalRow) continue;

    dataRowsArray.push(row);

    const rowObj: Record<string, any> = {};
    rawHeaders.forEach((h, colIdx) => {
      const norm = normalizedHeaders[colIdx];
      const val = row[colIdx];
      rowObj[norm] = val;
      if (h) {
        rowObj[h] = val;
      }
    });
    rows.push(rowObj);
  }

  return {
    headers: rawHeaders,
    normalizedHeaders,
    colMap,
    rows,
    dataRowsArray,
    headerRowIndex,
  };
}

function findKeyInMap(colMap: Record<string, string>, ...candidates: string[]): string | undefined {
  const normKeys = Object.keys(colMap);
  for (const c of candidates) {
    const exact = normKeys.find((k) => k === c);
    if (exact) return colMap[exact];
  }
  for (const c of candidates) {
    const match = normKeys.find((k) => k.startsWith(c) || k.includes(c));
    if (match) return colMap[match];
  }
  return undefined;
}

// IndexedDB persistence for FileSystemFileHandle
const IDB_NAME = 'cplu_fs_db';
const IDB_STORE = 'handles';
const IDB_KEY = 'official_excel_handle';

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB indisponível'));
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const excelSyncService = {
  /**
   * Checks if File System Access API is supported by the current browser
   */
  isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
  },

  /**
   * Retrieves stored local file handle from IndexedDB
   */
  async getStoredLocalFileHandle(): Promise<FileSystemFileHandle | null> {
    try {
      const db = await openHandleDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(IDB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Saves local file handle to IndexedDB
   */
  async saveStoredLocalFileHandle(handle: FileSystemFileHandle): Promise<void> {
    try {
      const db = await openHandleDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(handle, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Erro ao salvar handle no IndexedDB:', e);
    }
  },

  /**
   * Clears stored local file handle from IndexedDB
   */
  async disconnectLocalExcelFile(): Promise<void> {
    try {
      const db = await openHandleDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.delete(IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Erro ao remover handle:', e);
    }
  },

  /**
   * Prompts user to select local CONSUMO MATERIAL CPLU.xlsx file using File System Access API
   */
  async connectLocalExcelFile(): Promise<{
    success: boolean;
    message: string;
    handle?: FileSystemFileHandle;
    file?: File;
  }> {
    if (!this.isFileSystemAccessSupported()) {
      return {
        success: false,
        message:
          'Seu navegador não oferece suporte nativo à gravação direta de arquivos locais (File System Access API). Utilize o Google Chrome, Microsoft Edge ou Opera, ou use o fluxo de importação/exportação padrão.',
      };
    }

    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Planilha Oficial de Almoxarifado (.xlsx, .xls)',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
            },
          },
        ],
        multiple: false,
      });

      if (!handle) {
        return { success: false, message: 'Nenhum arquivo selecionado.' };
      }

      // Request readwrite permission
      // @ts-ignore
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Permissão de leitura e escrita negada pelo usuário para este arquivo.',
        };
      }

      const file = await handle.getFile();
      await this.saveStoredLocalFileHandle(handle);

      return {
        success: true,
        message: `Arquivo local "${file.name}" conectado com sucesso com permissão de leitura e gravação!`,
        handle,
        file,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, message: 'Operação cancelada pelo usuário.' };
      }
      return {
        success: false,
        message: 'Erro ao conectar arquivo local: ' + (err.message || 'Falha de acesso ao disco.'),
      };
    }
  },

  /**
   * Reads an Excel workbook and analyzes all sheets, official company tabs, columns, and data counts
   */
  async analyzeExcelFile(file: File): Promise<ExcelImportAnalysis> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });

    const sheetsSummary: ExcelSheetReport[] = [];
    let materialsFound = 0;
    let employeesFound = 0;
    let movementsFound = 0;
    let totalValidRecords = 0;
    let totalIgnoredRecords = 0;
    let totalErrors = 0;
    let detectedOfficialIkkiSheet = false;
    const regionsFoundSet = new Set<string>();

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;

      const normSheetName = normalizeHeader(sheetName);

      const extraction = extractSheetRowsAndHeaders(sheet);
      const rawHeaders = extraction.headers;
      const normalizedHeaders = extraction.normalizedHeaders;
      const dataRows = extraction.dataRowsArray;
      if (rawHeaders.length === 0 && dataRows.length === 0) continue;

      // Identify Sheet Type based on official names or headers
      let detectedType: ExcelSheetReport['detectedType'] = 'DESCONHECIDO';

      if (
        normSheetName.includes('IKKI') ||
        normSheetName === 'LIST_COD_IKKI' ||
        normSheetName.includes('LIST_COD')
      ) {
        detectedType = 'LIST_IKKI';
        detectedOfficialIkkiSheet = true;
      } else if (normSheetName.includes('LANCAMENTO_DE_CONSUMO') || normSheetName.includes('CONSUMO')) {
        detectedType = 'CONSUMO';
      } else if (normSheetName.includes('ENTRADAS') || normSheetName.includes('ENTRADA')) {
        detectedType = 'ENTRADAS';
      } else if (normSheetName.includes('SALDO') || normSheetName.includes('SALDO_AGOSTO')) {
        detectedType = 'SALDO_AGOSTO';
      } else if (normSheetName.includes('CONSOLIDAD') || normSheetName.includes('CONSOLIDADO')) {
        detectedType = 'CONSOLIDADO';
      } else if (normSheetName === 'EPI' || normSheetName.includes('EPIS')) {
        detectedType = 'EPI';
      } else {
        // Fallback by headers
        const isMaterial =
          normalizedHeaders.some((h) => h.includes('COD') || h.includes('MATERIAL') || h.includes('PRODUTO')) &&
          normalizedHeaders.some((h) => h.includes('SALDO') || h.includes('ESTOQUE') || h.includes('UNID') || h.includes('DESCRICAO'));

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

        if (isMaterial) detectedType = 'MATERIAIS';
        else if (isEmployee) detectedType = 'FUNCIONARIOS';
        else if (isRegion) detectedType = 'REGIOES';
        else if (isMovement) detectedType = 'MOVIMENTACOES';
      }

      // Analyze rows for errors, formula errors, duplicates, and valid count
      let validRowsCount = 0;
      let ignoredRowsCount = 0;
      let sheetErrors = 0;
      const sampleErrors: string[] = [];
      const samplePreview: any[] = [];
      const seenCodes = new Set<string>();

      // Locate code and name columns if available
      const codeColIdx = normalizedHeaders.findIndex(
        (h) => h.includes('COD') || h.includes('CODIGO') || h.includes('IKKI') || h.includes('MATRICULA')
      );
      const nameColIdx = normalizedHeaders.findIndex(
        (h) => h.includes('DESC') || h.includes('NOME') || h.includes('MATERIAL') || h.includes('PRODUTO')
      );

      for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
        const row = dataRows[rIdx];
        const isTotalRow = row.some((c) => String(c || '').toUpperCase().includes('TOTAL GERAL') || String(c || '').toUpperCase().includes('SUBTOTAL'));
        const isEmptyRow = row.every((c) => c === undefined || c === null || String(c).trim() === '');

        if (isEmptyRow || isTotalRow) {
          ignoredRowsCount++;
          continue;
        }

        // Check for formula errors in cells
        const hasFormulaErr = row.some(isFormulaError);
        if (hasFormulaErr) {
          sheetErrors++;
          if (sampleErrors.length < 5) {
            sampleErrors.push(`Linha ${rIdx + 2}: Erro de fórmula detectado na planilha (#REF!, #VALOR! ou similar).`);
          }
        }

        // Duplicate code validation
        if (codeColIdx !== -1 && row[codeColIdx]) {
          const rawCode = formatCodeValue(row[codeColIdx]);
          if (rawCode) {
            if (seenCodes.has(rawCode.toUpperCase())) {
              sheetErrors++;
              if (sampleErrors.length < 5) {
                sampleErrors.push(`Linha ${rIdx + 2}: Código duplicado nesta aba "${rawCode}".`);
              }
            } else {
              seenCodes.add(rawCode.toUpperCase());
            }
          }
        }

        // Missing essential description validation
        if (nameColIdx !== -1 && (!row[nameColIdx] || String(row[nameColIdx]).trim() === '')) {
          sheetErrors++;
          if (sampleErrors.length < 5) {
            sampleErrors.push(`Linha ${rIdx + 2}: Campo de descrição ou nome obrigatório ausente.`);
          }
        }

        validRowsCount++;

        // Add to sample preview
        if (samplePreview.length < 5) {
          const previewObj: Record<string, any> = {};
          rawHeaders.slice(0, 6).forEach((h, hIdx) => {
            previewObj[String(h || `Coluna ${hIdx + 1}`)] = row[hIdx] ?? '';
          });
          samplePreview.push(previewObj);
        }
      }

      // Update counters based on detected sheet
      if (detectedType === 'LIST_IKKI' || detectedType === 'MATERIAIS' || detectedType === 'SALDO_AGOSTO' || detectedType === 'EPI') {
        materialsFound += validRowsCount;
      } else if (detectedType === 'FUNCIONARIOS') {
        employeesFound += validRowsCount;
      } else if (detectedType === 'CONSUMO' || detectedType === 'ENTRADAS' || detectedType === 'MOVIMENTACOES') {
        movementsFound += validRowsCount;
      }

      totalValidRecords += validRowsCount;
      totalIgnoredRecords += ignoredRowsCount;
      totalErrors += sheetErrors;

      sheetsSummary.push({
        name: sheetName,
        rowCount: dataRows.length,
        detectedType,
        headers: rawHeaders.map((h: any) => String(h || '')).filter(Boolean),
        validRowsCount,
        ignoredRowsCount,
        errorCount: sheetErrors,
        sampleErrors,
        samplePreview,
      });
    }

    // Default regions if not found
    if (regionsFoundSet.size === 0) {
      regionsFoundSet.add('Paulista');
      regionsFoundSet.add('Taquá');
      regionsFoundSet.add('Penha');
    }

    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      sheets: sheetsSummary,
      materialsFound,
      employeesFound,
      regionsFound: Array.from(regionsFoundSet),
      movementsFound,
      totalValidRecords,
      totalIgnoredRecords,
      totalErrors,
      detectedOfficialIkkiSheet,
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
    // read with raw: false to preserve formatted text and leading zeros
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });

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

    // Sort sheets by priority so master catalogs (IKKI, EPI, Saldos) are loaded before movements (Entradas, Consumo)
    const getSheetPriority = (name: string): number => {
      const n = normalizeHeader(name);
      if (n.includes('IKKI') || n.includes('LIST_COD')) return 1;
      if (n === 'EPI' || n.includes('EPIS')) return 2;
      if (n.includes('SALDO') || n.includes('CONSOLIDAD')) return 3;
      if (n.includes('ENTRADA')) return 4;
      if (n.includes('CONSUMO') || n.includes('LANCAMENTO')) return 5;
      if (n.includes('FUNCIONARIO') || n.includes('COLABORADOR')) return 6;
      return 7;
    };

    const sortedSheetNames = [...wb.SheetNames].sort((a, b) => getSheetPriority(a) - getSheetPriority(b));

    // Process Sheets
    for (const sheetName of sortedSheetNames) {
      detectedSheetsList.push(sheetName);
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;

      const normSheetName = normalizeHeader(sheetName);
      const extraction = extractSheetRowsAndHeaders(sheet);
      const rawRows = extraction.rows;
      const colMap = extraction.colMap;
      if (!rawRows || rawRows.length === 0) continue;

      const findKey = (...candidates: string[]): string | undefined => findKeyInMap(colMap, ...candidates);

      // 1. Process LIST. COD. IKKI or Master Catalog
      const isIkkiSheet =
        normSheetName.includes('IKKI') ||
        normSheetName === 'LIST_COD_IKKI' ||
        normSheetName.includes('LIST_COD') ||
        (findKey('CODIGO', 'COD_MATERIAL', 'COD_IKKI', 'IKKI') && findKey('DESCRICAO', 'NOME', 'MATERIAL'));

      if (isIkkiSheet) {
        const codeKey = findKey('COD_IKKI', 'CODIGO_IKKI', 'CODIGO', 'COD_MATERIAL', 'COD', 'REFERENCIA', 'ITEM');
        const nameKey = findKey('DESCRICAO', 'NOME', 'MATERIAL', 'PRODUTO', 'DESCRICAO_DO_MATERIAL', 'EQUIPAMENTO', 'ESPECIFICACAO');
        const unitKey = findKey('UNIDADE', 'UNID', 'UN', 'MEDIDA', 'U_M', 'UND');
        const catKey = findKey('CATEGORIA', 'TIPO', 'GRUPO', 'FAMILIA');
        const shelfKey = findKey('PRATELEIRA', 'LOCALIZACAO', 'LOCAL', 'ENDERECO', 'CORREDOR', 'LOCALIZACAO_FISICA');
        const caKey = findKey('CA', 'NUMERO_CA', 'CERTIFICADO', 'NUM_CA');
        const stockKey = findKey('SALDO', 'ESTOQUE', 'SALDO_ATUAL', 'QTD', 'QUANTIDADE', 'SALDO_CONCILIADO');
        const minStockKey = findKey('MINIMO', 'ESTOQUE_MINIMO', 'MIN', 'ESTOQUE_MIN');
        const supplierKey = findKey('FORNECEDOR', 'FABRICANTE', 'EMPRESA');

        if (codeKey && nameKey) {
          for (const row of rawRows) {
            const rawCode = formatCodeValue(row[codeKey]);
            const rawName = String(row[nameKey] || '').trim();
            if (!rawCode || !rawName) continue;
            if (rawCode.toUpperCase().includes('TOTAL') || isFormulaError(rawCode)) continue;

            const existing = dbService.getMaterialByCode(rawCode);

            const stockVal = stockKey ? parseNumeric(row[stockKey], 0) : 0;
            const minStockVal = minStockKey ? parseNumeric(row[minStockKey], 10) : 10;
            const unitVal = (unitKey ? String(row[unitKey] || 'UN').trim().toUpperCase() : 'UN') as UnitOfMeasure;
            const catVal = (catKey ? String(row[catKey] || 'EPI').trim() : 'EPI') as MaterialCategory;
            const shelfVal = shelfKey ? String(row[shelfKey] || 'Corredor 1, Prat. 1, Nív. 1').trim() : 'Corredor 1, Prat. 1, Nív. 1';
            const caVal = caKey ? String(row[caKey] || '').trim() : undefined;
            const suppVal = supplierKey ? String(row[supplierKey] || '').trim() : undefined;

            if (existing) {
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
                  sector: 'Sincronização Excel IKKI',
                  observation: `Sincronização automática com planilha oficial "${file.name}" (Aba: ${sheetName}).`,
                  justification: `Ajuste de conciliação de saldo via catálogo oficial IKKI. Saldo de ${previousStock} para ${stockVal}.`,
                });
                conflictsResolved++;
              }
              materialsProcessed++;
            } else {
              dbService.createMaterial(
                {
                  code: rawCode,
                  ikkiCode: rawCode,
                  name: rawName,
                  description: `Importado da planilha oficial ${file.name} - ${sheetName}`,
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
      }

      // 2. Process EPI Sheet (EPI specs, CA numbers, locations)
      if (normSheetName === 'EPI' || normSheetName.includes('EPIS')) {
        const codeKey = findKey('COD_IKKI', 'CODIGO_IKKI', 'CODIGO', 'COD', 'REFERENCIA', 'ITEM');
        const nameKey = findKey('EQUIPAMENTO_EPI', 'EQUIPAMENTO', 'DESCRICAO', 'NOME', 'MATERIAL');
        const caKey = findKey('NUMERO_CA', 'CA', 'CERTIFICADO', 'NUM_CA');
        const valKey = findKey('VALIDADE_MESES', 'VALIDADE', 'VALIDADE_CA', 'MESES');
        const stockKey = findKey('SALDO_DISPONIVEL', 'SALDO', 'ESTOQUE', 'QTD');
        const shelfKey = findKey('CORREDOR_PRATELEIRA', 'LOCALIZACAO', 'PRATELEIRA', 'CORREDOR', 'LOCAL');
        const suppKey = findKey('FORNECEDOR_HOMOLOGADO', 'FORNECEDOR', 'FABRICANTE');
        const unitKey = findKey('UNIDADE', 'UNID', 'UN');

        if (codeKey) {
          for (const row of rawRows) {
            const rawCode = formatCodeValue(row[codeKey]);
            if (!rawCode || isFormulaError(rawCode) || rawCode.toUpperCase().includes('TOTAL')) continue;

            const existing = dbService.getMaterialByCode(rawCode);
            const caVal = caKey ? String(row[caKey] || '').trim() : undefined;
            const valMonths = valKey ? parseNumeric(row[valKey], 6) : 6;
            const shelfVal = shelfKey ? String(row[shelfKey] || '').trim() : undefined;
            const suppVal = suppKey ? String(row[suppKey] || '').trim() : undefined;
            const stockVal = stockKey ? parseNumeric(row[stockKey], 0) : 0;
            const unitVal = (unitKey ? String(row[unitKey] || 'UN').trim().toUpperCase() : 'UN') as UnitOfMeasure;
            const nameVal = nameKey ? String(row[nameKey] || '').trim() : `EPI ${rawCode}`;

            if (existing) {
              const updates: Partial<Material> = { isEpi: true };
              if (caVal) updates.caNumber = caVal;
              if (valMonths) updates.validityMonths = valMonths;
              if (suppVal && !existing.supplier) updates.supplier = suppVal;
              if (shelfVal && !existing.shelf) updates.shelf = shelfVal;
              dbService.updateMaterial(existing.id, updates, user);
              materialsProcessed++;
            } else if (nameVal) {
              dbService.createMaterial(
                {
                  code: rawCode,
                  ikkiCode: rawCode,
                  name: nameVal,
                  description: `Equipamento de Proteção Individual importado da aba EPI (${file.name})`,
                  category: 'EPI',
                  unit: unitVal,
                  currentStock: Math.max(0, stockVal),
                  minStock: 10,
                  location: 'Almoxarifado Central',
                  shelf: shelfVal || 'Corredor 1, Prat. 1, Nív. 1',
                  supplier: suppVal,
                  isEpi: true,
                  caNumber: caVal,
                  validityMonths: valMonths,
                  status: 'ativo',
                },
                user
              );
              materialsProcessed++;
            }
          }
          continue;
        }
      }

      // 3. Process SALDO AGOSTO / CONSOLIDADADO / Balances
      if (normSheetName.includes('SALDO') || normSheetName.includes('CONSOLIDAD')) {
        const codeKey = findKey('COD_IKKI', 'CODIGO_IKKI', 'CODIGO', 'COD', 'REFERENCIA');
        const nameKey = findKey('DESCRICAO', 'PRODUTO', 'MATERIAL', 'NOME');
        const stockKey = findKey('SALDO_CONCILIADO', 'SALDO_AGOSTO', 'SALDO_FINAL', 'SALDO_ATUAL', 'SALDO', 'ESTOQUE', 'TOTAL_UNIDADES_CONSUMIDAS');
        const unitKey = findKey('UNIDADE', 'UNID', 'UN');

        if (codeKey && stockKey) {
          for (const row of rawRows) {
            const rawCode = formatCodeValue(row[codeKey]);
            if (!rawCode || isFormulaError(rawCode) || rawCode.toUpperCase().includes('TOTAL')) continue;

            const existing = dbService.getMaterialByCode(rawCode);
            const stockVal = parseNumeric(row[stockKey], 0);
            const rawName = nameKey ? String(row[nameKey] || '').trim() : '';

            if (existing) {
              if (options.updateExistingStock && stockVal >= 0 && stockVal !== existing.currentStock && !normSheetName.includes('CONSOLIDAD')) {
                const previousStock = existing.currentStock;
                dbService.registerStockMovement({
                  materialId: existing.id,
                  type: stockVal > previousStock ? 'ENTRADA_AJUSTE' : 'SAIDA_AJUSTE',
                  quantity: Math.abs(stockVal - previousStock),
                  userId: user.id,
                  userName: user.name,
                  userRole: user.role,
                  location: existing.location,
                  sector: 'Sincronização Saldo',
                  observation: `Conciliação de saldo via aba "${sheetName}".`,
                  justification: `Ajuste de saldo de ${previousStock} para ${stockVal}.`,
                });
                conflictsResolved++;
              }
              materialsProcessed++;
            } else if (rawName) {
              const unitVal = (unitKey ? String(row[unitKey] || 'UN').trim().toUpperCase() : 'UN') as UnitOfMeasure;
              dbService.createMaterial(
                {
                  code: rawCode,
                  ikkiCode: rawCode,
                  name: rawName,
                  description: `Material conciliado da aba ${sheetName} (${file.name})`,
                  category: 'EPI',
                  unit: unitVal,
                  currentStock: Math.max(0, stockVal),
                  minStock: 10,
                  location: 'Almoxarifado Central',
                  shelf: 'Corredor 1, Prat. 1, Nív. 1',
                  isEpi: false,
                  status: 'ativo',
                },
                user
              );
              materialsProcessed++;
            }
          }
          continue;
        }
      }

      // 4. Process ENTRADAS (Goods Receipt)
      if (normSheetName.includes('ENTRADA')) {
        const codeKey = findKey('COD_IKKI', 'CODIGO_IKKI', 'CODIGO', 'COD', 'MATERIAL');
        const nameKey = findKey('DESCRICAO_MATERIAL', 'DESCRICAO', 'NOME', 'MATERIAL', 'PRODUTO');
        const qtyKey = findKey('QUANTIDADE', 'QTD', 'ENTRADA', 'VALOR');
        const supplierKey = findKey('FORNECEDOR_EMPRESA', 'FORNECEDOR', 'EMPRESA', 'FABRICANTE');
        const nfKey = findKey('NOTA_FISCAL', 'NF', 'NFE', 'DOCUMENTO', 'NUM_NF');
        const dateKey = findKey('DATA_RECEBIMENTO', 'DATA', 'DT_RECEBIMENTO', 'DIA');
        const aisleKey = findKey('CORREDOR', 'ALA');
        const shelfKey = findKey('LOCAL_ARMAZENADO', 'PRATELEIRA', 'LOCAL', 'ENDERECO');
        const levelKey = findKey('NIVEL', 'ANDAR');

        if (codeKey && qtyKey && options.syncMovements) {
          for (const row of rawRows) {
            const rawCode = formatCodeValue(row[codeKey]);
            const qty = parseNumeric(row[qtyKey], 0);
            if (!rawCode || qty <= 0 || isFormulaError(rawCode)) continue;

            let mat = dbService.getMaterialByCode(rawCode);
            if (!mat) {
              const rawName = nameKey ? String(row[nameKey] || '').trim() : `Material ${rawCode}`;
              const resMat = dbService.createMaterial(
                {
                  code: rawCode,
                  ikkiCode: rawCode,
                  name: rawName || `Material ${rawCode}`,
                  description: `Material registrado via recebimento na aba ENTRADAS (${file.name})`,
                  category: 'EPI',
                  unit: 'UN',
                  currentStock: 0,
                  minStock: 10,
                  location: 'Almoxarifado Central',
                  shelf: `${aisleKey ? String(row[aisleKey] || 'Corredor 1').trim() : 'Corredor 1'}, ${shelfKey ? String(row[shelfKey] || 'Prateleira 1').trim() : 'Prateleira 1'}, ${levelKey ? String(row[levelKey] || 'Nível 1').trim() : 'Nível 1'}`,
                  isEpi: false,
                  status: 'ativo',
                },
                user
              );
              mat = resMat.material;
            }

            if (mat) {
              const aisle = aisleKey ? String(row[aisleKey] || 'Corredor 1').trim() : 'Corredor 1';
              const shelf = shelfKey ? String(row[shelfKey] || 'Prateleira 1').trim() : 'Prateleira 1';
              const level = levelKey ? String(row[levelKey] || 'Nível 1').trim() : 'Nível 1';
              const supplier = supplierKey ? String(row[supplierKey] || mat.supplier || '').trim() : mat.supplier;
              const nf = nfKey ? String(row[nfKey] || '').trim() : undefined;
              const recDate = dateKey ? parseExcelDate(row[dateKey]) : undefined;

              dbService.registerGoodsReceipt({
                materialIdOrCode: mat.id,
                quantity: qty,
                supplier,
                invoiceNumber: nf,
                receiptDate: recDate,
                aisle,
                shelf,
                level,
                user,
                observation: `Entrada importada da aba ENTRADAS da planilha ${file.name}.`,
                idempotencyKey: `excel_entry_${rawCode}_${qty}_${nf || 'SN'}_${recDate || ''}`,
              });
              movementsSynced++;
            }
          }
          continue;
        }
      }

      // 5. Process LANÇAMENTO DE CONSUMO (Withdrawals)
      if (normSheetName.includes('CONSUMO') || normSheetName.includes('LANCAMENTO')) {
        const codeKey = findKey('COD_IKKI', 'CODIGO_IKKI', 'CODIGO', 'COD', 'MATERIAL');
        const nameKey = findKey('DESCRICAO_MATERIAL', 'DESCRICAO', 'NOME', 'MATERIAL', 'PRODUTO');
        const qtyKey = findKey('QUANTIDADE', 'QTD', 'CONSUMO', 'RETIRADA', 'SAIDA');
        const reqKey = findKey('NUMERO_REQUISICAO', 'REQUISICAO', 'REQ', 'NUM_REQ', 'PEDIDO');
        const workerKey = findKey('COLABORADOR_DESTINATARIO', 'COLABORADOR', 'FUNCIONARIO', 'NOME', 'DESTINATARIO');
        const matKey = findKey('MATRICULA', 'MAT', 'RE');
        const regionKey = findKey('REGIAO_OPERACIONAL', 'REGIAO', 'REGIONAL', 'BASE', 'POLO');
        const dateKey = findKey('DATA', 'DIA');

        if (codeKey && qtyKey && options.syncMovements) {
          for (const row of rawRows) {
            const rawCode = formatCodeValue(row[codeKey]);
            const qty = parseNumeric(row[qtyKey], 0);
            if (!rawCode || qty <= 0 || isFormulaError(rawCode)) continue;

            let mat = dbService.getMaterialByCode(rawCode);
            if (!mat) {
              const rawName = nameKey ? String(row[nameKey] || '').trim() : `Material ${rawCode}`;
              const resMat = dbService.createMaterial(
                {
                  code: rawCode,
                  ikkiCode: rawCode,
                  name: rawName || `Material ${rawCode}`,
                  description: `Material registrado via movimentação na aba LANÇAMENTO DE CONSUMO (${file.name})`,
                  category: 'EPI',
                  unit: 'UN',
                  currentStock: 0,
                  minStock: 10,
                  location: 'Almoxarifado Central',
                  shelf: 'Corredor 1, Prat. 1, Nív. 1',
                  isEpi: false,
                  status: 'ativo',
                },
                user
              );
              mat = resMat.material;
            }

            if (mat) {
              const reqNum = reqKey ? String(row[reqKey] || '').trim() : undefined;
              const workerName = workerKey ? String(row[workerKey] || '').trim() : undefined;
              const matricula = matKey ? String(row[matKey] || '').trim() : undefined;
              const regionName = regionKey ? String(row[regionKey] || '').trim() : undefined;
              const movDate = dateKey ? parseExcelDate(row[dateKey]) : undefined;

              dbService.registerStockMovement({
                materialId: mat.id,
                type: 'SAIDA_CONSUMO',
                quantity: qty,
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                location: mat.location,
                employeeName: workerName,
                employeeMatricula: matricula,
                regionName,
                requisitionNumber: reqNum,
                date: movDate ? new Date(movDate).toISOString() : undefined,
                observation: `Consumo importado da aba LANÇAMENTO DE CONSUMO da planilha ${file.name}.`,
                idempotencyKey: `excel_cons_${rawCode}_${qty}_${reqNum || ''}_${matricula || ''}_${movDate || ''}`,
              });
              movementsSynced++;
            }
          }
          continue;
        }
      }

      // 6. Process EMPLOYEES & REGIONS
      const matKey = findKey('MATRICULA', 'MAT', 'RE', 'REGISTRO', 'IDENTIFICACAO');
      const empNameKey = findKey('NOME', 'FUNCIONARIO', 'COLABORADOR', 'NOME_FUNCIONARIO');

      if (matKey && empNameKey && options.importNewEmployees) {
        const regionKey = findKey('REGIAO_OPERACIONAL', 'REGIAO', 'REGIONAL', 'POLO', 'BASE', 'LOCALIDADE');
        const sectorKey = findKey('SETOR', 'DEPARTAMENTO', 'EQUIPE', 'TURNO');
        const roleKey = findKey('CARGO', 'FUNCAO', 'OCUPACAO');
        const shoeKey = findKey('TAM_BOTA', 'BOTA', 'CALCADO', 'NUM_BOTA');
        const gloveKey = findKey('TAM_LUVA', 'LUVA');
        const uniformKey = findKey('TAM_UNIFORME', 'UNIFORME');

        for (const row of rawRows) {
          const rawMat = String(row[matKey] || '').trim();
          const rawEmpName = String(row[empNameKey] || '').trim();
          if (!rawMat || !rawEmpName || isFormulaError(rawMat)) continue;

          let regionName = regionKey ? String(row[regionKey] || '').trim() : '';
          let regionId: string | undefined = undefined;

          if (regionName) {
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
      details: `Importação oficial concluída com sucesso. ${materialsProcessed} materiais com código IKKI preservados, ${employeesProcessed} colaboradores conferidos, ${movementsSynced} movimentações registradas, ${conflictsResolved} conciliações aplicadas. Backup salvo (${backupKey}).`,
    };

    dbService.addExcelSyncLog(syncLog);

    return {
      success: true,
      message: `Planilha oficial "${file.name}" importada com sucesso! ${materialsProcessed} itens IKKI e ${employeesProcessed} colaboradores conferidos sem duplicidades.`,
      log: syncLog,
    };
  },

  /**
   * Generates the official multi-sheet workbook matching the company's real spreadsheet CONSUMO MATERIAL CPLU.xlsx
   */
  exportToWorkbook(): XLSX.WorkBook {
    const materials = dbService.getMaterials();
    const employees = dbService.getEmployees();
    const movements = dbService.getMovements();
    const regions = dbService.getRegions();
    const requisitions = dbService.getRequisitions();

    const wb = XLSX.utils.book_new();

    // 1. ABA OFICIAL: LIST. COD. IKKI
    const ikkiData = materials.map((m) => ({
      CODIGO_IKKI: m.code, // Preserved exact string
      DESCRICAO: m.name,
      UNIDADE: m.unit,
      CATEGORIA: m.category,
      SALDO_ATUAL: m.currentStock,
      ESTOQUE_MINIMO: m.minStock,
      LOCALIZACAO_FISICA: dbService.formatPhysicalLocationsSummary(m),
      SITUACAO: m.status.toUpperCase(),
      NUMERO_CA: m.caNumber || '',
      FORNECEDOR: m.supplier || '',
    }));
    const wsIkki = XLSX.utils.json_to_sheet(ikkiData);
    XLSX.utils.book_append_sheet(wb, wsIkki, 'LIST. COD. IKKI');

    // 2. ABA OFICIAL: LANÇAMENTO DE CONSUMO
    const exitMovements = movements.filter((m) => m.type.startsWith('SAIDA_'));
    const consumoData = exitMovements.map((m) => ({
      DATA: m.date ? new Date(m.date).toLocaleDateString('pt-BR') : '',
      HORA: m.date ? new Date(m.date).toLocaleTimeString('pt-BR') : '',
      NUMERO_REQUISICAO: m.requisitionNumber || 'RETIRADA-DIRETA',
      COD_IKKI: m.materialCode,
      DESCRICAO_MATERIAL: m.materialName,
      QUANTIDADE: m.quantity,
      COLABORADOR_DESTINATARIO: m.employeeName || 'Equipe Operacional',
      MATRICULA: m.employeeMatricula || '',
      REGIAO_OPERACIONAL: m.regionName || 'Paulista',
      ALMOXARIFE_RESPONSAVEL: m.userName,
      JUSTIFICATIVA_OBS: m.justification || m.observation || '',
    }));
    const wsConsumo = XLSX.utils.json_to_sheet(
      consumoData.length > 0
        ? consumoData
        : [
            {
              DATA: '12/03/2026',
              HORA: '14:20:00',
              NUMERO_REQUISICAO: 'REQ-2026-0001',
              COD_IKKI: '001420',
              DESCRICAO_MATERIAL: 'Luva de Vaqueta Mista Reforçada',
              QUANTIDADE: 2,
              COLABORADOR_DESTINATARIO: 'Raimundo Nonato da Silva',
              MATRICULA: 'LU-10452',
              REGIAO_OPERACIONAL: 'Paulista',
              ALMOXARIFE_RESPONSAVEL: 'Marcos Vinícius Dias',
              JUSTIFICATIVA_OBS: 'Atendimento de requisição NR-6',
            },
          ]
    );
    XLSX.utils.book_append_sheet(wb, wsConsumo, 'LANÇAMENTO DE CONSUMO');

    // 3. ABA OFICIAL: ENTRADAS
    const entryMovements = movements.filter((m) => m.type.startsWith('ENTRADA_'));
    const entradasData = entryMovements.map((m) => ({
      DATA_RECEBIMENTO: m.receivedDate || (m.date ? new Date(m.date).toLocaleDateString('pt-BR') : ''),
      COD_IKKI: m.materialCode,
      DESCRICAO_MATERIAL: m.materialName,
      QUANTIDADE: m.quantity,
      SALDO_ANTERIOR: m.previousStock,
      NOVO_SALDO: m.newStock,
      FORNECEDOR_EMPRESA: m.supplier || 'Couros & Cia EPIs',
      NOTA_FISCAL: m.invoiceNumber || 'NF-44921',
      LOCAL_ARMAZENADO: m.targetLocation || m.location || 'Corredor 1, Prat. 3, Nív. 2',
      RESPONSAVEL_CONFERENCIA: m.userName,
      OBSERVACOES: m.observation || '',
    }));
    const wsEntradas = XLSX.utils.json_to_sheet(
      entradasData.length > 0
        ? entradasData
        : [
            {
              DATA_RECEBIMENTO: '01/03/2026',
              COD_IKKI: '001420',
              DESCRICAO_MATERIAL: 'Luva de Vaqueta Mista Reforçada',
              QUANTIDADE: 100,
              SALDO_ANTERIOR: 22,
              NOVO_SALDO: 122,
              FORNECEDOR_EMPRESA: 'Couros & Cia EPIs',
              NOTA_FISCAL: 'NF-44921',
              LOCAL_ARMAZENADO: 'Corredor 1, Prateleira 3, Nível 2',
              RESPONSAVEL_CONFERENCIA: 'Marcos Vinícius Dias',
              OBSERVACOES: 'Recebimento de lote conforme NF-e 44921',
            },
          ]
    );
    XLSX.utils.book_append_sheet(wb, wsEntradas, 'ENTRADAS');

    // 4. ABA OFICIAL: SALDO AGOSTO
    const saldoData = materials.map((m) => ({
      CODIGO_IKKI: m.code,
      DESCRICAO: m.name,
      UNIDADE: m.unit,
      SALDO_CONCILIADO: m.currentStock,
      ESTOQUE_MINIMO: m.minStock,
      SITUACAO_ESTOQUE: m.currentStock <= m.minStock ? 'CRITICO' : 'REGULAR',
      LOCALIZACAO_PRIMARIA: m.shelf || 'Corredor 1',
    }));
    const wsSaldo = XLSX.utils.json_to_sheet(saldoData);
    XLSX.utils.book_append_sheet(wb, wsSaldo, 'SALDO AGOSTO');

    // 5. ABA OFICIAL: CONSOLIDADADO
    const consolidadoData: any[] = [];
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
        consolidadoData.push({
          REGIAO: rg.name,
          CODIGO_IKKI: p.code,
          PRODUTO: p.name,
          TOTAL_UNIDADES_CONSUMIDAS: p.qty,
          PERIODO_CONCILIADO: 'Ano 2026',
        });
      });
    });

    const wsConsolidado = XLSX.utils.json_to_sheet(
      consolidadoData.length > 0
        ? consolidadoData
        : [{ REGIAO: 'Paulista', CODIGO_IKKI: '001420', PRODUTO: 'Luva de Vaqueta Mista', TOTAL_UNIDADES_CONSUMIDAS: 2 }]
    );
    XLSX.utils.book_append_sheet(wb, wsConsolidado, 'CONSOLIDADADO');

    // 6. ABA OFICIAL: EPI
    const epiData = materials
      .filter((m) => m.isEpi || m.category === 'EPI')
      .map((m) => ({
        CODIGO_IKKI: m.code,
        EQUIPAMENTO_EPI: m.name,
        NUMERO_CA: m.caNumber || 'Consulte TST',
        VALIDADE_MESES: m.validityMonths || 6,
        SALDO_DISPONIVEL: m.currentStock,
        UNIDADE: m.unit,
        CORREDOR_PRATELEIRA: dbService.formatPhysicalLocationsSummary(m),
        FORNECEDOR_HOMOLOGADO: m.supplier || '',
      }));
    const wsEpi = XLSX.utils.json_to_sheet(epiData);
    XLSX.utils.book_append_sheet(wb, wsEpi, 'EPI');

    // Supplementary sheet: Funcionários e Regiões
    const wsEmployees = XLSX.utils.json_to_sheet(
      employees.map((e) => ({
        MATRICULA: e.matricula,
        NOME: e.name,
        REGIAO_OPERACIONAL: e.regionName || 'Paulista',
        SETOR: e.sector,
        CARGO: e.role,
        SITUACAO: e.status.toUpperCase(),
        TAM_BOTA: e.shoeSize || '',
        TAM_LUVA: e.gloveSize || '',
        TAM_UNIFORME: e.uniformSize || '',
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'Funcionarios');

    return wb;
  },

  /**
   * Writes the updated database state directly back to the connected local file handle
   */
  async writeToLocalExcelFile(
    handle: FileSystemFileHandle,
    user?: { id: string; name: string; role: UserRole }
  ): Promise<{ success: boolean; message: string; log?: ExcelSyncLog }> {
    try {
      // 1. Create backup snapshot
      const backupSnapshot = {
        timestamp: new Date().toISOString(),
        materials: dbService.getMaterials(),
        employees: dbService.getEmployees(),
        movements: dbService.getMovements(),
      };
      const backupKey = `cplu_pre_write_${Date.now()}`;
      try {
        localStorage.setItem(backupKey, JSON.stringify(backupSnapshot));
      } catch (e) {
        console.warn('Backup warning:', e);
      }

      // 2. Export updated workbook
      const wb = this.exportToWorkbook();
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // 3. Request write access and write to file
      // @ts-ignore
      const writable = await handle.createWritable();
      await writable.write(excelBuffer);
      await writable.close();

      const file = await handle.getFile();

      const log: ExcelSyncLog = {
        id: 'log-write-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: user?.id || 'usr-system',
        userName: user?.name || 'Sistema CPL Log',
        fileName: file.name,
        action: 'EXPORT_SYNC',
        sheetsDetected: ['LIST. COD. IKKI', 'LANÇAMENTO DE CONSUMO', 'ENTRADAS', 'SALDO AGOSTO', 'CONSOLIDADADO', 'EPI'],
        materialsProcessed: dbService.getMaterials().length,
        employeesProcessed: dbService.getEmployees().length,
        movementsSynced: dbService.getMovements().length,
        conflictsResolved: 0,
        status: 'SUCESSO',
        details: `Gravação direta autorizada no arquivo local "${file.name}" executada com sucesso. Cópia de segurança criada (${backupKey}).`,
      };

      dbService.addExcelSyncLog(log);

      return {
        success: true,
        message: `Planilha oficial "${file.name}" atualizada com sucesso no disco rígido com todas as movimentações e saldos conciliados!`,
        log,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erro ao gravar diretamente no arquivo local: ' + (err.message || 'Permissão negada ou arquivo em uso por outro programa.'),
      };
    }
  },

  /**
   * Downloads the complete synchronized workbook named CONSUMO MATERIAL CPLU.xlsx
   */
  downloadSynchronizedExcel(filename = 'CONSUMO MATERIAL CPLU.xlsx') {
    const wb = this.exportToWorkbook();
    XLSX.writeFile(wb, filename);
  },

  /**
   * Generates and downloads the official standard company workbook
   */
  downloadStandardTemplate() {
    this.downloadSynchronizedExcel('CONSUMO MATERIAL CPLU.xlsx');
  },
};
