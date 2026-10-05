import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, calculateInstallments } from '../utils/calculator';
import { exportCatalogToExcel, parseUploadedExcel } from '../utils/excelHelper';
import ProductFormModal from './ProductFormModal';
import {
  Package,
  Plus,
  Percent,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Database,
  Cloud
} from 'lucide-react';

export default function AdminPanel() {
  const {
    products,
    commissionSettings,
    updateProduct,
    deleteProduct,
    updateCommissionSettings,
    resetToDefaults,
    importProducts,
    showToast,
    dbStatus,
    isSyncing,
    syncWithNeon
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('inventory'); // 'inventory' | 'rates' | 'excel'
  const [adminSearch, setAdminSearch] = useState('');
  const [editingModalProduct, setEditingModalProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Estado local para edición de tasas
  const [tempRates, setTempRates] = useState(() => ({
    baseRate: commissionSettings.baseRate * 100, // En porcentaje 6%
    terms: commissionSettings.terms.map(t => ({
      ...t,
      ratePercent: Math.round(t.rate * 1000) / 10
    }))
  }));

  // Simulación de ejemplo
  const simPrice = 1000;
  const currentCommissionSim = calculateInstallments(simPrice, commissionSettings);

  // Filtro de productos en admin
  const filteredAdminProducts = products.filter(p => {
    if (!adminSearch.trim()) return true;
    const s = adminSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(s) ||
      (p.brand || '').toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s) ||
      (p.code || '').toLowerCase().includes(s)
    );
  });

  // Guardar configuración de tasas
  const handleSaveRates = (e) => {
    e.preventDefault();
    const newSettings = {
      baseRate: Number(tempRates.baseRate) / 100,
      terms: tempRates.terms.map(t => ({
        months: t.months,
        rate: Number(t.ratePercent) / 100,
        label: `${t.months} Meses`
      }))
    };
    updateCommissionSettings(newSettings);
  };

  // Manejar importación de Excel
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseUploadedExcel(file);
      if (window.confirm(`Se detectaron ${result.total} productos en el archivo "${file.name}". ¿Deseas reemplazar el catálogo completo (Aceptar) o agregarlos al existente (Cancelar)?`)) {
        importProducts(result.products, 'replace');
      } else {
        importProducts(result.products, 'merge');
      }
    } catch (err) {
      console.error(err);
      alert('Error al leer el archivo Excel: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
            <Package className="w-4 h-4 text-blue-400" />
            <span>Total Catálogo</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {products.length}
          </div>
          <span className="text-[11px] text-slate-500">modelos cargados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Con Stock</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {products.filter(p => p.stock > 0).length}
          </div>
          <span className="text-[11px] text-slate-500">disponibles hoy</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Marcas</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {new Set(products.map(p => p.brand).filter(Boolean)).size}
          </div>
          <span className="text-[11px] text-slate-500">categorías activas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
            <Percent className="w-4 h-4 text-amber-400" />
            <span>Tasa Base</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {Math.round(commissionSettings.baseRate * 100)}%
          </div>
          <span className="text-[11px] text-slate-500">+ margen por plazo</span>
        </div>
      </div>

      {/* Estado de Sincronización en la Nube con Neon Serverless Postgres */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        dbStatus === 'online'
          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            dbStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                Base de Datos Neon Postgres:
              </span>
              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                dbStatus === 'online'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {dbStatus === 'online' ? '● En Línea (Sincronizado)' : 'Modo Local / Desconectado'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dbStatus === 'online'
                ? 'Los cambios se guardan en la nube y se reflejan automáticamente en todos los dispositivos conectados.'
                : 'Configura la variable DATABASE_URL en Vercel para sincronización automática multi-dispositivo en tiempo real.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => syncWithNeon(false)}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors whitespace-nowrap self-end sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
        </button>
      </div>

      {/* Navegación interna del panel Admin */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveAdminTab('inventory')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeAdminTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Inventario & Precios
          </button>
          <button
            onClick={() => setActiveAdminTab('rates')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeAdminTab === 'rates'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tasas de Financiamiento
          </button>
          <button
            onClick={() => setActiveAdminTab('excel')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeAdminTab === 'excel'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Importar / Exportar
          </button>
        </div>

        {activeAdminTab === 'inventory' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Modelo</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        )}
      </div>

      {/* PESTAÑA 1: INVENTARIO Y PRECIOS */}
      {activeAdminTab === 'inventory' && (
        <div className="space-y-3">
          {/* Buscador dentro de la tabla */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Filtrar por nombre, modelo, marca o código..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 text-white text-xs sm:text-sm rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Tabla de Productos con edición en línea */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800/90 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Producto / Modelo</th>
                  <th className="py-3 px-2 sm:px-3">Marca</th>
                  <th className="py-3 px-2 sm:px-3">Categoría</th>
                  <th className="py-3 px-2 sm:px-3 text-right">Precio Efectivo ($)</th>
                  <th className="py-3 px-2 sm:px-3 text-center">Stock</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAdminProducts.slice(0, 100).map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 sm:px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white leading-tight">{p.name}</span>
                        {(p.condition === 'USADO' || p.name?.includes('(USADO)')) ? (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">
                            USADO 95-100%
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                            NUEVO
                          </span>
                        )}
                      </div>
                      {p.code && <div className="text-[10px] text-slate-500 font-mono">{p.code}</div>}
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-slate-300 font-medium">
                      {p.brand}
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-slate-400 text-xs">
                      {p.category}
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-right">
                      {/* Input en línea para modificar precio al instante */}
                      <input
                        type="number"
                        step="0.01"
                        value={p.cashPrice}
                        onChange={(e) => updateProduct(p.id, { cashPrice: e.target.value })}
                        className="w-24 sm:w-28 text-right bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-center">
                      {/* Input en línea para modificar stock */}
                      <input
                        type="number"
                        min="0"
                        value={p.stock}
                        onChange={(e) => updateProduct(p.id, { stock: e.target.value })}
                        className="w-14 sm:w-16 text-center bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-medium focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingModalProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Editar detalles completos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar "${p.name}"?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAdminProducts.length > 100 && (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-900 border-t border-slate-800">
                Mostrando los primeros 100 de {filteredAdminProducts.length} productos. Usa el buscador para filtrar uno específico.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: TASAS Y COMISIONES */}
      {activeAdminTab === 'rates' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-400" />
              Configuración de Tasas y Márgenes de Financiamiento
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Estos valores determinan la fórmula de CUADRO COMISION:{' '}
              <code className="text-emerald-400 font-mono">
                Total = Efectivo * (1 + TasaBase + TasaPlazo)
              </code>
            </p>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-5">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 max-w-xl">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Comisión Base General (Recargo 1 pago tarjeta / base cuotas):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={tempRates.baseRate}
                  onChange={(e) => setTempRates({ ...tempRates, baseRate: e.target.value })}
                  className="w-32 px-3 py-2 bg-slate-900 text-white font-bold text-base rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none"
                />
                <span className="text-sm font-bold text-slate-400">%</span>
                <span className="text-xs text-slate-400 ml-2">
                  (Se aplica al pago con tarjeta en 1 exhibición y como tasa base en cuotas)
                </span>
              </div>
            </div>

            {/* Tasas individuales por plazo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Margen adicional por plazo de financiamiento:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {tempRates.terms.map((t, idx) => (
                  <div key={t.months} className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-xs font-bold text-white block mb-1">
                      {t.months} Meses
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={t.ratePercent}
                        onChange={(e) => {
                          const updated = [...tempRates.terms];
                          updated[idx] = { ...updated[idx], ratePercent: e.target.value };
                          setTempRates({ ...tempRates, terms: updated });
                        }}
                        className="w-24 px-2.5 py-1.5 bg-slate-900 text-amber-400 font-bold rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none text-sm"
                      />
                      <span className="text-xs text-slate-400 font-medium">%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Tasa total: {(Number(tempRates.baseRate) + Number(t.ratePercent)).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              Guardar y Aplicar Nuevas Tasas
            </button>
          </form>

          {/* Simulación en vivo */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Vista previa en tiempo real (Ejemplo con producto de $1,000.00):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {currentCommissionSim.breakdown.map(item => (
                <div key={item.months} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400 font-medium">{item.label}</div>
                  <div className="text-amber-400 font-black text-sm">{formatCurrency(item.monthlyFee)}/mes</div>
                  <div className="text-[10px] text-slate-500">Total: {formatCurrency(item.grandTotal)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: IMPORTAR / EXPORTAR EXCEL */}
      {activeAdminTab === 'excel' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Exportar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Exportar Catálogo a Excel
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Descarga un archivo <code className="text-emerald-400">.xlsx</code> con todos los modelos, precios en efectivo, stock y variantes actualmente guardados en el sistema.
              </p>
            </div>
            <button
              onClick={() => exportCatalogToExcel(products)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Inventario (.xlsx)</span>
            </button>
          </div>

          {/* Importar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Importar Lista de Precios
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Carga un archivo Excel (.xlsx o .csv). El sistema detectará automáticamente las columnas de Producto, Precio, Marca, Categoría y Stock.
              </p>
            </div>
            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Seleccionar Archivo Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Restablecer Datos */}
          <div className="sm:col-span-2 bg-rose-950/20 border border-rose-900/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Restablecer a Datos Originales de Google Drive
                </h4>
                <p className="text-xs text-rose-300/80">
                  Si deseas volver al estado inicial del archivo PRECIOS_WAPS.xlsx y CUADRO COMISION, puedes restablecerlo con un clic.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('¿Seguro que deseas reiniciar todos los productos y tasas a los originales de Google Drive? Se borrarán modificaciones manuales.')) {
                  resetToDefaults();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold border border-rose-500/40 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer Todo</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal para Agregar Nuevo Producto */}
      {isAddModalOpen && (
        <ProductFormModal
          product={null}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Modal para Editar Producto */}
      {editingModalProduct && (
        <ProductFormModal
          product={editingModalProduct}
          onClose={() => setEditingModalProduct(null)}
        />
      )}
    </div>
  );
}
