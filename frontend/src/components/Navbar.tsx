import React from 'react';
import { Compass, Users, Activity, Settings2, ShieldCheck, PlusCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'prospects' | 'scans' | 'categories';
  setCurrentTab: (tab: 'dashboard' | 'prospects' | 'scans' | 'categories') => void;
  onNewScan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onNewScan }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-900 to-brand-700 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              NL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">NEXO LEADS</span>
                <span className="text-[10px] font-semibold bg-brand-50 text-brand-900 border border-brand-200 px-1.5 py-0.5 rounded uppercase">
                  Nexo Web
                </span>
              </div>
              <p className="text-xs text-slate-600 hidden sm:block">Buscador Local de Clientes para Páginas Web S/ 100 - S/ 150</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-brand-50 text-brand-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('prospects')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'prospects'
                  ? 'bg-brand-50 text-brand-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Prospectos</span>
            </button>

            <button
              onClick={() => setCurrentTab('scans')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'scans'
                  ? 'bg-brand-50 text-brand-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Exploraciones</span>
            </button>

            <button
              onClick={() => setCurrentTab('categories')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'categories'
                  ? 'bg-brand-50 text-brand-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Configurar categorías y etiquetas OSM"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden md:inline">Categorías</span>
            </button>

            {/* Quick Action Button */}
            <button
              onClick={onNewScan}
              className="ml-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-brand-900 hover:bg-brand-800 text-white shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Exploración</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
