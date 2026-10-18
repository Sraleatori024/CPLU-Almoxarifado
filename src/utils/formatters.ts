// Brazilian formatting helpers for CPLU Almoxarifado

export function formatDateBR(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTimeBR(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatNumberBR(val: number): string {
  return new Intl.NumberFormat('pt-BR').format(val);
}

export function getMovementTypeLabel(type: string): { label: string; isEntry: boolean; color: string } {
  switch (type) {
    case 'ENTRADA_COMPRA':
      return { label: 'Entrada por Compra (NF-e)', isEntry: true, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'ENTRADA_RECEBIMENTO':
      return { label: 'Entrada por Recebimento', isEntry: true, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'ENTRADA_DEVOLUCAO':
      return { label: 'Entrada por Devolução', isEntry: true, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'ENTRADA_AJUSTE':
      return { label: 'Entrada por Ajuste Balanço', isEntry: true, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'SAIDA_REQUISICAO':
      return { label: 'Saída por Requisição / EPI', isEntry: false, color: 'text-orange-700 bg-orange-50 border-orange-200' };
    case 'SAIDA_CONSUMO':
      return { label: 'Saída por Consumo Operacional', isEntry: false, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'SAIDA_TRANSFERENCIA':
      return { label: 'Saída por Transferência', isEntry: false, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    case 'SAIDA_AJUSTE':
      return { label: 'Saída por Ajuste / Avaria', isEntry: false, color: 'text-rose-700 bg-rose-50 border-rose-200' };
    default:
      return { label: type, isEntry: false, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
}

export function getRequisitionStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'rascunho':
      return { label: 'Rascunho', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'enviada':
    case 'pendente':
      return { label: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'parcialmente_atendida':
      return { label: 'Parcialmente Atendida', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'atendida':
      return { label: 'Atendida', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'cancelada':
      return { label: 'Cancelada', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    case 'rejeitada':
      return { label: 'Rejeitada', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
}

export function getPriorityBadge(priority: string): { label: string; color: string } {
  switch (priority) {
    case 'critica':
      return { label: 'Crítica', color: 'bg-rose-600 text-white font-semibold' };
    case 'alta':
      return { label: 'Alta', color: 'bg-orange-500 text-white font-medium' };
    case 'normal':
      return { label: 'Normal', color: 'bg-slate-200 text-slate-800' };
    case 'baixa':
      return { label: 'Baixa', color: 'bg-slate-100 text-slate-600' };
    default:
      return { label: priority, color: 'bg-slate-100 text-slate-700' };
  }
}

export function exportToCSV(filename: string, rows: (string | number | boolean | null | undefined)[][]) {
  const processRow = (row: (string | number | boolean | null | undefined)[]) => {
    let finalVal = '';
    for (let j = 0; j < row.length; j++) {
      const val = row[j];
      let innerValue = val === null || val === undefined ? '' : String(val);
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n|;)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ';'; // Brazilian Excel standard separator
      finalVal += result;
    }
    return finalVal + '\r\n';
  };

  let csvFile = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
