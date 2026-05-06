export function formatILS(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "₪—";
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}
