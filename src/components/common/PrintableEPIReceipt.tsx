import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { EPIDelivery } from '../../types';
import { formatDateTimeBR } from '../../utils/formatters';

interface PrintableEPIReceiptProps {
  delivery: EPIDelivery | null;
  onClose: () => void;
}

export const PrintableEPIReceipt: React.FC<PrintableEPIReceiptProps> = ({ delivery, onClose }) => {
  if (!delivery) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Modal Toolbar (hidden on print, sticky on screen) */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between gap-2 shrink-0 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm truncate">Termo de Entrega EPI (NR-6)</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition shrink-0"
              title="Imprimir ou Salvar PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden xs:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center shrink-0"
              aria-label="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Body */}
        <div className="p-4 sm:p-6 md:p-8 text-slate-800 bg-white overflow-y-auto space-y-4" id="printable-receipt-area">
          {/* Header */}
          <div className="border-b-2 border-orange-600 pb-3 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white font-extrabold text-xs sm:text-sm px-2 py-0.5 rounded">
                  CPLU
                </span>
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  SISTEMA DE GESTÃO DE ALMOXARIFADO
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 mt-1 uppercase font-medium tracking-wider">
                Operação de Limpeza Urbana • Segurança e Saúde Ocupacional
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300 inline-block">
                {delivery.requisitionNumber}
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                Data: {formatDateTimeBR(delivery.date)}
              </p>
            </div>
          </div>

          <h2 className="text-center font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
            TERMO DE RESPONSABILIDADE E ENTREGA DE EPI (NR-6)
          </h2>

          {/* Worker Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] sm:text-[11px]">Colaborador(a):</span>
              <span className="text-slate-900 font-bold text-xs sm:text-sm">{delivery.employeeName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] sm:text-[11px]">Matrícula Funcional:</span>
              <span className="text-slate-900 font-bold font-mono text-xs sm:text-sm">{delivery.employeeMatricula}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] sm:text-[11px]">Setor / Frente Operacional:</span>
              <span className="text-slate-800 font-medium">{delivery.sector}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] sm:text-[11px]">Almoxarife Responsável:</span>
              <span className="text-slate-800 font-medium">{delivery.deliveredByName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Itens e Equipamentos Entregues
            </h4>
            <div className="overflow-x-auto w-full border border-slate-300 rounded-xl">
              <table className="w-full text-left text-xs min-w-[420px]">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-semibold text-[10px] sm:text-xs">
                  <tr>
                    <th className="py-2 px-2.5">Código</th>
                    <th className="py-2 px-2.5">Descrição do EPI</th>
                    <th className="py-2 px-2.5 text-center">Nº CA</th>
                    <th className="py-2 px-2.5 text-center">Qtd.</th>
                    <th className="py-2 px-2.5 text-center">Unid.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {delivery.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono font-bold text-orange-700">{item.materialCode}</td>
                      <td className="py-2 px-2.5 font-semibold text-slate-900">{item.materialName}</td>
                      <td className="py-2 px-2.5 text-center font-mono">
                        {item.caNumber ? (
                          <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 text-[10px]">
                            {item.caNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-2 px-2.5 text-center text-slate-600">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Compliance Statement (NR-6) */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 text-[10px] sm:text-[11px] leading-relaxed text-slate-600 text-justify">
            <p className="font-semibold text-slate-800 mb-0.5">
              Declaração de Recebimento e Compromisso de Uso (Norma Regulamentadora NR-6 / CLT):
            </p>
            Declaro ter recebido da Companhia Pública de Limpeza Urbana os Equipamentos de Proteção Individual (EPIs)
            acima descritos, novos e em perfeito estado de conservação e funcionamento. Comprometo-me a utilizá-los
            estritamente no exercício das minhas funções operacionais, zelar pela sua guarda e conservação, comunicar
            imediatamente qualquer alteração que os torne impróprios para uso, e devolvê-los ao almoxarifado quando da
            sua substituição ou rescisão contratual, ciente de que o não uso constitui ato faltoso passível de sanções
            disciplinares previstas em lei.
          </div>

          {/* Signatures Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-3 border-t border-slate-200">
            <div className="flex flex-col items-center justify-end text-center">
              <div className="w-full border-b border-slate-400 pb-1 mb-1 text-xs font-semibold text-slate-800">
                {delivery.deliveredByName}
              </div>
              <span className="text-[10px] text-slate-500 uppercase">
                Almoxarife Responsável pela Entrega
              </span>
            </div>

            <div className="flex flex-col items-center justify-end text-center">
              {delivery.signatureDataUrl ? (
                <div className="mb-1 max-h-16 flex items-center justify-center">
                  <img
                    src={delivery.signatureDataUrl}
                    alt="Assinatura Eletrônica"
                    className="max-h-12 object-contain"
                  />
                </div>
              ) : (
                <div className="h-10 flex items-center justify-center text-[10px] italic text-slate-400">
                  [Assinatura eletrônica autenticada]
                </div>
              )}
              <div className="w-full border-b border-slate-400 pb-1 mb-1 text-xs font-bold text-slate-900">
                {delivery.employeeName}
              </div>
              <span className="text-[10px] text-slate-500 uppercase">
                Colaborador (Mat: {delivery.employeeMatricula})
              </span>
            </div>
          </div>

          {/* Document Footer */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[9px] sm:text-[10px] text-slate-400 font-mono">
            <span>Doc ID: {delivery.id}</span>
            <span>Autenticação Digital CPLU • Portaria 3.214/78 MTE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
