import React, { useState, useEffect } from 'react';
import { ScanJob, District, Category, ScanStatus } from '../types';
import { api } from '../api/client';
import { ScanStatusBadge } from './StatusBadge';
import {
  Compass,
  Play,
  Pause,
  XCircle,
  RotateCw,
  PlusCircle,
  Grid,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  Clock
} from 'lucide-react';

interface ScanManagerProps {
  districts: District[];
  categories: Category[];
  isNewScanOpen: boolean;
  setIsNewScanOpen: (open: boolean) => void;
  onScanCreated: () => void;
}

export const ScanManager: React.FC<ScanManagerProps> = ({
  districts,
  categories,
  isNewScanOpen,
  setIsNewScanOpen,
  onScanCreated
}) => {
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScanDetail, setSelectedScanDetail] = useState<ScanJob | null>(null);

  // New Scan Form State
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(districts[0]?.id || 1);
  const [selectedSource, setSelectedSource] = useState<string>('osm_file');
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [gridSizeKm, setGridSizeKm] = useState<number>(1.0);
  const [creating, setCreating] = useState(false);

  const fetchScans = async () => {
    try {
      const data = await api.getScans();
      setScans(data);

      // If a scan is currently selected for detail, refresh it
      if (selectedScanDetail) {
        const refreshed = await api.getScan(selectedScanDetail.id);
        setSelectedScanDetail(refreshed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
    // Poll every 3 seconds if there is a running scan
    const interval = setInterval(() => {
      fetchScans();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedScanDetail?.id]);

  const handlePause = async (id: number) => {
    try {
      await api.pauseScan(id);
      fetchScans();
    } catch (err) {
      alert('Error al pausar la exploración');
    }
  };

  const handleResume = async (id: number) => {
    try {
      await api.resumeScan(id);
      fetchScans();
    } catch (err) {
      alert('Error al reanudar la exploración');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Seguro que deseas cancelar esta exploración?')) return;
    try {
      await api.cancelScan(id);
      fetchScans();
    } catch (err) {
      alert('Error al cancelar la exploración');
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategorySlugs.length === categories.length) {
      setSelectedCategorySlugs([]);
    } else {
      setSelectedCategorySlugs(categories.map((c) => c.slug));
    }
  };

  const handleToggleCategory = (slug: string) => {
    if (selectedCategorySlugs.includes(slug)) {
      setSelectedCategorySlugs(selectedCategorySlugs.filter((s) => s !== slug));
    } else {
      setSelectedCategorySlugs([...selectedCategorySlugs, slug]);
    }
  };

  const handleCreateScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createScan({
        district_id: selectedDistrictId,
        category_slugs: selectedCategorySlugs.length > 0 ? selectedCategorySlugs : undefined,
        source_name: selectedSource,
        grid_size_km: gridSizeKm
      });
      setIsNewScanOpen(false);
      onScanCreated();
      fetchScans();
    } catch (err: any) {
      alert(err.message || 'Error al iniciar exploración');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-900" />
            <span>Gestión de Exploraciones Geográficas</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Divide distritos de Lima Metropolitana en cuadrículas independientes y procesa negocios sin coste de APIs.
          </p>
        </div>

        <button
          onClick={() => setIsNewScanOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Iniciar Nueva Exploración</span>
        </button>
      </div>

      {/* Scans Grid / List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Scans */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Historial de Trabajos ({scans.length})</h3>
              <button
                onClick={() => fetchScans()}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-500 text-sm">Cargando exploraciones...</div>
              ) : scans.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No hay exploraciones registradas aún. Haz clic en "Iniciar Nueva Exploración".
                </div>
              ) : (
                scans.map((scan) => {
                  const pct = scan.total_cells > 0 ? Math.round((scan.completed_cells / scan.total_cells) * 100) : 0;
                  const isSelected = selectedScanDetail?.id === scan.id;

                  return (
                    <div
                      key={scan.id}
                      onClick={() => setSelectedScanDetail(scan)}
                      className={`p-4 transition-colors cursor-pointer ${
                        isSelected ? 'bg-brand-50/50 border-l-4 border-brand-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{scan.district_name}</span>
                            <ScanStatusBadge status={scan.status} />
                            <span className="text-[11px] font-mono text-slate-400">Trabajo #{scan.id}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                            <span>Fuente: {scan.source_name}</span>
                            <span>Cuadrícula: {scan.grid_size_km} km</span>
                            <span>Creado: {new Date(scan.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Scan action buttons */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {scan.status === 'running' && (
                            <button
                              onClick={() => handlePause(scan.id)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium flex items-center gap-1"
                              title="Pausar exploración"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pausar</span>
                            </button>
                          )}

                          {scan.status === 'paused' && (
                            <button
                              onClick={() => handleResume(scan.id)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1"
                              title="Reanudar exploración"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Reanudar</span>
                            </button>
                          )}

                          {(scan.status === 'running' || scan.status === 'paused') && (
                            <button
                              onClick={() => handleCancel(scan.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs"
                              title="Cancelar trabajo"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>
                            Celdas: <strong>{scan.completed_cells} / {scan.total_cells}</strong> ({pct}%)
                          </span>
                          <span>
                            Negocios detectados: <strong>{scan.found_count}</strong> ({scan.new_count} nuevos)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              scan.status === 'completed' ? 'bg-emerald-600' : 'bg-brand-900'
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scan Cell Inspector */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Grid className="w-4 h-4 text-brand-900" />
              <span>Inspector de Celdas Geográficas</span>
            </h3>

            {!selectedScanDetail ? (
              <p className="text-xs text-slate-500">
                Selecciona una exploración del listado para inspeccionar sus celdas y áreas procesadas.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">
                    Distrito: {selectedScanDetail.district_name}
                  </div>
                  <div className="text-slate-600">
                    Total Celdas: <strong>{selectedScanDetail.total_cells}</strong> | Completadas: <strong>{selectedScanDetail.completed_cells}</strong>
                  </div>
                  {selectedScanDetail.error_message && (
                    <div className="text-rose-600 mt-1 font-medium bg-rose-50 p-1.5 rounded">
                      Error: {selectedScanDetail.error_message}
                    </div>
                  )}
                </div>

                {/* Grid cells pills */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Estado por Celda:</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-60 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {selectedScanDetail.cells?.map((c) => {
                      let bg = 'bg-slate-200 text-slate-600';
                      if (c.status === 'completed') bg = 'bg-emerald-500 text-white font-semibold';
                      if (c.status === 'running') bg = 'bg-amber-400 text-slate-900 animate-pulse font-bold';
                      if (c.status === 'error') bg = 'bg-rose-500 text-white';

                      return (
                        <div
                          key={c.id}
                          className={`p-2 rounded text-center text-xs ${bg}`}
                          title={`Celda #${c.cell_index} (${c.min_lat}, ${c.min_lon}) - Encontrados: ${c.items_found}`}
                        >
                          <div>#{c.cell_index}</div>
                          <div className="text-[10px] opacity-90">{c.items_found} neg.</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Scan Modal */}
      {isNewScanOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <form onSubmit={handleCreateScanSubmit}>
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-brand-900" />
                  <h3 className="font-bold text-slate-900">Configurar Nueva Exploración</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewScanOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* District Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Distrito de Lima Metropolitana
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(Number(e.target.value))}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.business_count ? `(${d.business_count} negocios ya en base)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fuente de Datos Abiertos
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedSource === 'osm_file'
                          ? 'border-brand-900 bg-brand-50/50 font-semibold text-brand-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="source"
                        value="osm_file"
                        checked={selectedSource === 'osm_file'}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="hidden"
                      />
                      <div className="font-bold text-slate-900">Extracto Local (Recomendado)</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        100% offline, instantáneo y sin límites de API externa.
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedSource === 'osm_overpass'
                          ? 'border-brand-900 bg-brand-50/50 font-semibold text-brand-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="source"
                        value="osm_overpass"
                        checked={selectedSource === 'osm_overpass'}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="hidden"
                      />
                      <div className="font-bold text-slate-900">Overpass API (En vivo)</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Consulta en vivo a servidores OSM con esperas prudentes y caché.
                      </div>
                    </label>
                  </div>
                </div>

                {/* Grid size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tamaño de Cuadrícula Geográfica
                  </label>
                  <select
                    value={gridSizeKm}
                    onChange={(e) => setGridSizeKm(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={0.5}>0.5 km (Alta densidad / Cuadrícula fina)</option>
                    <option value={1.0}>1.0 km (Equilibrado y estándar)</option>
                    <option value={2.0}>2.0 km (Rápido / Zonas amplias)</option>
                  </select>
                </div>

                {/* Categories Multiselect */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Categorías Comerciales a Explorar
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllCategories}
                      className="text-xs text-brand-900 hover:underline font-medium"
                    >
                      {selectedCategorySlugs.length === categories.length
                        ? 'Deseleccionar todas'
                        : 'Seleccionar todas'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {categories.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer p-1 rounded hover:bg-slate-100"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategorySlugs.includes(c.slug)}
                          onChange={() => handleToggleCategory(c.slug)}
                          className="rounded text-brand-900 focus:ring-brand-500 border-slate-300"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Si no seleccionas ninguna, se explorarán todas las categorías por defecto.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewScanOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-brand-900 hover:bg-brand-800 text-white shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>{creating ? 'Iniciando...' : 'Comenzar Exploración'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
