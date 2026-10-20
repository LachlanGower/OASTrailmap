/**
 * The application requirements catalogue (APP-001..APP-118), not Scout OAS
 * requirements. No Scout records, browser storage or analytics live here.
 */
export type DeliveryStatus = 'implemented' | 'partial' | 'planned' | 'future';
export interface ApplicationRequirement {
  id: string;
  category: string;
  title: string;
  description: string;
  status: DeliveryStatus;
  implementation: string[];
  verification: string;
  [field: string]: unknown;
}
export interface ApplicationCatalogue {
  requirements: ApplicationRequirement[];
  categories: Record<string, string>;
  status_definitions: Record<DeliveryStatus, string>;
  [field: string]: unknown;
}
const labels: Record<DeliveryStatus, string> = {
  implemented: 'Implemented in code',
  partial: 'Partially implemented',
  planned: 'Planned / not complete',
  future: 'Future idea only'
};
export const statuses: DeliveryStatus[] = ['implemented', 'partial', 'planned', 'future'];
export function statusLabel(status: DeliveryStatus): string { return labels[status] ?? status; }

export function parseCatalogue(value: unknown): ApplicationCatalogue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid application requirements catalogue');
  const catalogue = value as Partial<ApplicationCatalogue>;
  if (!Array.isArray(catalogue.requirements) || !catalogue.categories ||
      typeof catalogue.categories !== 'object' || Array.isArray(catalogue.categories) ||
      !catalogue.status_definitions || typeof catalogue.status_definitions !== 'object')
    throw new Error('Invalid application requirements catalogue');
  const ids = new Set<string>();
  for (const item of catalogue.requirements) {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) ||
        !catalogue.status_definitions[item.status] ||
        typeof item.category !== 'string' || typeof item.title !== 'string' ||
        typeof item.description !== 'string' || !Array.isArray(item.implementation) ||
        typeof item.verification !== 'string')
      throw new Error('Invalid or duplicate application requirement: ' + String(item?.id));
    ids.add(item.id);
  }
  return catalogue as ApplicationCatalogue;
}

/** Matches js/application-requirements.js appReqList(), including field order. */
export function filterCatalogue(catalogue: ApplicationCatalogue, query: string,
  status: string, category: string): ApplicationRequirement[] {
  const q = query.trim().toLowerCase();
  return catalogue.requirements.filter(r =>
    (status === 'all' || r.status === status) &&
    (category === 'all' || r.category === category) &&
    (!q || [r.id, r.title, r.description, ...r.implementation, r.verification,
      catalogue.categories[r.category] || ''].join(' ').toLowerCase().includes(q)));
}
export function statusCounts(catalogue: ApplicationCatalogue): Record<DeliveryStatus, number> {
  return Object.fromEntries(statuses.map(s => [s, catalogue.requirements.filter(r => r.status === s).length]))
    as Record<DeliveryStatus, number>;
}

/** Exact existing header sequence, quote escaping and CRLF row endings. */
export function catalogueCsv(catalogue: ApplicationCatalogue): string {
  const columns=['ID','Area','Title','Requirement','Implementation status','Code and documentation','Verification'];
  const rows=catalogue.requirements.map(r => [
    r.id, catalogue.categories[r.category] || r.category, r.title, r.description,
    statusLabel(r.status), r.implementation.join('; '), r.verification
  ]);
  const quote=(x: unknown) => '"' + String(x ?? '').replace(/"/g, '""') + '"';
  return [columns, ...rows].map(row => row.map(quote).join(',')).join('\r\n');
}
export function catalogueJson(catalogue: ApplicationCatalogue): string {
  return JSON.stringify(catalogue, null, 2);
}

/** Same Blob-and-click download contract as legacy download(). */
export function downloadCatalogue(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
