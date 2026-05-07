export const formatCurrency = (paise: number) => {
  const value = paise / 100;
  return `₹${value.toLocaleString('en-IN')}`;
};
