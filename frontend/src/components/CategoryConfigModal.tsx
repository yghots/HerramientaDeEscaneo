import React, { useState } from 'react';
import { Category } from '../types';
import { api } from '../api/client';
import { Settings2, Plus, Store, Tag, Check, AlertCircle } from 'lucide-react';

interface CategoryConfigModalProps {
  categories: Category[];
  onCategoryAdded: () => void;
}

export const CategoryConfigModal: React.FC<CategoryConfigModalProps> = ({
  categories,
  onCategoryAdded
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [osmKey, setOsmKey] = useState('shop');
  const [osmValues, setOsmValues] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Por favor indica un nombre y slug para la categoría');
      return;
    }

    const valuesList = osmValues
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    if (valuesList.length === 0) {
      setError('Por favor añade al menos un valor de etiqueta OSM (ej. bakery, pastry)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createCategory({
        slug,
        name,
        description: description.trim() || undefined,
        osm_tags: {
          [osmKey]: valuesList
        }
      });
      setName('');
      setSlug('');
      setDescription('');
      setOsmValues('');
      setShowAddForm(false);
      onCategoryAdded();
    } catch (err: any) {
      setError(err.message || 'Error al crear categoría');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-brand-900" />
            <span>Categorías Comerciales y Mapeo OSM</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Configuración del mapeo entre categorías de negocios de Lima y etiquetas de OpenStreetMap (amenity, shop, leisure, craft).
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancelar' : 'Añadir Nueva Categoría'}</span>
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <form onSubmit={handleCreateCategory} className="bg-white p-5 rounded-2xl border border-brand-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Añadir Nueva Categoría Comercial</h3>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Comercial</label>
              <input
                type="text"
                placeholder="Ejemplo: Salones de Masajes y Spa"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug Interno</label>
              <input
                type="text"
                placeholder="salones-masajes-spa"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Descripción breve para la interfaz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* OSM Tag mapping */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mapeo de Etiquetas OpenStreetMap (OSM)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Clave OSM (Key)</label>
                <select
                  value={osmKey}
                  onChange={(e) => setOsmKey(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                >
                  <option value="shop">shop (Tiendas/Comercios)</option>
                  <option value="amenity">amenity (Servicios/Restaurantes/Salud)</option>
                  <option value="leisure">leisure (Gimnasios/Deporte/Ocio)</option>
                  <option value="craft">craft (Talleres/Oficios)</option>
                  <option value="tourism">tourism (Hoteles/Alojamientos)</option>
                  <option value="office">office (Oficinas/Consultorías)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-600 mb-1">Valores OSM (separados por coma)</label>
                <input
                  type="text"
                  placeholder="ej. massage, spa, beauty"
                  value={osmValues}
                  onChange={(e) => setOsmValues(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold bg-brand-900 text-white rounded-lg hover:bg-brand-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Categoría'}
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-900" />
                {c.name}
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {c.business_count || 0} neg.
              </span>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2">{c.description || 'Sin descripción'}</p>

            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded">
              {Object.entries(c.osm_tags).map(([key, vals]) => (
                <div key={key}>
                  <strong className="text-slate-800">{key}:</strong>{' '}
                  {Array.isArray(vals) ? vals.join(', ') : String(vals)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
