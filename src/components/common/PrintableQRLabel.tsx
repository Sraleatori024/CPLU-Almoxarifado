import React from 'react';
import { X, Printer, QrCode } from 'lucide-react';

interface PrintableQRLabelProps {
  title: string;
  code: string;
  subtext: string;
  qrDataUrl: string;
  onClose: () => void;
}

export const PrintableQRLabel: React.FC<PrintableQRLabelProps> = ({
  title,
  code,
  subtext,
  qrDataUrl,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm">Etiqueta com QR Code</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Printer className="w-4 h-4" />
              Imprimir Etiqueta
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Label Layout */}
        <div className="p-8 flex flex-col items-center justify-center bg-white" id="printable-label-card">
          <div className="border-4 border-slate-900 rounded-2xl p-6 text-center max-w-xs w-full bg-white shadow-md">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="bg-orange-600 text-white text-[11px] font-black px-1.5 py-0.5 rounded">
                CPLU
              </span>
              <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
                Almoxarifado
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl inline-block border border-slate-200 shadow-inner mb-3">
              <img
                src={qrDataUrl}
                alt={`QR Code ${code}`}
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>

            <h4 className="font-mono text-xl font-black text-slate-900 tracking-wider">
              {code}
            </h4>
            <p className="font-semibold text-xs text-slate-800 mt-1 line-clamp-2">
              {title}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {subtext}
            </p>

            <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-400 uppercase tracking-widest">
              Identificação Oficial CPLU • Escaneie no App
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
