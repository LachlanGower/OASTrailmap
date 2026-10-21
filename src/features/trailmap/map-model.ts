/**
 * A rendered Trailmap node is a read-only projection of the *existing* global
 * app state. No copy of Scout storage, no saved-data migrations, no new rules.
 */
export type MapReadiness = 'complete' | 'ready' | 'blocked';

export interface RequirementMapNode {
  id: string;
  stage: number;
  stream: string;
  text: string;
  workflow: string;
  tags: string[];
  status: MapReadiness;
  readyCount: number;
  missingPrerequisites: number;
  hasActivity: boolean;
  selected: boolean;
}

export interface RequirementMapSnapshot {
  nodes: RequirementMapNode[];
  plannerMode: boolean;
  selectedPlannerTags: string[];
  groupScope: boolean;
}

/** Preserve the legacy map's stage/stream and priority ordering. */
export function mapStages(snapshot: RequirementMapSnapshot): Array<{
  stage: number;
  count: number;
  streams: Array<{ stream: string; nodes: RequirementMapNode[] }>;
}> {
  return [1, 2, 3].map(stage => {
    const nodes = snapshot.nodes.filter(node => node.stage === stage);
    const streams = ['Camping', 'Bushwalking', 'Bushcraft'].map(stream => {
      const entries = nodes.filter(node => node.stream === stream);
      if(snapshot.plannerMode) entries.sort((a,b) => {
        const aTags = a.tags.filter(tag=>snapshot.selectedPlannerTags.includes(tag)).length;
        const bTags = b.tags.filter(tag=>snapshot.selectedPlannerTags.includes(tag)).length;
        return bTags-aTags || b.readyCount-a.readyCount || a.text.localeCompare(b.text);
      });
      return {stream,nodes:entries};
    }).filter(group=>group.nodes.length>0);
    return {stage,count:nodes.length,streams};
  });
}

export function mapNodeTitle(node: RequirementMapNode, groupScope: boolean): string {
  if(node.status === 'complete') return 'Complete';
  if(node.status === 'blocked') return groupScope
    ? 'Prerequisites outstanding for remaining Scouts'
    : node.missingPrerequisites + ' prerequisite(s) missing';
  return 'Ready to work on';
}

export function hasPlannerPriority(node: RequirementMapNode,snapshot: RequirementMapSnapshot): boolean {
  return snapshot.plannerMode && snapshot.selectedPlannerTags.length>0 &&
    node.tags.some(tag=>snapshot.selectedPlannerTags.includes(tag));
}
