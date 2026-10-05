import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { calculateInstallments, formatCurrency, generateWhatsAppMessage } from '../utils/calculator';
import {
  X,
  Share2,
  ExternalLink,
  Calculator,
  DollarSign,
  Check,
  Percent,
  CreditCard,
  Banknote,
  CheckSquare,
  Square,
  Eye,
  Copy
} from 'lucide-react';
import { WhatsAppIcon, MessengerIcon, InstagramIcon } from './SocialIcons';

export default function ProductDetailModal() {
  const {
    selectedProduct,
    setSelectedProduct,
    commissionSettings,
    selectedTerm,
    showToast
  } = useApp();

  const [downPayment, setDownPayment] = useState(0);

  // Selección individual o múltiple de cuotas para la cotización
  const [selectedMonths, setSelectedMonths] = useState(() => {
    // Si viene un plazo preseleccionado en el catálogo mayor a 0, lo seleccionamos por defecto
    if (selectedTerm && selectedTerm > 0) return [selectedTerm];
    return [3, 6, 9, 12, 18, 24, 36];
  });

  const [includeCash, setIncludeCash] = useState(true);
  const [includeCardSingle, setIncludeCardSingle] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Actualizar estado cuando cambie el producto seleccionado
  useEffect(() => {
    if (selectedProduct) {
      setDownPayment(0);
      if (selectedTerm && selectedTerm > 0) {
        setSelectedMonths([selectedTerm]);
      } else {
        setSelectedMonths([3, 6, 9, 12, 18, 24, 36]);
      }
    }
  }, [selectedProduct, selectedTerm]);

  if (!selectedProduct) return null;

  const isUsed = selectedProduct.condition === 'USADO' || (selectedProduct.name && selectedProduct.name.includes('(USADO)'));
  const currentCashPrice = selectedProduct.cashPrice || 0;
  const calculation = calculateInstallments(currentCashPrice, commissionSettings, downPayment);

  // Manejar selección/deselección de plazos
  const toggleMonth = (month) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month].sort((a, b) => a - b);
      }
    });
  };

  const selectAllMonths = () => {
    setSelectedMonths(calculation.breakdown.map(t => t.months));
  };

  const deselectAllMonths = () => {
    setSelectedMonths([]);
  };

  const selectSingleMonth = (month) => {
    setSelectedMonths([month]);
  };

  // Opciones de mensaje
  const messageOptions = {
    selectedMonths,
    includeCash,
    includeCardSingle
  };

  const formattedWhatsAppMsg = generateWhatsAppMessage(
    selectedProduct,
    isUsed ? 'used95_100' : 'newPrice',
    downPayment,
    commissionSettings,
    messageOptions
  );

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(formattedWhatsAppMsg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleShareMessenger = () => {
    navigator.clipboard.writeText(formattedWhatsAppMsg);
    showToast('¡Cotización copiada! Pégala en el chat de Messenger');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    window.open(isMobile ? 'https://m.me/' : 'https://www.messenger.com/', '_blank');
  };

  const handleShareInstagram = () => {
    navigator.clipboard.writeText(formattedWhatsAppMsg);
    showToast('¡Cotización copiada! Pégala en el chat de Instagram');
    window.open('https://www.instagram.com/direct/inbox/', '_blank');
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(formattedWhatsAppMsg);
    showToast('Cotización personalizada copiada al portapapeles');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setSelectedProduct(null)}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-3 sticky top-0 z-10 backdrop-blur">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {selectedProduct.brand || 'WAPS'}
              </span>
              <span className="text-xs text-slate-400">
                {selectedProduct.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {selectedProduct.name}
            </h2>
          </div>

          <button
            onClick={() => setSelectedProduct(null)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Banner de Condición del Producto */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isUsed
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full shrink-0 ${isUsed ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <div>
                <span className="text-xs sm:text-sm uppercase tracking-wider font-extrabold block">
                  {isUsed ? '📱 Equipo Usado (Grado A 95% - 100%)' : '✨ Equipo Nuevo Sellado'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isUsed ? 'Precio calculado exclusivamente para rango 95%-100%' : 'Garantía oficial completa'}
                </span>
              </div>
            </div>
            <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl uppercase tracking-wider border shrink-0 ${
              isUsed
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isUsed ? 'Usado 95-100%' : 'Nuevo'}
            </span>
          </div>

          {/* Simulador de Pago Mixto / Adelanto en Efectivo (Opcional) */}
          <div className="bg-gradient-to-br from-slate-850 to-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-500/40 shadow-lg relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Pago Mixto / Adelanto en Efectivo (Opcional)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Si el cliente abona una parte en efectivo/transferencia (0% recargo), el 6% y las cuotas se calculan <strong className="text-slate-200">únicamente sobre el saldo restante</strong>.
                </span>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider border ${
                  downPayment > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {downPayment > 0 ? `Adelanto: ${formatCurrency(downPayment)}` : '100% con otro método'}
                </span>
              </div>
            </div>

            {/* Input y botones rápidos */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-amber-400 font-bold" />
                  <input
                    type="number"
                    min="0"
                    max={currentCashPrice}
                    step="10"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(Math.min(currentCashPrice, Math.max(0, Number(e.target.value) || 0)))}
                    placeholder="Monto de adelanto (ej. 500)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 text-white font-bold rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none text-sm placeholder:text-slate-600 shadow-inner"
                  />
                </div>
                {downPayment > 0 && (
                  <button
                    type="button"
                    onClick={() => setDownPayment(0)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-xl border border-slate-700 font-bold transition-colors"
                  >
                    Limpiar ($0)
                  </button>
                )}
              </div>

              {/* Botones de porcentaje de adelanto rápido */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                  Atajos rápidos:
                </span>
                <button
                  type="button"
                  onClick={() => setDownPayment(Math.round(currentCashPrice * 0.25))}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-700 font-semibold transition-colors"
                >
                  25% ({formatCurrency(Math.round(currentCashPrice * 0.25))})
                </button>
                <button
                  type="button"
                  onClick={() => setDownPayment(Math.round(currentCashPrice * 0.50))}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-700 font-semibold transition-colors"
                >
                  50% ({formatCurrency(Math.round(currentCashPrice * 0.50))})
                </button>
                <button
                  type="button"
                  onClick={() => setDownPayment(Math.round(currentCashPrice * 0.75))}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-700 font-semibold transition-colors"
                >
                  75% ({formatCurrency(Math.round(currentCashPrice * 0.75))})
                </button>
              </div>

              {/* Resumen explicativo cuando hay adelanto */}
              {downPayment > 0 && (
                <div className="mt-2.5 p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                      Adelanto Efectivo / Transferencia:
                    </span>
                    <span className="font-extrabold text-emerald-400">
                      {formatCurrency(downPayment)} <span className="text-[10px] text-emerald-300 font-normal">(0% recargo)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      Saldo restante a cancelar con otro método:
                    </span>
                    <span className="font-extrabold text-blue-400">
                      {formatCurrency(calculation.remainingAmount)}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-300/90 font-medium flex items-center gap-1">
                    <span>💡</span>
                    <span>El 6% de recargo en un pago o comisiones en cuotas aplican <strong>solo sobre los {formatCurrency(calculation.remainingAmount)} restantes</strong>.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de Métodos de 1 Solo Pago (Efectivo vs Tarjeta +6%) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Efectivo / Transferencia */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-800 to-slate-850 p-4 rounded-2xl border border-emerald-500/40 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    Efectivo / Transferencia
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    0% Recargo
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {formatCurrency(currentCashPrice)}
                </div>
                {downPayment > 0 && (
                  <div className="text-[11px] text-slate-300 mt-1">
                    Adelanto: <strong className="text-emerald-400">{formatCurrency(downPayment)}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/40">
                <span className="text-[11px] text-slate-400">Precio base de lista</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeCash}
                    onChange={(e) => setIncludeCash(e.target.checked)}
                    className="rounded accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px]">Incluir en cotización</span>
                </label>
              </div>
            </div>

            {/* Tarjeta 1 solo pago */}
            <div className="bg-gradient-to-br from-blue-950/40 via-slate-800 to-slate-850 p-4 rounded-2xl border border-blue-500/40 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    Tarjeta u otro método 1 pago:
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded">
                    +{calculation.baseRatePercent}% Recargo
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-300 mt-1">
                  {formatCurrency(calculation.cardSingleTotal)}
                </div>
                {downPayment > 0 ? (
                  <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                    <div>
                      Recargo 6% al saldo ({formatCurrency(calculation.remainingAmount)}): <strong className="text-blue-300">+{formatCurrency(calculation.cardSingleSurcharge)}</strong>
                    </div>
                    <div className="text-amber-300 font-semibold">
                      Total compra combinada: {formatCurrency(calculation.cardSingleGrandTotal)}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 mt-1">
                    Recargo 6%: {formatCurrency(calculation.cardSingleSurcharge)}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/40">
                <span className="text-[11px] text-slate-400">
                  {downPayment > 0 ? 'Saldo en tarjeta' : '1 solo pago'}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeCardSingle}
                    onChange={(e) => setIncludeCardSingle(e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px]">Incluir en cotización</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección de Selección de Cuotas con Tarjeta */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  {downPayment > 0
                    ? `Planes en Cuotas con Tarjeta (Sobre Saldo de ${formatCurrency(calculation.remainingAmount)})`
                    : 'Planes de Cuotas con Tarjeta'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {downPayment > 0
                    ? `Las cuotas se calculan únicamente sobre los ${formatCurrency(calculation.remainingAmount)} restantes a financiar.`
                    : 'Selecciona la cuota deseada o marca varias para cotizarlas al cliente.'}
                </p>
              </div>

              {/* Controles de selección rápida */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={selectAllMonths}
                  className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-semibold"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => selectSingleMonth(12)}
                  className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-semibold"
                >
                  Solo 12M
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonths([12, 24])}
                  className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-semibold"
                >
                  12 y 24M
                </button>
                <button
                  type="button"
                  onClick={deselectAllMonths}
                  className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg border border-slate-700 font-semibold"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Aviso de selección activa */}
            <div className="mb-2 flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className="text-slate-300 font-medium">
                {selectedMonths.length === 0 ? (
                  <span className="text-rose-400 font-bold">Ninguna cuota seleccionada (no se incluirán cuotas)</span>
                ) : selectedMonths.length === 1 ? (
                  <span>
                    Cuota seleccionada para cotizar:{' '}
                    <strong className="text-amber-400">{selectedMonths[0]} Meses</strong>
                  </span>
                ) : (
                  <span>
                    Cuotas seleccionadas para cotizar:{' '}
                    <strong className="text-emerald-400">{selectedMonths.length} de {calculation.breakdown.length} plazos</strong> ({selectedMonths.join(', ')} meses)
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreview ? 'Ocultar vista previa' : 'Ver mensaje'}</span>
              </button>
            </div>

            {/* Vista previa en vivo del mensaje de WhatsApp (si está activada) */}
            {showPreview && (
              <div className="mb-3 p-3 bg-slate-950 rounded-2xl border border-emerald-500/30 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center justify-between font-sans">
                  <span>📱 VISTA PREVIA EXACTA DEL MENSAJE:</span>
                  <button
                    onClick={handleCopyQuote}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </div>
                {formattedWhatsAppMsg}
              </div>
            )}

            {/* Tabla interactiva de Cuotas con Checkboxes */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-900/60 shadow-inner">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-800/90 text-slate-300 text-[11px] uppercase tracking-wider border-b border-slate-700 font-semibold">
                    <th className="py-2.5 px-3 text-center w-10">Enviar</th>
                    <th className="py-2.5 px-3">Plazo</th>
                    <th className="py-2.5 px-2 text-center">Tasa Total</th>
                    <th className="py-2.5 px-2 text-right">
                      {downPayment > 0 ? 'Saldo Financiado' : 'Total Financiado'}
                    </th>
                    <th className="py-2.5 px-3 text-right">Cuota Mensual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {calculation.breakdown.map((item) => {
                    const isChecked = selectedMonths.includes(item.months);
                    return (
                      <tr
                        key={item.months}
                        onClick={() => toggleMonth(item.months)}
                        className={`cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                            : 'hover:bg-slate-800/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleMonth(item.months)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 font-bold text-white flex items-center gap-1.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                              isChecked
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.months}
                          </span>
                          <span className={isChecked ? 'text-white' : 'text-slate-400'}>
                            {item.label}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3 px-2 text-center text-slate-400">
                          {item.effectiveRatePercent}%
                        </td>
                        <td className="py-2.5 sm:py-3 px-2 text-right font-medium text-slate-300">
                          {downPayment > 0 ? (
                            <div>
                              <span className="font-bold text-emerald-400">{formatCurrency(item.financedTotal)}</span>
                              <span className="text-[10px] text-slate-400 block">Total: {formatCurrency(item.grandTotal)}</span>
                            </div>
                          ) : (
                            <span>{formatCurrency(item.grandTotal)}</span>
                          )}
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 text-right">
                          <span
                            className={`font-black text-sm sm:text-base ${
                              isChecked ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(item.monthlyFee)}
                          </span>
                          <span className="text-[10px] text-slate-500 block sm:inline sm:ml-1">/mes</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Fijas al Pie */}
        <div className="p-3.5 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            {selectedMonths.length > 0 ? (
              <span>
                Se incluirán <strong className="text-emerald-400">{selectedMonths.length} cuotas</strong> en la cotización.
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">
                Solo se incluirán los precios de contado (sin cuotas).
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-stretch sm:justify-end">
            <button
              onClick={handleCopyQuote}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all active:scale-95 shadow-sm"
              title="Copiar texto de cotización"
            >
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Copiar</span>
            </button>

            <button
              onClick={handleShareMessenger}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all active:scale-95 shadow-md shadow-blue-600/20"
              title="Enviar cotización por Messenger"
            >
              <MessengerIcon className="w-4 h-4" />
              <span>Messenger</span>
            </button>

            <button
              onClick={handleShareInstagram}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-semibold text-xs transition-all active:scale-95 shadow-md shadow-rose-500/20 hover:opacity-95"
              title="Enviar cotización por Instagram"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Instagram</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              title="Enviar cotización por WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
