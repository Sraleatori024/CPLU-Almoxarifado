import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Search, ShieldCheck } from 'lucide-react';
import jsQR from 'jsqr';
import { parseQRCodeText, DecodedQRTarget } from '../../utils/qr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (target: DecodedQRTarget) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('Acesso à câmera não é suportado pelo navegador ou requer conexão HTTPS.');
      setIsScanning(false);
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestScan();
      }
    } catch (err: unknown) {
      console.warn('Camera access issue:', err);
      setHasCamera(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('Permission denied') || errMsg.includes('NotAllowedError')) {
        setCameraError('Permissão de câmera negada. Você pode digitar o código manualmente abaixo.');
      } else {
        setCameraError('Não foi possível iniciar a câmera neste ambiente. Utilize a busca manual abaixo.');
      }
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const requestScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(requestScan);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const parsed = parseQRCodeText(code.data);
      stopCamera();
      onScanSuccess(parsed);
      onClose();
      return;
    }

    animationFrameId.current = requestAnimationFrame(requestScan);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const parsed = parseQRCodeText(manualCode.trim());
    stopCamera();
    onScanSuccess(parsed);
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Scanner de QR Code & Código</h3>
              <p className="text-xs text-orange-100">Prateleiras, Materiais e EPIs</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport / Fallback */}
        <div className="relative bg-slate-900 aspect-square max-h-72 w-full flex items-center justify-center overflow-hidden">
          {hasCamera && !cameraError ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Aiming Reticle */}
              <div className="absolute inset-8 border-2 border-orange-400 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-orange-400/80 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" />
              </div>

              {/* Camera Switcher Button */}
              <button
                type="button"
                onClick={toggleCamera}
                className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition"
                title="Alternar Câmera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="p-6 text-center text-slate-300 flex flex-col items-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-sm font-medium text-white mb-1">Câmera Indisponível</p>
              <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual Code Input Form */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Digite o Código da Prateleira ou Material:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: PRAT-EPI-01 ou EPI-LUV-01"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-white"
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </div>
          </form>

          {/* Quick presets for testing */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
              Códigos de teste rápido:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['PRAT-EPI-01', 'PRAT-FER-01', 'EPI-LUV-01', 'EPI-BOT-02', 'FER-VAS-01'].map(
                (code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      const parsed = parseQRCodeText(code);
                      stopCamera();
                      onScanSuccess(parsed);
                      onClose();
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 bg-white border border-slate-300 hover:border-orange-500 hover:text-orange-600 rounded text-slate-700 transition"
                  >
                    {code}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Permissões validadas no momento da leitura conforme perfil ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
