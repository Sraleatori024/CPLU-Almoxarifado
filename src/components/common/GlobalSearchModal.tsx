import React, { useState, useEffect } from 'react';
import { Search, X, Boxes, Truck, Wrench, ClipboardList, QrCode, ArrowRight } from 'lucide-react';
import { dbService } from '../../services/db';
import { Material, Requisition, ShelfLocation, Vehicle, ServiceOrder } from '../../types';
import { NavigationTab } from '../layout/Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab, targetCode?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [shelves, setShelves] = useState<ShelfLocation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    if (isOpen) {
      setMaterials(dbService.getMaterials());
      setRequisitions(dbService.getRequisitions());
      setShelves(dbService.getShelves());
      setVehicles(dbService.getVehicles());
      setOrders(dbService.getServiceOrders());
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredMaterials = q
    ? materials.filter(
        (m) =>
          m.code.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
    : [];

  const filteredVehicles = q
    ? vehicles.filter(
        (v) =>
          v.fleetNumber.toLowerCase().includes(q) ||
          v.plate.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.subRegion.toLowerCase().includes(q)
      )
    : [];

  const filteredOrders = q
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.fleetNumber.toLowerCase().includes(q) ||
          o.plate.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q)
      )
    : [];

  const filteredRequisitions = q
    ? requisitions.filter(
        (r) =>
          r.number.toLowerCase().includes(q) ||
          (r.stampedNumber && r.stampedNumber.toLowerCase().includes(q)) ||
          r.regionName.toLowerCase().includes(q) ||
          r.justification.toLowerCase().includes(q)
      )
    : [];

  const filteredShelves = q
    ? shelves.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    filteredMaterials.length +
    filteredVehicles.length +
    filteredOrders.length +
    filteredRequisitions.length +
    filteredShelves.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-orange-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite prefixo (COMP-01), código IKKI, OS, requisição..."
            className="flex-1 text-sm bg-transparent border-none focus:outline-hidden text-slate-800 placeholder-slate-400 font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-xs">Digite para buscar em todos os módulos da CPL LOG.</p>
              <div className="flex justify-center gap-2 mt-3 text-[11px] text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded">Ex: COMP-01</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Ex: 001420</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Ex: 19-47</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Ex: OS-2026-0001</span>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">
                Verifique se o prefixo ou código foi digitado corretamente.
              </p>
            </div>
          ) : (
            <>
              {/* Vehicles */}
              {filteredVehicles.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-orange-600" />
                    Veículos & Frota ({filteredVehicles.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredVehicles.slice(0, 5).map((veh) => (
                      <div
                        key={veh.id}
                        onClick={() => {
                          onNavigate('fleet', veh.id);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-orange-100 px-1.5 py-0.5 rounded">
                              {veh.fleetNumber}
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-700">{veh.plate}</span>
                            <span className="text-xs font-semibold text-slate-800">{veh.model}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Sub-região: {veh.subRegion} • Odômetro: {veh.currentOdometerKm.toLocaleString()} km
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Orders */}
              {filteredOrders.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    Ordens de Serviço ({filteredOrders.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredOrders.slice(0, 5).map((os) => (
                      <div
                        key={os.id}
                        onClick={() => {
                          onNavigate('service_orders', os.vehicleId);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                              {os.orderNumber}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">{os.fleetNumber}</span>
                            <span className="text-xs text-slate-600 truncate max-w-xs">{os.description}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Status: {os.status.toUpperCase()} • Custo Total: R$ {os.totalCost.toFixed(2)}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {filteredMaterials.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-orange-600" />
                    Materiais & Peças ({filteredMaterials.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredMaterials.slice(0, 5).map((mat) => (
                      <div
                        key={mat.id}
                        onClick={() => {
                          onNavigate('materials', mat.code);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-orange-700 bg-orange-100/60 px-1.5 py-0.5 rounded">
                              {mat.code}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">{mat.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Local: {mat.shelf} • Saldo: {mat.currentStock} {mat.unit}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requisitions */}
              {filteredRequisitions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                    Requisições ({filteredRequisitions.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredRequisitions.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        onClick={() => {
                          onNavigate('fulfillment', req.number);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              {req.number}
                            </span>
                            {req.stampedNumber && (
                              <span className="font-mono text-xs font-bold text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded">
                                Carimbo: {req.stampedNumber}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-800">
                              Região: {req.regionName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Solicitante TST: {req.requestedByName} • Status: {req.status.toUpperCase()}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shelves */}
              {filteredShelves.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    Localizações & Prateleiras ({filteredShelves.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredShelves.slice(0, 5).map((shelf) => (
                      <div
                        key={shelf.id}
                        onClick={() => {
                          onNavigate('qrcodes', shelf.code);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                            {shelf.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 ml-2">
                            {shelf.zone} - {shelf.aisle}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
