import { format } from 'date-fns';

export const formatDate = (value: string | Date, dateFormat = 'dd MMM yyyy') => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return format(date, dateFormat);
};
