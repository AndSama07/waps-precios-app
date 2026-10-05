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
  const remainingAmount = price - down; // Saldo que se pagará con otro método / tarjeta

  const baseRate = commissionSettings?.baseRate ?? DEFAULT_COMMISSION.baseRate;
  const termsList = commissionSettings?.terms ?? DEFAULT_COMMISSION.terms;

  // 1 Solo Pago con Tarjeta / Otros métodos
  // Si hay adelanto/pago mixto, el recargo del 6% se calcula EXCLUSIVAMENTE sobre el saldo restante:
  const cardSingleMultiplier = 1 + baseRate;
  const cardSingleSurcharge = Math.round(remainingAmount * baseRate * 100) / 100;
  const cardSingleRemainingTotal = Math.round(remainingAmount * cardSingleMultiplier * 100) / 100;
  const cardSingleGrandTotal = Math.round((down + cardSingleRemainingTotal) * 100) / 100;

  // Cuotas con Tarjeta (CUADRO COMISION)
  // Las cuotas y el margen de plazo se calculan estrictamente sobre el saldo restante:
  const breakdown = termsList.map(term => {
    const termRate = term.rate;
    const totalRate = baseRate + termRate;
    const multiplier = 1 + totalRate;
    const financedTotal = Math.round(remainingAmount * multiplier * 100) / 100;
    const grandTotal = Math.round((down + financedTotal) * 100) / 100;
    const monthlyFee = Math.round((financedTotal / term.months) * 100) / 100;

    return {
      months: term.months,
      label: term.label || `${term.months} Meses`,
      termRate,
      effectiveRatePercent: Math.round(totalRate * 1000) / 10, // ej. 8.5%, 14.0%
      multiplier,
      financedAmount: remainingAmount,
      financedTotal,
      grandTotal,
      monthlyFee
    };
  });

  return {
    cashPrice: price,
    downPayment: down,
    financedAmount: remainingAmount,
    remainingAmount,
    baseRatePercent: Math.round(baseRate * 1000) / 10,
    cardSingleTotal: cardSingleRemainingTotal,
    cardSingleGrandTotal,
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

  const price = product.cashPrice;
  const isUsed = product.condition === 'USADO' || (product.name && product.name.includes('(USADO)'));
  const gradeLabel = isUsed ? 'USADO (Grado A 95%-100%)' : 'NUEVO SELLADO';

  const calculation = calculateInstallments(price, commissionSettings, downPayment);

  let message = `*WAPS STORE - COTIZACIÓN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📦 *Producto:* ${product.name}\n`;
  if (product.brand) message += `🏷️ *Marca:* ${product.brand}\n`;
  if (gradeLabel) message += `✨ *Condición:* ${gradeLabel}\n`;

  // Si hay adelanto o pago mixto
  if (downPayment > 0) {
    message += `💰 *Precio Total (Contado):* ${formatCurrency(price)}\n`;
    message += `\n💵 *PAGO MIXTO / ADELANTO:*\n`;
    message += `• *Adelanto Efectivo / Transferencia:* ${formatCurrency(downPayment)} (0% recargo)\n`;
    message += `• *Saldo restante a cancelar con otro método:* ${formatCurrency(calculation.remainingAmount)}\n`;

    if (includeCardSingle) {
      message += `\n💳 *SALDO RESTANTE EN 1 SOLO PAGO:*\n`;
      message += `• *Tarjeta u otro método 1 pago:* ${formatCurrency(calculation.cardSingleTotal)} (Total con adelanto: ${formatCurrency(calculation.cardSingleGrandTotal)})\n`;
    }
  } else {
    // Métodos de 1 solo pago normal
    message += `\n💵 *PAGO DE CONTADO / 1 SOLO PAGO:*\n`;
    if (includeCash) {
      message += `• *Efectivo o Transferencia:* ${formatCurrency(price)}\n`;
    }
    if (includeCardSingle) {
      message += `• *Tarjeta u otro método 1 pago:* ${formatCurrency(calculation.cardSingleTotal)}\n`;
    }
  }

  // Filtrar las cuotas a las que el vendedor haya seleccionado
  const termsToShow = selectedMonths && selectedMonths.length > 0
    ? calculation.breakdown.filter(t => selectedMonths.includes(t.months))
    : calculation.breakdown;

  if (termsToShow.length > 0) {
    const isFiltered = selectedMonths && selectedMonths.length > 0;
    if (downPayment > 0) {
      message += `\n💳 *PLANES EN CUOTAS CON TARJETA (Calculadas sobre saldo de ${formatCurrency(calculation.remainingAmount)})${isFiltered ? ' SELECCIONADOS' : ''}:*\n`;
      termsToShow.forEach(item => {
        message += `• *${item.label}:* ${item.months} cuotas de *${formatCurrency(item.monthlyFee)}*`;
        message += ` (Financiado saldo: ${formatCurrency(item.financedTotal)} | Total con adelanto: ${formatCurrency(item.grandTotal)})\n`;
      });
    } else {
      message += `\n💳 *PLANES EN CUOTAS CON TARJETA${isFiltered ? ' SELECCIONADOS' : ''}:*\n`;
      termsToShow.forEach(item => {
        message += `• *${item.label}:* ${item.months} cuotas de *${formatCurrency(item.monthlyFee)}*`;
        message += ` (Total: ${formatCurrency(item.grandTotal)})\n`;
      });
    }
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_Cotización válida por tiempo limitado y sujeta a disponibilidad de inventario._\n`;
  message += `¿Deseas apartar tu equipo o tienes alguna consulta? ¡Con gusto te atendemos!`;

  return message;
}
