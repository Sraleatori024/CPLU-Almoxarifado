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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
        {/* Modal Toolbar (hidden on print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm">Comprovante de Entrega de EPI (NR-6)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Body */}
        <div className="p-8 text-slate-800 bg-white" id="printable-receipt-area">
          {/* Header */}
          <div className="border-b-2 border-orange-600 pb-4 mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white font-extrabold text-sm px-2 py-0.5 rounded">
                  CPLU
                </span>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  SISTEMA DE GESTÃO DE ALMOXARIFADO
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1 uppercase font-medium tracking-wider">
                Operação de Limpeza Urbana • Departamento de Segurança e Saúde Ocupacional
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-300">
                {delivery.requisitionNumber}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Data/Hora: {formatDateTimeBR(delivery.date)}
              </p>
            </div>
          </div>

          <h2 className="text-center font-bold text-base text-slate-900 uppercase tracking-wide mb-4">
            TERMO DE RESPONSABILIDADE E ENTREGA DE EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL (EPI)
          </h2>

          {/* Worker Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block">Colaborador(a):</span>
              <span className="text-slate-900 font-bold text-sm">{delivery.employeeName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Matrícula Funcional:</span>
              <span className="text-slate-900 font-bold font-mono text-sm">{delivery.employeeMatricula}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Setor / Frente Operacional:</span>
              <span className="text-slate-800 font-medium">{delivery.sector}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Almoxarife Responsável:</span>
              <span className="text-slate-800 font-medium">{delivery.deliveredByName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Itens e Equipamentos Entregues
            </h4>
            <table className="w-full text-left text-xs border border-slate-300 rounded overflow-hidden">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Descrição do Material / EPI</th>
                  <th className="py-2 px-3 text-center">Nº CA (MTE)</th>
                  <th className="py-2 px-3 text-center">Qtd.</th>
                  <th className="py-2 px-3 text-center">Unid.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {delivery.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-medium">{item.materialCode}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{item.materialName}</td>
                    <td className="py-2 px-3 text-center font-mono">
                      {item.caNumber ? (
                        <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200">
                          {item.caNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal Compliance Statement (NR-6) */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 text-[11px] leading-relaxed text-slate-600 mb-6 text-justify">
            <p className="font-semibold text-slate-800 mb-1">
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
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
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
                    className="max-h-14 object-contain"
                  />
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center text-[10px] italic text-slate-400">
                  [Assinatura eletrônica autenticada]
                </div>
              )}
              <div className="w-full border-b border-slate-400 pb-1 mb-1 text-xs font-bold text-slate-900">
                {delivery.employeeName}
              </div>
              <span className="text-[10px] text-slate-500 uppercase">
                Colaborador Recebedor (Matrícula: {delivery.employeeMatricula})
              </span>
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Doc ID: {delivery.id}</span>
            <span>Autenticação Digital CPLU • Conforme Portaria 3.214/78 do MTE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
