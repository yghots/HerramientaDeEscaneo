import React from 'react';
import { StatsResponse, Business, ScanJob } from '../types';
import { WebsiteStatusBadge, CommercialStatusBadge } from './StatusBadge';
import {
  Globe2,
  Share2,
  PhoneCall,
  Mail,
  Store,
  Compass,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DashboardProps {
  stats: StatsResponse | null;
  recentLeads: Business[];
  activeScans: ScanJob[];
  onNavigateToProspects: (filterWebsiteStatus?: string) => void;
  onNavigateToScans: () => void;
  onSelectBusiness: (biz: Business) => void;
  onNewScan: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentLeads,
  activeScans,
  onNavigateToProspects,
  onNavigateToScans,
  onSelectBusiness,
  onNewScan
}) => {
  const sinWebTotal = stats?.sin_web ?? 0;
  const soloRedesTotal = stats?.solo_redes ?? 0;
  const targetClientsTotal = sinWebTotal + soloRedesTotal;

  return (
    <div className="space-y-6">
      {/* Hero / Value Proposition Banner */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-brand-800/80 border border-brand-700/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Oportunidades Comerciales para NEXO WEB (S/ 100 - S/ 150)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Descubre negocios locales sin página web en Lima
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Identifica barberías, cevicherías, veterinarias y comercios de barrio en distritos de Lima Metropolitana que operan sin presencia web propia o solo con perfiles de redes sociales.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onNewScan}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Explorar Nuevo Distrito</span>
          </button>
          <button
            onClick={() => onNavigateToProspects('SIN WEB DETECTADA,SOLO REDES SOCIALES')}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Ver {targetClientsTotal} Prospectos Clave</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Negocios */}
        <div
          onClick={() => onNavigateToProspects()}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-medium">Total Negocios</span>
            <Store className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.total ?? 0}</p>
          <p className="text-[11px] text-slate-600 mt-1">Registrados localmente</p>
        </div>

        {/* Sin Web Detectada (PROSPECTO PRINCIPAL) */}
        <div
          onClick={() => onNavigateToProspects('SIN WEB DETECTADA')}
          className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm hover:border-emerald-300 cursor-pointer transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-semibold">Sin Web</span>
            <Globe2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950">{stats?.sin_web ?? 0}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">🎯 Clientes potenciales</p>
        </div>

        {/* Solo Redes Sociales */}
        <div
          onClick={() => onNavigateToProspects('SOLO REDES SOCIALES')}
          className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm hover:border-amber-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-medium">Solo Redes</span>
            <Share2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-950">{stats?.solo_redes ?? 0}</p>
          <p className="text-[11px] text-amber-700 mt-1">FB, IG o TikTok</p>
        </div>

        {/* Con Teléfono */}
        <div
          onClick={() => onNavigateToProspects()}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-medium">Con Teléfono</span>
            <PhoneCall className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.con_telefono ?? 0}</p>
          <p className="text-[11px] text-slate-600 mt-1">Para WhatsApp/Llamada</p>
        </div>

        {/* Con Correo */}
        <div
          onClick={() => onNavigateToProspects()}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-medium">Con Correo</span>
            <Mail className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.con_correo ?? 0}</p>
          <p className="text-[11px] text-slate-600 mt-1">Contacto digital</p>
        </div>

        {/* Web Propia (Control) */}
        <div
          onClick={() => onNavigateToProspects('WEB PROPIA DETECTADA')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all opacity-80"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-medium">Con Web Propia</span>
            <Globe2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-700">{stats?.web_propia ?? 0}</p>
          <p className="text-[11px] text-slate-600 mt-1">Ya cuentan con sitio</p>
        </div>
      </div>

      {/* Active Scans Banner if any */}
      {activeScans.length > 0 && (
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 className="text-sm font-semibold text-slate-900">
                Exploración en segundo plano en curso ({activeScans.length})
              </h2>
            </div>
            <button
              onClick={onNavigateToScans}
              className="text-xs font-medium text-brand-900 hover:underline flex items-center gap-1"
            >
              <span>Ver detalles de celdas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeScans.map((scan) => {
              const pct = scan.total_cells > 0 ? Math.round((scan.completed_cells / scan.total_cells) * 100) : 0;
              return (
                <div key={scan.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800">Distrito: {scan.district_name}</span>
                    <span className="text-slate-600 font-mono">{scan.completed_cells} / {scan.total_cells} celdas ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-900 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-600 mt-1">
                    <span>Negocios encontrados: {scan.found_count}</span>
                    <span>Nuevos: {scan.new_count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent High-Priority Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Prospectos Prioritarios para Nexo Web</h2>
            <p className="text-xs text-slate-600">Negocios detectados recientemente sin web propia o solo con redes sociales.</p>
          </div>
          <button
            onClick={() => onNavigateToProspects('SIN WEB DETECTADA,SOLO REDES SOCIALES')}
            className="text-xs font-semibold text-brand-900 hover:text-brand-800 flex items-center gap-1"
          >
            <span>Ver lista completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID / Negocio</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Distrito</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado Web</th>
                <th className="px-4 py-3">Estado Comercial</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-600 text-sm">
                    No se han registrado negocios aún. Inicia una exploración para descubrir clientes.
                  </td>
                </tr>
              ) : (
                recentLeads.map((biz) => (
                  <tr
                    key={biz.id}
                    onClick={() => onSelectBusiness(biz)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{biz.name}</div>
                      <div className="text-[11px] font-mono text-slate-600">{biz.internal_id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {biz.category_name || 'Comercio local'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {biz.district_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {biz.phone ? (
                        <span className="font-mono text-xs text-slate-700 bg-emerald-50/70 border border-emerald-200 px-2 py-0.5 rounded">
                          {biz.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Sin teléfono</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <WebsiteStatusBadge status={biz.website_status} />
                    </td>
                    <td className="px-4 py-3">
                      <CommercialStatusBadge status={biz.commercial_status} doNotContact={biz.do_not_contact} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBusiness(biz);
                        }}
                        className="text-xs text-slate-600 hover:text-brand-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
                      >
                        Ver ficha →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
