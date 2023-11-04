/// <reference path="./Cypress.d.ts" />
import { Feature, MatcherFn } from "./types";
import { concatPath, getStructureBranch } from "./utils";

export type RequirementPathFn = (structure: object) => string | string[];
export type CategoryPathFn = (structure: object) => string[];

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

const addRecordToFeature = (
  feature: Feature,
  namePath: string[] | string,
  specInfo: { title?: string; titlePath?: string[] } = {}
) => {
  const { title = specInfo.title, titlePath = specInfo.titlePath || [] } =
    Cypress.currentTest || {};
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
  (scope: {
    feature: Feature;
    traceToRequirementMatcher?: MatcherFn;
    categoryPath?: string[];
  }) =>
  (nameOrPath: RequirementPathFn | string | string[], chainFn?: () => void) => {
    const { feature, categoryPath } = scope;
    const structure = categoryPath
      ? getStructureBranch(feature.structure, categoryPath)
      : feature.structure;

    let path: string | string[];

    if (typeof nameOrPath === "function") {
      path = nameOrPath(structure);
    } else if (scope.traceToRequirementMatcher) {
      path = scope.traceToRequirementMatcher(nameOrPath, structure);
    } else {
      path = nameOrPath;
    }

    if (categoryPath && categoryPath.length) {
      path = concatPath(categoryPath, path);
    }

    if (path === undefined || (path instanceof Array && !path.length)) {
      throw new Error(
        "Requirement path is empty or undefined and cannot be used for tracing."
      );
    }

    addRecordToFeature(feature, path);

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
  (...path: [RequirementPathFn] | string[]) => {
    const [possiblyFn] = path;
    const { feature, categoryPath } = scope;
    const structure = categoryPath
      ? getStructureBranch(feature.structure, categoryPath)
      : feature.structure;

    let namePath: string | string[];

    if (typeof possiblyFn === "function") {
      namePath = possiblyFn(structure);
    } else if (scope.traceToRequirementMatcher) {
      namePath = scope.traceToRequirementMatcher(path as string[], structure);
    } else {
      namePath = path as string[];
    }

    if (categoryPath && categoryPath.length) {
      namePath = concatPath(categoryPath, namePath);
    }

    if (
      namePath === undefined ||
      (namePath instanceof Array && !namePath.length)
    ) {
      throw new Error(
        "Requirement path is empty or undefined and cannot be used for tracing."
      );
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
        addRecordToFeature(feature, namePath, {
          title: name,
          titlePath: [name],
        });

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
  (parentScope: {
    feature: Feature;
    traceToRequirementMatcher?: MatcherFn;
    categoryPath?: string[];
  }) =>
  (...categoryPath: [CategoryPathFn] | string[]) => {
    let path: string[];
    const [possiblyFn] = categoryPath;
    const { feature, categoryPath: parentPath = [] } = parentScope;

    if (typeof possiblyFn === "function") {
      path = possiblyFn(getStructureBranch(feature.structure, parentPath));
    } else {
      path = categoryPath as string[];
    }

    const scope: {
      feature: Feature;
      traceToRequirementMatcher: MatcherFn;
      categoryPath: string[];
    } = Object.assign(Object.create(parentScope), {
      categoryPath: [...parentPath, ...path],
    });

    const category = createCategoryApi(scope);
    const requirement = createRequirementApi(scope);
    const trace = createTraceFn(scope);

    return {
      category,
      requirement,
      trace,
    };
  };
