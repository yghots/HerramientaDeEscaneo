import React from 'react';
import { WebsiteStatus, CommercialStatus, ScanStatus } from '../types';

interface WebBadgeProps {
  status: WebsiteStatus;
}

export const WebsiteStatusBadge: React.FC<WebBadgeProps> = ({ status }) => {
  switch (status) {
    case 'SIN WEB DETECTADA':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm" title="Prospecto de alto potencial para Nexo Web">
          ● SIN WEB DETECTADA
        </span>
      );
    case 'SOLO REDES SOCIALES':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300" title="Negocio activo digitalmente pero sin página web propia">
          ● SOLO REDES SOCIALES
        </span>
      );
    case 'WEB PROPIA DETECTADA':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          WEB PROPIA
        </span>
      );
    case 'WEB CON PROBLEMAS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          WEB CON PROBLEMAS
        </span>
      );
    case 'REVISION MANUAL':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
          REVISIÓN MANUAL
        </span>
      );
    case 'PENDIENTE DE VERIFICACION':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          PENDIENTE
        </span>
      );
  }
};

interface CommercialBadgeProps {
  status: CommercialStatus;
  doNotContact?: boolean;
}

export const CommercialStatusBadge: React.FC<CommercialBadgeProps> = ({ status, doNotContact }) => {
  if (doNotContact || status === 'No volver a contactar') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        No contactar
      </span>
    );
  }

  const styles: Record<CommercialStatus, string> = {
    'Nuevo': 'bg-blue-50 text-blue-700 border-blue-200',
    'Pendiente de contactar': 'bg-sky-50 text-sky-700 border-sky-200',
    'Contactado': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Respondió': 'bg-amber-50 text-amber-700 border-amber-200',
    'Interesado': 'bg-emerald-50 text-emerald-800 font-semibold border-emerald-300',
    'Venta cerrada': 'bg-teal-100 text-teal-900 font-bold border-teal-400',
    'No interesado': 'bg-slate-100 text-slate-600 border-slate-200',
    'No volver a contactar': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
};

export const ScanStatusBadge: React.FC<{ status: ScanStatus }> = ({ status }) => {
  switch (status) {
    case 'running':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 animate-pulse">
          ● En ejecución
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          ✓ Completado
        </span>
      );
    case 'paused':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          ⏸ Pausado
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
          ✕ Error
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
          Cancelado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          Pendiente
        </span>
      );
  }
};
