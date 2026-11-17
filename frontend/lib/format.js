export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTimestamp(value) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString();
}
