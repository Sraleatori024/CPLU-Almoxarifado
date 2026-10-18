import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Plus,
  Printer,
  Camera,
  Search,
  MapPin,
  Boxes,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { dbService } from '../services/db';
import { ShelfLocation, Material } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateQRCodeDataUrl } from '../utils/qr';
import { PrintableQRLabel } from '../components/common/PrintableQRLabel';
import { NavigationTab } from '../components/layout/Sidebar';

interface QRCodesPageProps {
  onOpenQRScanner: () => void;
  onNavigate: (tab: NavigationTab, targetCode?: string) => void;
  targetInitialCode?: string;
}

export const QRCodesPage: React.FC<QRCodesPageProps> = ({
  onOpenQRScanner,
  onNavigate,
  targetInitialCode,
}) => {
  const { currentUser, role } = useAuth();
  const [shelves, setShelves] = useState<ShelfLocation[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState(targetInitialCode || '');

  // Quick lookup state
  const [scannedCode, setScannedCode] = useState(targetInitialCode || '');
  const [inspectedShelf, setInspectedShelf] = useState<ShelfLocation | null>(null);
  const [inspectedMaterial, setInspectedMaterial] = useState<Material | null>(null);

  // New Shelf Modal
  const [isNewShelfModalOpen, setIsNewShelfModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formZone, setFormZone] = useState('Galpão A');
  const [formAisle, setFormAisle] = useState('Corredor 1');
  const [formLevel, setFormLevel] = useState('Nível 1');
  const [formCapacity, setFormCapacity] = useState(100);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Printable QR Label
  const [qrLabelData, setQrLabelData] = useState<{
    title: string;
    code: string;
    subtext: string;
    qrUrl: string;
  } | null>(null);

  const loadData = () => {
    setShelves(dbService.getShelves());
    setMaterials(dbService.getMaterials());
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (targetInitialCode) {
      handleLookup(targetInitialCode);
    }
  }, [targetInitialCode]);

  const handleLookup = (code: string) => {
    const clean = code.trim().toUpperCase();
    setScannedCode(clean);

    const shelf = dbService.getShelfByCode(clean);
    const material = dbService.getMaterialByCode(clean);

    setInspectedShelf(shelf || null);
    setInspectedMaterial(material || null);
  };

  const handlePrintShelfQR = async (shelf: ShelfLocation) => {
    const payload = JSON.stringify({ type: 'shelf', code: shelf.code });
    const url = await generateQRCodeDataUrl(payload);
    setQrLabelData({
      title: `${shelf.zone} - ${shelf.aisle}`,
      code: shelf.code,
      subtext: shelf.description,
      qrUrl: url,
    });
  };

  const handleCreateShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    const res = dbService.createShelf(
      {
        code: formCode.trim().toUpperCase(),
        zone: formZone,
        aisle: formAisle,
        shelfLevel: formLevel,
        capacity: Number(formCapacity),
        description: formDescription.trim(),
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (!res.success) {
      setFormError(res.message);
    } else {
      setIsNewShelfModalOpen(false);
      setFormCode('');
      setFormDescription('');
    }
  };

  const filteredShelves = shelves.filter((s) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      s.code.toLowerCase().includes(q) ||
      s.zone.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-orange-600" />
            Rastreamento por QR Code & Localizações
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geração de etiquetas para prateleiras e materiais, leitor por câmera e busca rápida
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
          >
            <Camera className="w-4 h-4" />
            Escanear com Câmera
          </button>
          {(role === 'administrador' || role === 'almoxarife') && (
            <button
              onClick={() => setIsNewShelfModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              Nova Prateleira
            </button>
          )}
        </div>
      </div>

      {/* QUICK LOOKUP BOX */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white p-5 rounded-2xl border border-orange-200 shadow-xs">
        <h3 className="font-bold text-sm text-orange-950 mb-1 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-orange-600" />
          Consulta Rápida por Código ou Leitura de QR
        </h3>
        <p className="text-xs text-orange-800 mb-3">
          Ao escanear ou digitar o código de uma prateleira ou material, acesse diretamente o saldo e ações de movimentação.
        </p>

        <div className="flex gap-2 max-w-xl">
          <input
            type="text"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
            placeholder="Ex: PRAT-EPI-01 ou EPI-LUV-01"
            className="flex-1 px-3.5 py-2 text-xs font-mono font-bold uppercase bg-white border border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          />
          <button
            onClick={() => handleLookup(scannedCode)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Consultar
          </button>
        </div>

        {/* Display Inspection Card if found */}
        {(inspectedShelf || inspectedMaterial) && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-orange-300 shadow-sm animate-in fade-in duration-150">
            {inspectedShelf && (
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                      {inspectedShelf.code}
                    </span>
                    <span className="font-bold text-sm text-slate-800">
                      {inspectedShelf.zone} • {inspectedShelf.aisle} ({inspectedShelf.shelfLevel})
                    </span>
                  </div>
                  <button
                    onClick={() => handlePrintShelfQR(inspectedShelf)}
                    className="flex items-center gap-1 text-xs text-orange-600 font-bold hover:underline"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta
                  </button>
                </div>
                <p className="text-xs text-slate-600 mb-3">{inspectedShelf.description}</p>

                {/* Materials on this shelf */}
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Materiais Armazenados nesta Localização:
                </h4>
                {materials.filter((m) => m.shelf === inspectedShelf.code).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum material alocado nesta prateleira no momento.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {materials
                      .filter((m) => m.shelf === inspectedShelf.code)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-orange-700">{m.code}</span>
                            <div className="font-semibold text-slate-800">{m.name}</div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                            {m.currentStock} {m.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {inspectedMaterial && (
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {inspectedMaterial.code}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {inspectedMaterial.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('movements')}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
                    >
                      Registrar Movimentação
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500 block">Saldo Atual:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {inspectedMaterial.currentStock} {inspectedMaterial.unit}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500 block">Localização:</span>
                    <span className="font-bold text-slate-800">{inspectedMaterial.shelf}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500 block">Categoria:</span>
                    <span className="font-bold text-slate-800">{inspectedMaterial.category}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shelves List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Prateleiras & Posições Físicas do Galpão</h3>
            <p className="text-[11px] text-slate-500">
              Imprima etiquetas com QR Code para afixar nas baias e corredores do almoxarifado
            </p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar prateleiras..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código da Posição</th>
                <th className="py-3 px-4">Zona / Galpão</th>
                <th className="py-3 px-4">Corredor & Nível</th>
                <th className="py-3 px-4">Finalidade / Descrição</th>
                <th className="py-3 px-4 text-center">Itens Alocados</th>
                <th className="py-3 px-4 text-right">Etiqueta QR Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShelves.map((shelf) => {
                const allocated = materials.filter((m) => m.shelf === shelf.code);
                return (
                  <tr key={shelf.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-black text-orange-700 text-sm">
                      {shelf.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{shelf.zone}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {shelf.aisle} • {shelf.shelfLevel}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{shelf.description}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {allocated.length} item(ns)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handlePrintShelfQR(shelf)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition"
                      >
                        <QrCode className="w-3.5 h-3.5 text-orange-600" />
                        Imprimir Etiqueta
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CAMERA & HTTPS CONFIGURATION CARD (Transparency as requested by prompt) */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-1">
              Guia Técnico: Operação de Câmera, QR Code e HTTPS em Produção
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O leitor de QR Code utiliza a API nativa WebRTC (<code>navigator.mediaDevices.getUserMedia</code>) e processamento óptico em tempo real com <code>jsQR</code>. Em navegadores modernos e smartphones Android/iOS, o acesso à câmera exige <strong>obrigatoriamente uma conexão segura HTTPS</strong> ou execução em <code>localhost</code>.
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="font-semibold text-orange-400 block mb-1">Permissões de Câmera:</span>
                O usuário deve autorizar o acesso à câmera no prompt do navegador quando solicitado.
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="font-semibold text-orange-400 block mb-1">Alternativa de Digitação Manual:</span>
                Caso o dispositivo não possua câmera ou esteja em ambiente restrito, o campo de digitação manual acima aceita o código alfanumérico imediatamente.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL NOVA PRATELEIRA */}
      {isNewShelfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Cadastrar Nova Prateleira</h3>
              <button
                onClick={() => setIsNewShelfModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShelf} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código da Prateleira *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PRAT-FER-03"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Zona / Galpão</label>
                  <input
                    type="text"
                    value={formZone}
                    onChange={(e) => setFormZone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corredor</label>
                  <input
                    type="text"
                    value={formAisle}
                    onChange={(e) => setFormAisle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Identificação do tipo de material abrigado..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewShelfModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Salvar Prateleira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR LABEL MODAL */}
      {qrLabelData && (
        <PrintableQRLabel
          title={qrLabelData.title}
          code={qrLabelData.code}
          subtext={qrLabelData.subtext}
          qrDataUrl={qrLabelData.qrUrl}
          onClose={() => setQrLabelData(null)}
        />
      )}
    </div>
  );
};
