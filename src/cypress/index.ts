import { features, setupSaveHook } from "./feature";
export {
  type FeatureApi,
  createEmptyFeatureState,
  createFeature,
  registerFeature,
  setupSaveHook,
  wrapFeatureState,
} from "./feature";

export type { Feature, MatcherFn } from "./types";
export {
  cloneStructure,
  getStructureBranch,
  mergeStructure,
  readStructureRequirements,
} from "./utils";

setupSaveHook(features);
