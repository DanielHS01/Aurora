/**
 * Formato "DD/MM/YYYY : HH:MM:SS" en 24 horas — usado en facturas y en
 * la tabla de facturas, para no depender del formato de 12h/localizado
 * de toLocaleString.
 */
export function formatDateTimeCO(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';

  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year} : ${hours}:${minutes}:${seconds}`;
}