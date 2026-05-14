export const formatCurrency = (value) => {
  if (value == null) return "-";

  const num = typeof value === "bigint" ? Number(value) : value;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};
