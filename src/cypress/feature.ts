import {
  createCategoryApi,
  createRequirementApi,
  createTraceFn,
} from "./records";
import {
  createHeadersApi,
  createStructureApi,
  getBranchOf,
  getNarrowStructure,
} from "./structure";
import { Feature, MatcherFn } from "./types";
import { cloneStructure } from "./utils";

export type CreateFeatureParams = {
  title: string;
  group?: string;
  description?: string;
};

declare const window: { tm_features?: Feature[] };
declare const global: { tm_features?: Feature[] };

/**
 * Storing and assigning a list from global nsmepsace will allow to collect all features
 * of current test run from independent instances of this module.
 * It might be useful if this file gets bundled with other module and used there, by runtime
 * it will br treated as a separate module and without this check it will have own features
 * list and might overwrite coverage from other sources for same spec file.
 *
 */
export const features = (() => {
  let list: Feature[] = [];

  try {
    if (typeof global !== "undefined" && global) {
      list = global.tm_features || list;
      global.tm_features = list;
    } else if (typeof window !== "undefined" && window) {
      list = window.tm_features || list;
      window.tm_features = list;
    }
  } catch (error) {
    // global scope is not avialable
  }

  return list;
})();

export const setupSaveHook = (features: Feature[], path = "") => {
  after(() => {
    const filePath = path || Cypress.spec.relative;

    cy.writeFile(
      `${Cypress.env("TRACE_RECORDS_DATA_DIR")}/${filePath}.json`,
      JSON.stringify(features, null, 2)
    );
  });
};

export const createEmptyFeatureState = ({
  title,
  group = "",
  description = "",
}: CreateFeatureParams): Feature => ({
  title,
  group,
  description,
  structure: {},
  headers: [],
  records: [],
  valueOf() {
    return this;
  },
});

const createCloneApi = ({ feature }: { feature: Feature }) => {
  return {
    clone: (params: CreateFeatureParams) => {
      const subFeature = createFeature(params);
      const structure = cloneStructure(feature.structure);

      subFeature.structure(structure, feature.headers.concat());

      return subFeature;
    },
    branch: (params: CreateFeatureParams & { path: string[] }) => {
      const { path, ...featureParams } = params;
      const subFeature = createFeature(featureParams);
      const branch = getBranchOf(feature.structure, path);

      subFeature.structure(branch, feature.headers.concat());

      return subFeature;
    },
    narrow: (params: CreateFeatureParams & { path: string[] }) => {
      const { path, ...featureParams } = params;
      const subFeature = createFeature(featureParams);
      const struct = getNarrowStructure(feature.structure, path);

      subFeature.structure(struct, feature.headers.concat());

      return subFeature;
    },
  };
};

export const wrapFeatureState = (feature: Feature) => {
  const scope = { feature, traceToRequirementMatcher: undefined };

  const setTraceToRequirementMatcher = (matcher: MatcherFn) => {
    scope.traceToRequirementMatcher = matcher;
  };

  const cloneProps = createCloneApi(scope);
  const structure = createStructureApi(scope);
  const headers = createHeadersApi(scope);
  const category = createCategoryApi(scope);
  const requirement = createRequirementApi(scope);
  const trace = createTraceFn(scope);

  return {
    valueOf: () => feature,
    structure,
    headers,
    category,
    requirement,
    trace,
    setTraceToRequirementMatcher,
    ...cloneProps,
  };
};

export type FeatureApi = ReturnType<typeof wrapFeatureState>;

export const registerFeature = (feature: Feature | FeatureApi) =>
  features.push(feature.valueOf());

export const createFeature = (params: CreateFeatureParams) => {
  const feature = createEmptyFeatureState(params);

  registerFeature(feature);

  return wrapFeatureState(feature);
};
