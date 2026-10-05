import React from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from './ProductCard';
import { Filter, SlidersHorizontal, CheckCircle2, PackageX, Sparkles, ChevronRight } from 'lucide-react';

export default function CatalogView() {
  const {
    filteredProducts,
    categories,
    brands,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedTerm,
    setSelectedTerm,
    inStockOnly,
    setInStockOnly,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    selectedProduct
  } = useApp();

  const terms = [
    { value: 0, label: 'Solo Efectivo' },
    { value: 3, label: '3 Meses' },
    { value: 6, label: '6 Meses' },
    { value: 9, label: '9 Meses' },
    { value: 12, label: '12 Meses' },
    { value: 18, label: '18 Meses' },
    { value: 24, label: '24 Meses' },
    { value: 36, label: '36 Meses' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Barra de Plazos Rápidos de Cotización */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Calculador rápido en tarjeta:
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Elige el plazo para ver las cuotas al instante
          </span>
        </div>

        {/* Chips de Plazo scrollable en móviles */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {terms.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedTerm(t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                selectedTerm === t.value
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Filtros: Categorías, Marcas, Stock y Orden */}
      <div className="space-y-2.5">
        {/* Categorías (Chips scrollables) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const isAll = cat === 'ALL';
            const label = isAll ? 'Todas las Categorías' : cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Fila secundaria: Marcas, Stock y Orden */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80 text-xs">
          {/* Marcas selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium hidden sm:inline">Marca:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-800 text-white px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="ALL">Todas las Marcas ({brands.length - 1})</option>
              {brands.filter(b => b !== 'ALL').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Toggle solo en stock */}
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-colors ${
                inStockOnly
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Solo en Stock</span>
            </button>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 text-white px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="stock-desc">Mayor Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Productos (Adaptable Celular 1-col, Tablet 2-3 col, Desktop 3-4 col) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProduct?.id === product.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-900/60 rounded-3xl border border-slate-800">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
            <PackageX className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No se encontraron productos</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No hay artículos que coincidan con los filtros o la búsqueda actual "{searchTerm}".
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
              setSelectedBrand('ALL');
              setInStockOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 transition-colors"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </div>
  );
}
