import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  employeeName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, employeeName }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // dark slate
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (hasSignature && canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onClear) onClear();
  };

  return (
    <div className="border border-slate-300 rounded-lg bg-slate-50 p-3 shadow-inner">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <PenTool className="w-4 h-4 text-orange-600" />
          <span>Assinatura Digital do Colaborador {employeeName ? `(${employeeName})` : ''}</span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-rose-600 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>

      <div className="relative w-full h-36 bg-white border border-dashed border-slate-300 rounded-md overflow-hidden cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs italic">
            Assine aqui usando o dedo ou mouse
          </div>
        )}
        <div className="absolute bottom-2 left-4 right-4 border-b border-slate-200 pointer-events-none" />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
        <span>Conforme Portaria MTE e diretrizes da NR-6 para entrega eletrônica de EPI</span>
        {hasSignature && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Assinatura capturada
          </span>
        )}
      </div>
    </div>
  );
};
