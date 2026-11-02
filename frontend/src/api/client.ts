import {
  District,
  Category,
  Business,
  BusinessListResponse,
  StatsResponse,
  ScanJob,
  WebCheck,
  CommercialStatus
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Districts
  async getDistricts(): Promise<District[]> {
    const res = await fetch(`${API_BASE}/districts`);
    if (!res.ok) throw new Error('Error al cargar distritos');
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Error al cargar categorías');
    return res.json();
  },

  async createCategory(cat: { slug: string; name: string; icon?: string; osm_tags: Record<string, any>; description?: string }): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al crear categoría');
    }
    return res.json();
  },

  // Stats
  async getStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_BASE}/businesses/stats`);
    if (!res.ok) throw new Error('Error al cargar estadísticas');
    return res.json();
  },

  // Businesses
  async getBusinesses(params: {
    district?: string;
    category?: string;
    website_status?: string;
    commercial_status?: string;
    has_phone?: boolean;
    has_email?: boolean;
    query?: string;
    exclude_do_not_contact?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<BusinessListResponse> {
    const query = new URLSearchParams();
    if (params.district) query.set('district', params.district);
    if (params.category) query.set('category', params.category);
    if (params.website_status) query.set('website_status', params.website_status);
    if (params.commercial_status) query.set('commercial_status', params.commercial_status);
    if (params.has_phone !== undefined) query.set('has_phone', String(params.has_phone));
    if (params.has_email !== undefined) query.set('has_email', String(params.has_email));
    if (params.query) query.set('query', params.query);
    if (params.exclude_do_not_contact !== undefined) query.set('exclude_do_not_contact', String(params.exclude_do_not_contact));
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${API_BASE}/businesses?${query.toString()}`);
    if (!res.ok) throw new Error('Error al cargar negocios');
    return res.json();
  },

  async getBusiness(id: number): Promise<Business> {
    const res = await fetch(`${API_BASE}/businesses/${id}`);
    if (!res.ok) throw new Error('Error al obtener datos del negocio');
    return res.json();
  },

  async getWebsiteChecks(id: number): Promise<WebCheck[]> {
    const res = await fetch(`${API_BASE}/businesses/${id}/website-checks`);
    if (!res.ok) throw new Error('Error al obtener verificaciones web');
    return res.json();
  },

  async verifyWebsite(id: number): Promise<Business> {
    const res = await fetch(`${API_BASE}/businesses/${id}/verify-website`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error al ejecutar verificación técnica de sitio web');
    return res.json();
  },

  async updateBusinessStatus(
    id: number,
    data: {
      commercial_status?: CommercialStatus;
      do_not_contact?: boolean;
      notes?: string;
    }
  ): Promise<Business> {
    const res = await fetch(`${API_BASE}/businesses/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar negocio');
    return res.json();
  },

  // Scans
  async getScans(): Promise<ScanJob[]> {
    const res = await fetch(`${API_BASE}/scans`);
    if (!res.ok) throw new Error('Error al obtener exploraciones');
    return res.json();
  },

  async getScan(id: number): Promise<ScanJob> {
    const res = await fetch(`${API_BASE}/scans/${id}`);
    if (!res.ok) throw new Error('Error al obtener detalle de exploración');
    return res.json();
  },

  async createScan(data: {
    district_id: number;
    category_slugs?: string[];
    source_name: string;
    grid_size_km: number;
  }): Promise<ScanJob> {
    const res = await fetch(`${API_BASE}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al iniciar exploración');
    return res.json();
  },

  async pauseScan(id: number): Promise<ScanJob> {
    const res = await fetch(`${API_BASE}/scans/${id}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al pausar exploración');
    return res.json();
  },

  async resumeScan(id: number): Promise<ScanJob> {
    const res = await fetch(`${API_BASE}/scans/${id}/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al reanudar exploración');
    return res.json();
  },

  async cancelScan(id: number): Promise<ScanJob> {
    const res = await fetch(`${API_BASE}/scans/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al cancelar exploración');
    return res.json();
  },

  // CSV Export URL generator
  getExportUrl(params: {
    district?: string;
    category?: string;
    website_status?: string;
    commercial_status?: string;
    has_phone?: boolean;
    has_email?: boolean;
    query?: string;
    exclude_do_not_contact?: boolean;
  }): string {
    const query = new URLSearchParams();
    if (params.district) query.set('district', params.district);
    if (params.category) query.set('category', params.category);
    if (params.website_status) query.set('website_status', params.website_status);
    if (params.commercial_status) query.set('commercial_status', params.commercial_status);
    if (params.has_phone !== undefined) query.set('has_phone', String(params.has_phone));
    if (params.has_email !== undefined) query.set('has_email', String(params.has_email));
    if (params.query) query.set('query', params.query);
    if (params.exclude_do_not_contact !== undefined) query.set('exclude_do_not_contact', String(params.exclude_do_not_contact));
    return `${API_BASE}/export/csv?${query.toString()}`;
  }
};
