// Currencies offered when creating/editing a trip.
export const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar ($)" },
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "GBP", label: "GBP — British Pound (£)" },
  { code: "BRL", label: "BRL — Brazilian Real (R$)" },
  { code: "JPY", label: "JPY — Japanese Yen (¥)" },
  { code: "CAD", label: "CAD — Canadian Dollar (C$)" },
  { code: "AUD", label: "AUD — Australian Dollar (A$)" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "MXN", label: "MXN — Mexican Peso" },
  { code: "INR", label: "INR — Indian Rupee (₹)" },
] as const;

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch {
    // Unknown currency code — fall back to a plain number + code.
    return `${Math.round(amount).toLocaleString("en-US")} ${currency}`;
  }
}

/** "$1,200 total · $300/person" in the trip's currency — null when no price. */
export function formatPrice(
  totalPrice: number | null | undefined,
  partySize: number,
  currency: string,
): string | null {
  if (totalPrice == null) return null;
  const total = `${money(totalPrice, currency)} total`;
  if (partySize <= 1) return total;
  return `${total} · ${money(totalPrice / partySize, currency)}/person`;
}
