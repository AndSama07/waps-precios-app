export const DEFAULT_COMMISSION = {
  baseRate: 0.06, // 6% comisión base (se aplica a 1 pago con tarjeta y a las cuotas)
  terms: [
    { months: 3, rate: 0.025, label: '3 Meses' },
    { months: 6, rate: 0.040, label: '6 Meses' },
    { months: 9, rate: 0.060, label: '9 Meses' },
    { months: 12, rate: 0.080, label: '12 Meses' },
    { months: 18, rate: 0.120, label: '18 Meses' },
    { months: 24, rate: 0.160, label: '24 Meses' },
    { months: 36, rate: 0.240, label: '36 Meses' }
  ]
};

/**
 * Calcula el desglose de precios y cuotas:
 * 1. Efectivo / Transferencia: Precio base de lista (0% recargo).
 * 2. Tarjeta / Otros métodos (1 solo pago): Precio con recargo base del 6% (Efectivo * (1 + BaseRate)).
 * 3. Cuotas con Tarjeta: Según CUADRO COMISION (Efectivo * (1 + BaseRate + TermRate) / Meses).
 */
export function calculateInstallments(cashPrice, commissionSettings = DEFAULT_COMMISSION, downPayment = 0) {
  const price = Math.max(0, Number(cashPrice) || 0);
  const down = Math.min(price, Math.max(0, Number(downPayment) || 0));
  const financedAmount = price - down;

  const baseRate = commissionSettings?.baseRate ?? DEFAULT_COMMISSION.baseRate;
  const termsList = commissionSettings?.terms ?? DEFAULT_COMMISSION.terms;

  // 1 Solo Pago con Tarjeta / Otros métodos (Recargo base del 6%)
  const cardSingleMultiplier = 1 + baseRate;
  const cardSingleTotal = Math.round(price * cardSingleMultiplier * 100) / 100;
  const cardSingleSurcharge = Math.round((cardSingleTotal - price) * 100) / 100;

  // Cuotas con Tarjeta (CUADRO COMISION)
  const breakdown = termsList.map(term => {
    const termRate = term.rate;
    const totalRate = baseRate + termRate;
    const multiplier = 1 + totalRate;
    const financedTotal = financedAmount * multiplier;
    const grandTotal = down + financedTotal;
    const monthlyFee = financedTotal / term.months;

    return {
      months: term.months,
      label: term.label || `${term.months} Meses`,
      termRate,
      effectiveRatePercent: Math.round(totalRate * 1000) / 10, // ej. 8.5%, 14.0%
      multiplier,
      financedAmount,
      financedTotal: Math.round(financedTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      monthlyFee: Math.round(monthlyFee * 100) / 100
    };
  });

  return {
    cashPrice: price,
    downPayment: down,
    financedAmount,
    baseRatePercent: Math.round(baseRate * 1000) / 10,
    cardSingleTotal,
    cardSingleSurcharge,
    cardSingleMultiplier,
    breakdown
  };
}

/**
 * Formato de moneda en Dólares ($USD)
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Genera el mensaje formateado para enviar la cotización por WhatsApp
 * Soporta selección individual o múltiple de cuotas
 */
export function generateWhatsAppMessage(
  product,
  selectedGrade = null,
  downPayment = 0,
  commissionSettings = DEFAULT_COMMISSION,
  options = {}
) {
  const {
    selectedMonths = [], // Array de meses seleccionados (ej: [12] o [6, 12, 24]). Si está vacío, muestra todos.
    includeCash = true,
    includeCardSingle = true
  } = options;

  const price = selectedGrade ? (product.variants?.[selectedGrade] || product.cashPrice) : product.cashPrice;
  const gradeLabel = {
    newPrice: 'NUEVO SELLADO',
    used95_100: 'USADO (Grado A 95%-100%)',
    used90_94: 'USADO (Grado B 90%-94%)',
    used85_89: 'USADO (Grado C 85%-89%)',
    tradeIn: 'TRADE-IN'
  }[selectedGrade] || (product.sourceSheet === 'WAPS' && product.variants?.newPrice ? 'NUEVO' : '');

  const calculation = calculateInstallments(price, commissionSettings, downPayment);

  let message = `*WAPS STORE - COTIZACIÓN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📦 *Producto:* ${product.name}\n`;
  if (product.brand) message += `🏷️ *Marca:* ${product.brand}\n`;
  if (gradeLabel) message += `✨ *Condición:* ${gradeLabel}\n`;

  // Métodos de 1 solo pago
  message += `\n💵 *PAGO DE CONTADO / 1 SOLO PAGO:*\n`;
  if (includeCash) {
    message += `• *Efectivo o Transferencia:* ${formatCurrency(price)}\n`;
  }
  if (includeCardSingle) {
    message += `• *Tarjeta u otro método (1 pago +${calculation.baseRatePercent}%):* ${formatCurrency(calculation.cardSingleTotal)}\n`;
  }

  // Anticipo / Prima si aplica
  if (downPayment > 0) {
    message += `\n💵 *Prima / Anticipo en efectivo:* ${formatCurrency(downPayment)}\n`;
    message += `💳 *Saldo a financiar con tarjeta:* ${formatCurrency(calculation.financedAmount)}\n`;
  }

  // Filtrar las cuotas a las que el vendedor haya seleccionado
  const termsToShow = selectedMonths && selectedMonths.length > 0
    ? calculation.breakdown.filter(t => selectedMonths.includes(t.months))
    : calculation.breakdown;

  if (termsToShow.length > 0) {
    const isFiltered = selectedMonths && selectedMonths.length > 0;
    message += `\n💳 *PLANES EN CUOTAS CON TARJETA${isFiltered ? ' SELECCIONADOS' : ''}:*\n`;
    termsToShow.forEach(item => {
      message += `• *${item.label}:* ${item.months} cuotas de *${formatCurrency(item.monthlyFee)}*`;
      if (downPayment > 0) {
        message += ` (Total financiado: ${formatCurrency(item.grandTotal)})\n`;
      } else {
        message += ` (Total: ${formatCurrency(item.grandTotal)})\n`;
      }
    });
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_Cotización válida por tiempo limitado y sujeta a disponibilidad de inventario._\n`;
  message += `¿Deseas apartar tu equipo o tienes alguna consulta? ¡Con gusto te atendemos!`;

  return message;
}
