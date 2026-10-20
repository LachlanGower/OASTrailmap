import type { RequirementsDataFile } from '../domain/models.js';
import { parseRequirementsData } from '../domain/requirements.js';

export interface MinimalResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}
export type GetResource = (url: string) => Promise<MinimalResponse>;

/** The existing public requirements.json remains authoritative; no client-side rewriting. */
export async function loadPublicRequirements(get: GetResource, url = 'data/requirements.json'):
  Promise<RequirementsDataFile> {
  const response = await get(url);
  if (!response.ok) throw new Error('Could not load OAS requirements: HTTP ' + response.status);
  return parseRequirementsData(await response.json());
}
