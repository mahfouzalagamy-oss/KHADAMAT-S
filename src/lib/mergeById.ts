/** دمج مصفوفتين من عناصر لها id: نسخة الوارد تفوز، وما لم يرد يبقى كما هو (لا يضيع عمل أحد). */
export function mergeById<T extends { id: string }>(stored: T[], incoming: T[]): T[] {
  const incomingIds = new Set(incoming.map((i) => i.id));
  return [...incoming, ...stored.filter((s) => !incomingIds.has(s.id))];
}
