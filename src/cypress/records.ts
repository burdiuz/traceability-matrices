/// <reference path="./Cypress.d.ts" />
import { Feature, MatcherFn } from "./types";
import { concatPath } from "./utils";

/**
 * Check of user does not try to trace a category
 * @param structure 
 * @param namePath 
 * @returns 
 */
const validatePath = (structure: object, namePath: string | string[]) => {
  if (!structure || !(namePath instanceof Array)) {
    return;
  }

  let parent = structure;
  for (let index = 0; index < namePath.length; index++) {
    parent = parent[namePath[index]];
    if (!parent || typeof parent !== "object") return;
  }

  if (typeof parent === "object" && Object.keys(parent).length) {
    // user traced an category, this is not allowed

    throw new Error(`Path "[${namePath.join('", "')}"]
refers to a category in a feature structure.
Categories cannot be traced, please specify a requirement(leaf node of the feature structure) for tracing.`);
  }
};

const addRecordToFeature = (feature: Feature, namePath: string[] | string) => {
  const { title, titlePath = [] } = Cypress.currentTest || {};
  let name = namePath;

  validatePath(feature.structure, namePath);

  if (typeof namePath === "string" || namePath.length <= 1) {
    name = String(namePath);
  }

  feature.records.push({
    requirement: name,
    title: title || "",
    filePath: Cypress.spec.relative,
    titlePath: [...titlePath],
  });
};

export const createTraceFn =
  ({
    feature,
    traceToRequirementMatcher,
    categoryPath,
  }: {
    feature: Feature;
    traceToRequirementMatcher?: MatcherFn;
    categoryPath?: string[];
  }) =>
  (nameOrPath: string | string[], chainFn?: () => void) => {
    nameOrPath = concatPath(categoryPath, nameOrPath);

    if (traceToRequirementMatcher) {
      nameOrPath = traceToRequirementMatcher(nameOrPath, feature.structure);
    }

    addRecordToFeature(feature, nameOrPath);

    if (chainFn) {
      chainFn();
    }
  };

export const createRequirementApi =
  (scope: {
    feature: Feature;
    traceToRequirementMatcher?: MatcherFn;
    categoryPath?: string[];
  }) =>
  (...path: string[]) => {
    const { feature, categoryPath } = scope;
    let namePath = concatPath(categoryPath, path);

    if (scope.traceToRequirementMatcher) {
      namePath = scope.traceToRequirementMatcher(namePath, feature.structure);
    }

    // TODO skip adding nested calls to records
    const describeFn = (
      ...args: [string, () => void] | [string, object, () => void]
    ) => {
      let name: string;
      let params: object | null = null;
      let callback: () => void;

      if (args.length === 3) {
        [name, params, callback] = args;
      } else {
        [name, callback] = args;
      }

      const alteredCallback = () => {
        addRecordToFeature(feature, namePath);

        return callback();
      };

      return params
        ? describe(name, params, alteredCallback)
        : describe(name, alteredCallback);
    };

    const specFn = (name: string, callback: () => void) => {
      const alteredCallback = () => {
        addRecordToFeature(feature, namePath);

        return callback();
      };

      return it(name, alteredCallback);
    };

    return {
      describe: describeFn,
      context: describeFn,
      suite: describeFn,
      it: specFn,
      specify: specFn,
      test: specFn,
      trace: (chainFn?: () => void) => {
        addRecordToFeature(feature, namePath);

        if (chainFn) {
          chainFn();
        }
      },
    };
  };

export const createCategoryApi =
  (parentScope: { feature: Feature; traceToRequirementMatcher?: MatcherFn }) =>
  (...categoryPath: string[]) => {
    const scope: {
      feature: Feature;
      traceToRequirementMatcher: MatcherFn;
      categoryPath: string[];
    } = Object.assign(Object.create(parentScope), { categoryPath });

    const requirement = createRequirementApi(scope);
    const trace = createTraceFn(scope);

    return {
      requirement,
      trace,
    };
  };
