import React, { useState, useEffect } from 'react';
import {
  Business,
  District,
  Category,
  WebsiteStatus,
  CommercialStatus
} from '../types';
import { api } from '../api/client';
import { WebsiteStatusBadge, CommercialStatusBadge } from './StatusBadge';
import {
  Search,
  Download,
  Filter,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  RotateCw,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

interface ProspectListProps {
  districts: District[];
  categories: Category[];
  initialWebsiteStatus?: string;
  onSelectBusiness: (biz: Business) => void;
}

export const ProspectList: React.FC<ProspectListProps> = ({
  districts,
  categories,
  initialWebsiteStatus,
  onSelectBusiness
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pages, setPages] = useState(1);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWebStatus, setSelectedWebStatus] = useState<string>(
    initialWebsiteStatus || 'SIN WEB DETECTADA,SOLO REDES SOCIALES'
  );
  const [selectedCommercialStatus, setSelectedCommercialStatus] = useState('');
  const [hasPhone, setHasPhone] = useState<boolean | undefined>(undefined);
  const [hasEmail, setHasEmail] = useState<boolean | undefined>(undefined);
  const [excludeDoNotContact, setExcludeDoNotContact] = useState(true);

  // Copy indicator state
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await api.getBusinesses({
        district: selectedDistrict || undefined,
        category: selectedCategory || undefined,
        website_status: selectedWebStatus || undefined,
        commercial_status: selectedCommercialStatus || undefined,
        has_phone: hasPhone,
        has_email: hasEmail,
        query: query.trim() || undefined,
        exclude_do_not_contact: excludeDoNotContact,
        page,
        page_size: pageSize
      });
      setBusinesses(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [
    page,
    pageSize,
    selectedDistrict,
    selectedCategory,
    selectedWebStatus,
    selectedCommercialStatus,
    hasPhone,
    hasEmail,
    excludeDoNotContact
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  const handleCommercialStatusChange = async (bizId: number, newStatus: CommercialStatus) => {
    try {
      const updated = await api.updateBusinessStatus(bizId, { commercial_status: newStatus });
      setBusinesses((prev) => prev.map((b) => (b.id === bizId ? updated : b)));
    } catch (err) {
      alert('Error al actualizar el estado comercial');
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportUrl = api.getExportUrl({
    district: selectedDistrict || undefined,
    category: selectedCategory || undefined,
    website_status: selectedWebStatus || undefined,
    commercial_status: selectedCommercialStatus || undefined,
    has_phone: hasPhone,
    has_email: hasEmail,
    query: query.trim() || undefined,
    exclude_do_not_contact: excludeDoNotContact
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Quick Filter Tabs for Commercial Focus */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Enfoque:
          </span>

          <button
            onClick={() => {
              setSelectedWebStatus('SIN WEB DETECTADA,SOLO REDES SOCIALES');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedWebStatus === 'SIN WEB DETECTADA,SOLO REDES SOCIALES'
                ? 'bg-brand-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🎯 Principales Nexo Web (Sin Web + Solo Redes)
          </button>

          <button
            onClick={() => {
              setSelectedWebStatus('SIN WEB DETECTADA');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedWebStatus === 'SIN WEB DETECTADA'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sin Web Detectada
          </button>

          <button
            onClick={() => {
              setSelectedWebStatus('SOLO REDES SOCIALES');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedWebStatus === 'SOLO REDES SOCIALES'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Solo Redes Sociales
          </button>

          <button
            onClick={() => {
              setSelectedWebStatus('WEB PROPIA DETECTADA');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedWebStatus === 'WEB PROPIA DETECTADA'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Con Web Propia
          </button>

          <button
            onClick={() => {
              setSelectedWebStatus('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedWebStatus === ''
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos los estados
          </button>

          <div className="ml-auto">
            <a
              href={exportUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              title="Descargar lista filtrada en formato compatible con Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel (CSV)</span>
            </a>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, dirección o teléfono..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </form>

          {/* District Select */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            >
              <option value="">Todos los distritos</option>
              {districts.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} {d.business_count ? `(${d.business_count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Commercial Status Select */}
          <div>
            <select
              value={selectedCommercialStatus}
              onChange={(e) => {
                setSelectedCommercialStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            >
              <option value="">Estado comercial (Todos)</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Pendiente de contactar">Pendiente de contactar</option>
              <option value="Contactado">Contactado</option>
              <option value="Respondió">Respondió</option>
              <option value="Interesado">Interesado</option>
              <option value="Venta cerrada">Venta cerrada</option>
              <option value="No interesado">No interesado</option>
              <option value="No volver a contactar">No volver a contactar</option>
            </select>
          </div>
        </div>

        {/* Toggles Row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-2 gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPhone === true}
                onChange={(e) => {
                  setHasPhone(e.target.checked ? true : undefined);
                  setPage(1);
                }}
                className="rounded text-brand-900 focus:ring-brand-500 border-slate-300"
              />
              <span>Solo con teléfono</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEmail === true}
                onChange={(e) => {
                  setHasEmail(e.target.checked ? true : undefined);
                  setPage(1);
                }}
                className="rounded text-brand-900 focus:ring-brand-500 border-slate-300"
              />
              <span>Solo con correo</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeDoNotContact}
                onChange={(e) => {
                  setExcludeDoNotContact(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-brand-900 focus:ring-brand-500 border-slate-300"
              />
              <span>Excluir "No volver a contactar"</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span>Resultados: <strong>{total}</strong></span>
            <button
              onClick={() => fetchBusinesses()}
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
              title="Refrescar lista"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID / Negocio</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Distrito y Dirección</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado Web</th>
                <th className="px-4 py-3">Estado Comercial</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-5 h-5 animate-spin text-brand-900" />
                      <span>Cargando prospectos...</span>
                    </div>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">No se encontraron prospectos con los filtros actuales.</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando el distrito o iniciando una nueva exploración.</p>
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => {
                  const isMobile = biz.phone?.startsWith('+51 9');
                  const whatsappDigits = biz.phone ? biz.phone.replace(/\D/g, '') : '';

                  return (
                    <tr
                      key={biz.id}
                      onClick={() => onSelectBusiness(biz)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Name & ID */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-snug">{biz.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400">{biz.internal_id}</span>
                          {biz.origin_url && (
                            <a
                              href={biz.origin_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                              title="Ver en OpenStreetMap"
                            >
                              <span>OSM</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-xs">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {biz.category_name || 'Comercio local'}
                        </span>
                      </td>

                      {/* District & Address */}
                      <td className="px-4 py-3 text-xs max-w-xs">
                        <div className="font-semibold text-slate-800">{biz.district_name || '—'}</div>
                        <div className="text-slate-500 truncate" title={biz.address || ''}>
                          {biz.address || <span className="italic text-slate-400">Sin dirección exacta</span>}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {biz.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-medium">
                                {biz.phone}
                              </span>

                              {/* Copy button */}
                              <button
                                onClick={() => copyToClipboard(biz.phone!, biz.id)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
                                title="Copiar teléfono"
                              >
                                {copiedId === biz.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>

                              {/* WhatsApp link for mobile */}
                              {isMobile && (
                                <a
                                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                                    `Hola, nos comunicamos de NEXO WEB para ${biz.name}. Queríamos consultar si cuentan con página web para sus clientes.`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                                  title="Enviar WhatsApp directo"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin teléfono</span>
                          )}

                          {biz.email && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={biz.email}>
                              {biz.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Web Status */}
                      <td className="px-4 py-3">
                        <WebsiteStatusBadge status={biz.website_status} />
                        {biz.website_declared && (
                          <div className="mt-1">
                            <a
                              href={biz.website_declared}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-slate-500 hover:text-slate-800 underline truncate block max-w-[140px]"
                              title={biz.website_declared}
                            >
                              {biz.website_domain || biz.website_declared}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Commercial Status (Inline dropdown) */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={biz.commercial_status}
                          onChange={(e) => handleCommercialStatusChange(biz.id, e.target.value as CommercialStatus)}
                          className="text-xs py-1 px-2 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                        >
                          <option value="Nuevo">Nuevo</option>
                          <option value="Pendiente de contactar">Pendiente contactar</option>
                          <option value="Contactado">Contactado</option>
                          <option value="Respondió">Respondió</option>
                          <option value="Interesado">⭐ Interesado</option>
                          <option value="Venta cerrada">🎉 Venta cerrada</option>
                          <option value="No interesado">No interesado</option>
                          <option value="No volver a contactar">No contactar</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectBusiness(biz)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ficha</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
          <div>
            Mostrando {businesses.length > 0 ? (page - 1) * pageSize + 1 : 0} a{' '}
            {Math.min(page * pageSize, total)} de {total} prospectos
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Anterior
            </button>
            <span className="font-semibold text-slate-800">
              Página {page} de {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
