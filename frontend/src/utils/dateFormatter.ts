export const toApiDate = (date: Date): string =>
  date.toISOString().split('T')[0];

export const formatDisplayDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};
