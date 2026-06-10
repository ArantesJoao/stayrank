/** "$1,200 total · $300/person" — or null when there's no price. */
export function formatPrice(
  totalPrice: number | null | undefined,
  partySize: number,
): string | null {
  if (totalPrice == null) return null;
  const money = (n: number) =>
    `$${Math.round(n).toLocaleString("en-US")}`;
  const total = money(totalPrice);
  if (partySize <= 1) return `${total} total`;
  return `${total} total · ${money(totalPrice / partySize)}/person`;
}
