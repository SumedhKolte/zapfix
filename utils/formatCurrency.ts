export const formatCurrency = (paise: number) => {
  const value = paise / 100;
  return `₹${value.toLocaleString('en-IN')}`;
};

// Display an estimate as a single value when min and max are equal (the new
// deterministic-pricing default), or as a range when they actually differ
// (legacy bookings, edited estimates).
export const formatCostEstimate = (
  min: number | null | undefined,
  max: number | null | undefined
): string | null => {
  if (!min || !max) return null;
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
};
