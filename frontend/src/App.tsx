import React, { useState, useEffect } from 'react';
import {
  District,
  Category,
  Business,
  StatsResponse,
  ScanJob
} from './types';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProspectList } from './components/ProspectList';
import { ScanManager } from './components/ScanManager';
import { CategoryConfigModal } from './components/CategoryConfigModal';
import { BusinessDetailModal } from './components/BusinessDetailModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'prospects' | 'scans' | 'categories'>('dashboard');

  // Shared application state
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentLeads, setRecentLeads] = useState<Business[]>([]);
  const [activeScans, setActiveScans] = useState<ScanJob[]>([]);

  // Navigation filters
  const [prospectsInitialWebStatus, setProspectsInitialWebStatus] = useState<string | undefined>(undefined);

  // Modals
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);

  const loadInitialData = async () => {
    try {
      const [distData, catData, statsData, scansData] = await Promise.all([
        api.getDistricts(),
        api.getCategories(),
        api.getStats(),
        api.getScans()
      ]);

      setDistricts(distData);
      setCategories(catData);
      setStats(statsData);
      setActiveScans(scansData.filter((s) => s.status === 'running'));

      // Load high-priority leads for the dashboard
      const leadsRes = await api.getBusinesses({
        website_status: 'SIN WEB DETECTADA,SOLO REDES SOCIALES',
        page: 1,
        page_size: 8
      });
      setRecentLeads(leadsRes.items);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Periodic stats refresh
    const interval = setInterval(async () => {
      try {
        const [statsData, scansData] = await Promise.all([
          api.getStats(),
          api.getScans()
        ]);
        setStats(statsData);
        setActiveScans(scansData.filter((s) => s.status === 'running'));
      } catch (e) {
        // quiet error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigateToProspects = (filterWebsiteStatus?: string) => {
    setProspectsInitialWebStatus(filterWebsiteStatus);
    setCurrentTab('prospects');
  };

  const handleBusinessUpdated = (updated: Business) => {
    setSelectedBusiness(updated);
    setRecentLeads((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    // Reload stats
    api.getStats().then(setStats).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'prospects') {
            setProspectsInitialWebStatus(undefined);
          }
          setCurrentTab(tab);
        }}
        onNewScan={() => setIsNewScanOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            recentLeads={recentLeads}
            activeScans={activeScans}
            onNavigateToProspects={handleNavigateToProspects}
            onNavigateToScans={() => setCurrentTab('scans')}
            onSelectBusiness={(b) => setSelectedBusiness(b)}
            onNewScan={() => setIsNewScanOpen(true)}
          />
        )}

        {currentTab === 'prospects' && (
          <ProspectList
            districts={districts}
            categories={categories}
            initialWebsiteStatus={prospectsInitialWebStatus}
            onSelectBusiness={(b) => setSelectedBusiness(b)}
          />
        )}

        {currentTab === 'scans' && (
          <ScanManager
            districts={districts}
            categories={categories}
            isNewScanOpen={isNewScanOpen}
            setIsNewScanOpen={setIsNewScanOpen}
            onScanCreated={() => {
              loadInitialData();
            }}
          />
        )}

        {currentTab === 'categories' && (
          <CategoryConfigModal
            categories={categories}
            onCategoryAdded={() => {
              api.getCategories().then(setCategories);
            }}
          />
        )}
      </main>

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onBusinessUpdated={handleBusinessUpdated}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">NEXO LEADS</span>
            <span>—</span>
            <span>Herramienta local de prospección comercial para NEXO WEB en Lima, Perú</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Datos: © Colaboradores de OpenStreetMap (ODbL)</span>
            <span>Sin APIs comerciales de pago</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
