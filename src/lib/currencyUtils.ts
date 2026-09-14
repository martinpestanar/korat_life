/**
 * Utilidades monetarias para el mercado Latinoamericano / Perú (PEN S/ y USD $)
 * Tipo de cambio de referencia para mercado peruano (aprox. S/ 3.75 por $1 USD)
 */
export const USD_TO_PEN_EXCHANGE_RATE = 3.75;

export interface DualCurrency {
  pen: number;
  usd: number;
  penFormatted: string;
  usdFormatted: string;
}

/**
 * Convierte un monto (asumido en Soles PEN) a formato bimonetario S/ y USD.
 */
export function formatPenAndUsd(penAmount: number): DualCurrency {
  const safePen = Math.max(0, Number(penAmount) || 0);
  const usdAmount = safePen / USD_TO_PEN_EXCHANGE_RATE;

  return {
    pen: safePen,
    usd: Math.round(usdAmount),
    penFormatted: `S/ ${safePen.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    usdFormatted: `~$${Math.round(usdAmount).toLocaleString('en-US')} USD`
  };
}

/**
 * Convierte un monto en dólares (USD) a formato bimonetario S/ y USD.
 */
export function formatUsdAndPen(usdAmount: number): DualCurrency {
  const safeUsd = Math.max(0, Number(usdAmount) || 0);
  const penAmount = safeUsd * USD_TO_PEN_EXCHANGE_RATE;

  return {
    pen: Math.round(penAmount),
    usd: safeUsd,
    penFormatted: `S/ ${Math.round(penAmount).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    usdFormatted: `~$${safeUsd.toLocaleString('en-US')} USD`
  };
}
