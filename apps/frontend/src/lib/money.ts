const defaultLocale = "es-CL";
const defaultCurrency = "CLP";

export function formatMoney(
  cents: number,
  options?: { currency?: string; locale?: string }
): string {
  const locale = options?.locale ?? defaultLocale;
  const currency = options?.currency ?? defaultCurrency;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function parseMoneyInput(value: string): number {
  const cleaned = value.replace(/\D/g, "");
  return Number.parseInt(cleaned, 10) || 0;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
