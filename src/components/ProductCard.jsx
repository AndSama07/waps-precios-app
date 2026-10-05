import React from 'react';
import { useApp } from '../context/AppContext';
import { calculateInstallments, formatCurrency, generateWhatsAppMessage } from '../utils/calculator';
import {
  Smartphone,
  Headphones,
  Camera,
  Gamepad2,
  Laptop,
  Watch,
  Zap,
  Share2,
  ExternalLink,
  CreditCard,
  Banknote,
  Copy
} from 'lucide-react';
import { WhatsAppIcon, MessengerIcon, InstagramIcon } from './SocialIcons';

export default function ProductCard({ product, isSelected }) {
  const {
    commissionSettings,
    selectedTerm,
    setSelectedProduct,
    showToast
  } = useApp();

  const calculation = calculateInstallments(product.cashPrice, commissionSettings);
  const termItem = selectedTerm && selectedTerm > 0
    ? calculation.breakdown.find(b => b.months === Number(selectedTerm))
    : null;

  // Determinar icono por categoría/marca
  const getIcon = () => {
    const name = (product.name || '').toUpperCase();
    const cat = (product.category || '').toUpperCase();
    if (name.includes('IPHONE') || cat.includes('IPHONE')) return <Smartphone className="w-4 h-4 text-emerald-400" />;
    if (cat.includes('JBL') || name.includes('SPEAKER') || name.includes('BOCINA') || name.includes('AUDIFONOS')) return <Headphones className="w-4 h-4 text-orange-400" />;
    if (cat.includes('DJI') || name.includes('OSMO') || name.includes('DRONE') || name.includes('MIC')) return <Camera className="w-4 h-4 text-sky-400" />;
    if (name.includes('PS5') || name.includes('SWITCH') || name.includes('NINTENDO') || cat.includes('CONSOLAS')) return <Gamepad2 className="w-4 h-4 text-purple-400" />;
    if (name.includes('MACBOOK') || name.includes('LAPTOP') || name.includes('IPAD')) return <Laptop className="w-4 h-4 text-cyan-400" />;
    if (name.includes('WATCH')) return <Watch className="w-4 h-4 text-amber-400" />;
    return <Zap className="w-4 h-4 text-teal-400" />;
  };

  const getQuoteMessage = () => {
    const options = {
      selectedMonths: selectedTerm && selectedTerm > 0 ? [selectedTerm] : [],
      includeCash: true,
      includeCardSingle: true
    };
    return generateWhatsAppMessage(product, null, 0, commissionSettings, options);
  };

  const handleShareWhatsApp = (e) => {
    e.stopPropagation();
    const message = getQuoteMessage();
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleShareMessenger = (e) => {
    e.stopPropagation();
    const message = getQuoteMessage();
    navigator.clipboard.writeText(message);
    showToast('¡Cotización copiada! Pégala en el chat de Messenger');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    window.open(isMobile ? 'https://m.me/' : 'https://www.messenger.com/', '_blank');
  };

  const handleShareInstagram = (e) => {
    e.stopPropagation();
    const message = getQuoteMessage();
    navigator.clipboard.writeText(message);
    showToast('¡Cotización copiada! Pégala en el chat de Instagram');
    window.open('https://www.instagram.com/direct/inbox/', '_blank');
  };

  const handleCopyQuote = (e) => {
    e.stopPropagation();
    const message = getQuoteMessage();
    navigator.clipboard.writeText(message);
    showToast(`Cotización ${selectedTerm > 0 ? `(${selectedTerm}M)` : ''} copiada`);
  };

  const inStock = product.stock > 0;

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99] select-none ${
        isSelected
          ? 'bg-slate-800/90 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
          : 'bg-slate-850/80 hover:bg-slate-800/80 border-slate-700/60 hover:border-slate-600 shadow-md'
      }`}
    >
      {/* Encabezado: Marca y Stock */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="p-1 rounded-md bg-slate-800 border border-slate-700/60">
              {getIcon()}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              {product.brand || 'WAPS'}
            </span>
            {product.category && (
              <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40 truncate hidden sm:inline-block">
                {product.category.replace('JBL - ', '').replace('DJI - ', '')}
              </span>
            )}
          </div>

          {/* Badge de stock */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0 ${
              inStock
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {inStock ? `${product.stock} disp.` : 'Agotado'}
          </span>
        </div>

        {/* Nombre del Producto */}
        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>

        {/* Badge de Condición: NUEVO o USADO 95%-100% */}
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {(product.condition === 'USADO' || product.name?.includes('(USADO)')) ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Usado 95%-100%
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Nuevo
            </span>
          )}
        </div>
      </div>

      {/* Bloque de Precios y Cuotas */}
      <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
        {/* Efectivo / Transferencia */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            Efectivo / Transf:
          </span>
          <span className="text-base sm:text-lg font-extrabold text-emerald-400 tracking-tight">
            {formatCurrency(product.cashPrice)}
          </span>
        </div>

        {/* Tarjeta 1 solo pago */}
        <div className="flex items-baseline justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            Tarjeta u otro método 1 pago:
          </span>
          <span className="font-bold text-blue-300">
            {formatCurrency(calculation.cardSingleTotal)}
          </span>
        </div>

        {/* Desglose de Cuota del Plazo Seleccionado */}
        {termItem ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/90 rounded-xl p-2.5 border border-emerald-500/30 shadow-inner mt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
              <span>Plan {termItem.label}:</span>
              <span className="text-slate-400 font-normal">Total {formatCurrency(termItem.grandTotal)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Cuota con tarjeta:</span>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-amber-400">
                  {formatCurrency(termItem.monthlyFee)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium"> /mes</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-xl p-2 text-center text-xs text-slate-400 border border-slate-700/50">
            Toca para cotizar cuotas de 3 a 36M
          </div>
        )}

        {/* Botones de acción rápida: WhatsApp, Messenger, Instagram, Copiar */}
        <div className="mt-2.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Enviar por WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleShareMessenger}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95"
            title="Enviar por Messenger"
          >
            <MessengerIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShareInstagram}
            className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:opacity-90 transition-all active:scale-95"
            title="Enviar por Instagram"
          >
            <InstagramIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopyQuote}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
            title="Copiar cotización"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
