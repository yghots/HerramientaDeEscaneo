export type WebsiteStatus =
  | 'SIN WEB DETECTADA'
  | 'WEB PROPIA DETECTADA'
  | 'WEB CON PROBLEMAS'
  | 'SOLO REDES SOCIALES'
  | 'PENDIENTE DE VERIFICACION'
  | 'REVISION MANUAL';

export type CommercialStatus =
  | 'Nuevo'
  | 'Pendiente de contactar'
  | 'Contactado'
  | 'Respondió'
  | 'Interesado'
  | 'Venta cerrada'
  | 'No interesado'
  | 'No volver a contactar';

export type ScanStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface District {
  id: number;
  name: string;
  province: string;
  department: string;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  is_active: boolean;
  business_count?: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  osm_tags: Record<string, any>;
  description?: string;
  business_count?: number;
}

export interface WebCheck {
  id: number;
  target_url: string;
  final_url?: string;
  http_status?: number;
  is_accessible: boolean;
  ssl_valid: boolean;
  response_time_ms?: number;
  page_title?: string;
  page_description?: string;
  matches_business_name: boolean;
  matches_phone: boolean;
  is_social_profile: boolean;
  is_directory_or_marketplace: boolean;
  error_details?: string;
  checked_at: string;
}

export interface Business {
  id: number;
  internal_id: string;
  source_id?: number;
  origin_id?: string;
  origin_url?: string;
  name: string;
  category_id?: number;
  category_name?: string;
  address?: string;
  district_id?: number;
  district_name?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  phone_raw?: string;
  email?: string;
  website_declared?: string;
  website_domain?: string;
  social_profiles: Record<string, string>;
  website_status: WebsiteStatus;
  website_status_reason?: string;
  commercial_status: CommercialStatus;
  do_not_contact: boolean;
  notes?: string;
  raw_tags?: Record<string, any>;
  first_detected_at: string;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
  web_checks?: WebCheck[];
}

export interface BusinessListResponse {
  items: Business[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface StatsResponse {
  total: number;
  sin_web: number;
  solo_redes: number;
  web_propia: number;
  web_problemas: number;
  con_telefono: number;
  con_correo: number;
  do_not_contact: number;
}

export interface ScanCell {
  id: number;
  cell_index: number;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  status: ScanStatus;
  items_found: number;
  error_message?: string;
  executed_at?: string;
}

export interface ScanJob {
  id: number;
  district_id?: number;
  district_name: string;
  categories_selected: string[];
  source_name: string;
  grid_size_km: number;
  total_cells: number;
  completed_cells: number;
  found_count: number;
  new_count: number;
  status: ScanStatus;
  error_message?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
  cells?: ScanCell[];
}
