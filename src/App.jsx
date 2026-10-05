import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import CatalogView from './components/CatalogView';
import AdminPanel from './components/AdminPanel';
import ProductDetailModal from './components/ProductDetailModal';
import Toast from './components/Toast';
import { Smartphone, Tablet, ShieldCheck, CheckCircle2 } from 'lucide-react';

function MainLayout() {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 pb-16">
        {activeTab === 'catalog' ? <CatalogView /> : <AdminPanel />}
      </main>

      {/* Modal de Cotización interactivo */}
      <ProductDetailModal />

      {/* Sistema de Notificaciones Toast */}
      <Toast />

      {/* Pie de página informativo */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>WAPS Store & Cotizador • Optimizado para Android, iPhone, iPad y PC</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Fórmulas exactas según CUADRO COMISION (3 a 36 Meses)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
