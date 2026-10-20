/**
 * Read-only preview model. This is NOT the complete migration domain schema.
 * A complete schema and data adapters belong in Phase 3.
 */
export interface OasRequirementPreview {
  id: string;
  stage: number;
  stream: 'Camping' | 'Bushwalking' | 'Bushcraft';
  text: string;
}

export interface OasRequirementsPreviewFile {
  requirements: OasRequirementPreview[];
}
