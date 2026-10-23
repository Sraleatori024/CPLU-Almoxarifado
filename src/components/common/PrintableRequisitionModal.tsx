import React from 'react';
import { X, Printer, FileText, CheckCircle, ShieldCheck, MapPin, Tag } from 'lucide-react';
import { Requisition, Material } from '../../types';
import { formatDateTimeBR, getPriorityBadge } from '../../utils/formatters';
import { dbService } from '../../services/db';

interface PrintableRequisitionModalProps {
  requisition: Requisition | null;
  onClose: () => void;
}

export const PrintableRequisitionModal: React.FC<PrintableRequisitionModalProps> = ({
  requisition,
  onClose,
}) => {
  if (!requisition) return null;

  const handlePrint = () => {
    window.print();
  };

  const materials = dbService.getMaterials();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between gap-2 shrink-0 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-orange-400 shrink-0" />
            <div className="truncate">
              <h3 className="font-bold text-xs sm:text-sm truncate">
                Requisição Oficial: {requisition.number}
              </h3>
              <p className="text-[11px] text-slate-400">
                Região: <span className="text-orange-300 font-semibold">{requisition.regionName}</span>
                {requisition.stampedNumber && (
                  <span className="ml-2 font-mono bg-orange-600/50 px-1.5 py-0.2 rounded text-[10px] text-white">
                    Carimbo: {requisition.stampedNumber}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
              title="Imprimir ou Salvar PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center cursor-pointer"
              aria-label="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-6 sm:p-8 text-slate-800 bg-white overflow-y-auto space-y-5" id="printable-requisition-area">
          {/* Header */}
          <div className="border-b-2 border-orange-600 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white font-black text-xs sm:text-sm px-2 py-0.5 rounded">
                  CPLU
                </span>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  SISTEMA DE GESTÃO DE ALMOXARIFADO
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 mt-1 uppercase font-semibold tracking-wider">
                Controle Operacional de Materiais • Limpeza Urbana
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-900 px-2.5 py-1 rounded border border-slate-300 inline-block">
                {requisition.number}
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                Emissão: {formatDateTimeBR(requisition.createdAt)}
              </p>
            </div>
          </div>

          {/* Title and Identification */}
          <div className="text-center">
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
              REQUISIÇÃO OFICIAL DE MATERIAIS / EPIs
            </h2>
            <p className="text-[11px] text-slate-500">
              Documento físico do fluxo de separação e atendimento do almoxarifado
            </p>
          </div>

          {/* Stamped Number Highlight Box & Operational Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box Carimbo Oficial */}
            <div className={`p-3 rounded-xl border-2 ${requisition.stampedNumber ? 'border-orange-500 bg-orange-50/50' : 'border-dashed border-slate-300 bg-slate-50'} text-center flex flex-col items-center justify-center min-h-[75px]`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Carimbo Oficial do Almoxarifado
              </span>
              {requisition.stampedNumber ? (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span className="text-lg sm:text-xl font-mono font-black text-orange-700 tracking-wider">
                    {requisition.stampedNumber}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-mono font-semibold text-slate-400">
                  [ AGUARDANDO NÚMERO CARIMBADO NO PAPEL ]
                </span>
              )}
              {requisition.stampedBy && (
                <span className="text-[9px] text-slate-500 mt-1">
                  Carimbado por {requisition.stampedBy} em {formatDateTimeBR(requisition.stampedAt || '')}
                </span>
              )}
            </div>

            {/* Box Região Solicitante */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-center text-xs">
              <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Região Solicitante (Consumo):</span>
              </div>
              <span className="text-base font-extrabold text-slate-900">
                {requisition.regionName}
              </span>
              <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
                <span>TST Responsável: <strong className="text-slate-800">{requisition.requestedByName}</strong></span>
                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  Prioridade: {requisition.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Justification & Observations */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
            <div>
              <span className="font-bold text-slate-600">Justificativa Operacional do TST:</span>{' '}
              <span className="text-slate-800">{requisition.justification}</span>
            </div>
            {requisition.observations && (
              <div>
                <span className="font-bold text-slate-600">Observações:</span>{' '}
                <span className="text-slate-700">{requisition.observations}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Itens Solicitados para Separação
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                    <th className="py-2 px-2.5">Cód. Oficial IKKI</th>
                    <th className="py-2 px-2.5">Descrição do Material</th>
                    <th className="py-2 px-2.5 text-center">Und</th>
                    <th className="py-2 px-2.5">Localização Física</th>
                    <th className="py-2 px-2.5 text-right">Qtd Solicitada</th>
                    <th className="py-2 px-2.5 text-right">Qtd Atendida</th>
                    <th className="py-2 px-2.5 text-center">Conferência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {requisition.items.map((item, idx) => {
                    const mat = materials.find((m) => m.id === item.materialId || m.code === item.materialCode);
                    const loc = mat?.shelf || mat?.location || 'Almoxarifado Central';
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900">
                          {item.materialCode}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="font-bold text-slate-900 block">{item.materialName}</span>
                          {item.caNumber && (
                            <span className="text-[10px] text-slate-500 font-medium">CA: {item.caNumber}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-semibold text-slate-600">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-2.5 text-[11px] text-slate-600 font-medium">
                          {loc}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-black text-slate-900">
                          {item.quantityRequested}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-bold text-slate-700">
                          {item.quantityDelivered}
                        </td>
                        <td className="py-2.5 px-2.5 text-center text-slate-400 font-mono text-[10px]">
                          [ &nbsp; &nbsp; &nbsp; &nbsp; ]
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures & Verification Area */}
          <div className="pt-4 mt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <span className="font-bold text-slate-900 block">{requisition.requestedByName}</span>
              <span className="text-[10px] text-slate-500">Técnico de Segurança Solicitante (TST)</span>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <span className="font-bold text-slate-900 block">Almoxarifado Central / Separação</span>
              <span className="text-[10px] text-slate-500">Visto do Almoxarife e Data</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-2 text-[9px] text-slate-400 text-center uppercase tracking-wider">
            CPLU Almoxarifado • Documento de controle interno impresso em {formatDateTimeBR(new Date().toISOString())}
          </div>
        </div>
      </div>
    </div>
  );
};
