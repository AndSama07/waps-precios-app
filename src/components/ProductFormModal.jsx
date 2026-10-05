import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Save, Plus } from 'lucide-react';

export default function ProductFormModal({ product, onClose }) {
  const { addProduct, updateProduct, categories, brands } = useApp();

  const isEditing = Boolean(product);

  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || 'Apple',
    category: product?.category || 'IPHONE',
    cashPrice: product?.cashPrice || '',
    stock: product?.stock !== undefined ? product.stock : 10,
    code: product?.code || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isEditing) {
      updateProduct(product.id, formData);
    } else {
      addProduct(formData);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <h3 className="text-lg font-bold text-white">
            {isEditing ? 'Editar Producto / Modelo' : 'Agregar Nuevo Modelo'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nombre o Modelo del Producto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. iPhone 18 Pro Max 256GB"
              className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Marca y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Marca
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Apple, JBL, DJI, etc."
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="IPHONE, Bocina, etc."
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Precio Efectivo y Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Precio Efectivo ($USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.cashPrice}
                onChange={(e) => setFormData({ ...formData, cashPrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-800 text-emerald-400 font-bold rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Cantidad / Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Código / SKU */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Código / SKU / MPN (Opcional)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ej. MM111JBL60"
              className="w-full px-3 py-2 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Agregar al Catálogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
