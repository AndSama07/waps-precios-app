import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, Calculator, Shield, Sparkles, X, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    dbStatus,
    isSyncing,
    syncWithNeon
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Fila superior: Logo y pestañas */}
        <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3">
          {/* Logo y marca */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('catalog')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="font-black text-slate-950 text-base sm:text-lg tracking-wider">W</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  WAPS STORE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Precios & Cuotas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Consulta ultrarrápida y cotizador oficial
              </p>
            </div>
          </div>

          {/* Selector de Modos: Cotizador / Admin y Estado DB */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => syncWithNeon(false)}
              disabled={isSyncing}
              title={dbStatus === 'online' ? 'Neon DB Conectado (Clic para sincronizar)' : 'Modo local (Clic para reintentar conexión con Neon)'}
              className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs transition-colors ${
                dbStatus === 'online'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="text-[11px] font-semibold">
                {dbStatus === 'online' ? 'Neon' : 'Local'}
              </span>
            </button>

            <div className="flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/60 shadow-inner">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'catalog'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Cotizador</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Administrador</span>
              </button>
            </div>
          </div>
        </div>

        {/* Buscador interactivo */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar iPhone, JBL, DJI, PS5, iPad, MacBook, modelo, marca o código..."
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-100 placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/70"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          {searchTerm && (
            <div className="absolute right-12 top-2.5 text-[11px] text-emerald-400 font-medium hidden sm:block">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
