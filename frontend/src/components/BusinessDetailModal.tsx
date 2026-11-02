import React, { useState, useEffect } from 'react';
import { Business, WebCheck, CommercialStatus } from '../types';
import { api } from '../api/client';
import { WebsiteStatusBadge, CommercialStatusBadge } from './StatusBadge';
import {
  X,
  Globe,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  RotateCw,
  Share2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  Save,
  MessageCircle
} from 'lucide-react';

interface BusinessDetailModalProps {
  business: Business;
  onClose: () => void;
  onBusinessUpdated: (updated: Business) => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  onClose,
  onBusinessUpdated
}) => {
  const [currentBiz, setCurrentBiz] = useState<Business>(business);
  const [checks, setChecks] = useState<WebCheck[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notes, setNotes] = useState(business.notes || '');
  const [commercialStatus, setCommercialStatus] = useState<CommercialStatus>(business.commercial_status);
  const [doNotContact, setDoNotContact] = useState(business.do_not_contact);
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadChecks();
  }, [business.id]);

  const loadChecks = async () => {
    setLoadingChecks(true);
    try {
      const data = await api.getWebsiteChecks(business.id);
      setChecks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChecks(false);
    }
  };

  const handleVerifyNow = async () => {
    setVerifying(true);
    try {
      const updated = await api.verifyWebsite(business.id);
      setCurrentBiz(updated);
      onBusinessUpdated(updated);
      await loadChecks();
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar verificación web');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveCommercialData = async () => {
    setSavingStatus(true);
    setSaveSuccess(false);
    try {
      const updated = await api.updateBusinessStatus(business.id, {
        commercial_status: commercialStatus,
        do_not_contact: doNotContact,
        notes: notes.trim()
      });
      setCurrentBiz(updated);
      onBusinessUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert('Error al guardar datos comerciales');
    } finally {
      setSavingStatus(false);
    }
  };

  const isMobile = currentBiz.phone?.startsWith('+51 9');
  const whatsappDigits = currentBiz.phone ? currentBiz.phone.replace(/\D/g, '') : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                {currentBiz.internal_id}
              </span>
              <WebsiteStatusBadge status={currentBiz.website_status} />
              <CommercialStatusBadge status={currentBiz.commercial_status} doNotContact={currentBiz.do_not_contact} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{currentBiz.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentBiz.category_name || 'Comercio'} • Distrito de {currentBiz.district_name || 'Lima'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Contact & Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Datos de Contacto</h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  {currentBiz.phone ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-800">{currentBiz.phone}</span>
                      {isMobile && (
                        <a
                          href={`https://wa.me/${whatsappDigits}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded hover:bg-emerald-700"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin teléfono público registrado</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {currentBiz.email ? (
                    <a href={`mailto:${currentBiz.email}`} className="text-blue-600 hover:underline">
                      {currentBiz.email}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin correo registrado</span>
                  )}
                </div>

                {/* Social links */}
                {Object.keys(currentBiz.social_profiles || {}).length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-2">
                    {Object.entries(currentBiz.social_profiles).map(([network, url]) => (
                      <a
                        key={network}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-700 hover:text-slate-900"
                      >
                        <Share2 className="w-3 h-3 text-slate-400" />
                        <span className="capitalize">{network}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location & Source Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ubicación y Fuente</h3>

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">{currentBiz.address || 'Sin dirección exacta'}</div>
                    <div className="text-xs text-slate-500">{currentBiz.district_name}, Lima</div>
                  </div>
                </div>

                {currentBiz.latitude && currentBiz.longitude && (
                  <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                    <span>
                      {currentBiz.latitude.toFixed(5)}, {currentBiz.longitude.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${currentBiz.latitude}&mlon=${currentBiz.longitude}#map=18/${currentBiz.latitude}/${currentBiz.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-sans"
                    >
                      <span>Ver mapa</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex justify-between">
                  <span>Origen: {currentBiz.origin_id || 'OpenStreetMap'}</span>
                  {currentBiz.origin_url && (
                    <a href={currentBiz.origin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      Ficha OSM ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Web Presence & Technical Detection Engine Box */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-brand-900" />
                  <span>Motor de Detección de Página Web</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {currentBiz.website_status_reason || 'Sin detalles de verificación técnica'}
                </p>
              </div>

              <button
                onClick={handleVerifyNow}
                disabled={verifying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-900 hover:bg-brand-800 text-white disabled:opacity-50 transition-all self-start sm:self-auto shadow-sm"
              >
                <RotateCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                <span>{verifying ? 'Comprobando...' : 'Verificar Sitio Ahora'}</span>
              </button>
            </div>

            {/* Declared website if any */}
            {currentBiz.website_declared ? (
              <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">URL Registrada: </span>
                  <a
                    href={currentBiz.website_declared}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:underline font-medium"
                  >
                    {currentBiz.website_declared}
                  </a>
                </div>
                <span className="text-[11px] text-slate-400">Dominio: {currentBiz.website_domain}</span>
              </div>
            ) : (
              <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Excelente prospecto:</strong> No se encontró ningún sitio web propio registrado en las fuentes abiertas.
                </span>
              </div>
            )}

            {/* Web Checks Log History */}
            {checks.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-slate-700">Historial de Comprobaciones Técnicas:</h4>
                <div className="space-y-2">
                  {checks.map((chk) => (
                    <div key={chk.id} className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-slate-800">{chk.target_url}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(chk.checked_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                        <span>HTTP: <strong>{chk.http_status ?? 'Error de conexión'}</strong></span>
                        <span>Accesible: <strong>{chk.is_accessible ? 'Sí' : 'No'}</strong></span>
                        <span>SSL: <strong>{chk.ssl_valid ? 'Válido' : 'No'}</strong></span>
                        {chk.response_time_ms && <span>Latencia: <strong>{chk.response_time_ms} ms</strong></span>}
                        {chk.matches_business_name && <span className="text-emerald-700 font-semibold">✓ Coincide nombre</span>}
                      </div>
                      {chk.page_title && (
                        <div className="text-[11px] text-slate-600 italic">
                          Título: "{chk.page_title}"
                        </div>
                      )}
                      {chk.error_details && (
                        <div className="text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-200">
                          Detalle: {chk.error_details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CRM & Commercial Follow-up */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seguimiento Comercial (NEXO WEB)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado de Contacto</label>
                <select
                  value={commercialStatus}
                  onChange={(e) => setCommercialStatus(e.target.value as CommercialStatus)}
                  className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Pendiente de contactar">Pendiente de contactar</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Respondió">Respondió</option>
                  <option value="Interesado">⭐ Interesado</option>
                  <option value="Venta cerrada">🎉 Venta cerrada</option>
                  <option value="No interesado">No interesado</option>
                  <option value="No volver a contactar">No volver a contactar</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={doNotContact}
                    onChange={(e) => setDoNotContact(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <span>Marcar como "No volver a contactar"</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notas Comerciales</label>
              <textarea
                rows={3}
                placeholder="Ejemplo: Hablé con el dueño (Carlos), atienden de 9am a 7pm. Le interesa una web sencilla con botón de WhatsApp y menú por S/ 150..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-emerald-700 font-medium">
                {saveSuccess ? '✓ Cambios comerciales guardados correctamente' : ''}
              </span>

              <button
                onClick={handleSaveCommercialData}
                disabled={savingStatus}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-brand-900 hover:bg-brand-800 text-white shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingStatus ? 'Guardando...' : 'Guardar Datos Comerciales'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
