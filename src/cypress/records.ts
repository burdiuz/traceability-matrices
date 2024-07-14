/// <reference path="./Cypress.d.ts" />
import { FeatureApi } from "./feature";
import { Feature, MatcherFn, Scope } from "./types";
import { concatPath, getStructureBranch } from "./utils";

export type RequirementPathFn = (params: {
  branch: null | object;
  structure: object;
  categoryPath: string[];
}) => string | string[];
export type CategoryPathFn = (structure: object) => string[];
export type TracePath = string | string[] | RequirementPathFn;

/**
 * Check of user does not try to trace a category
 * @param structure
 * @param namePath
 * @returns
 */
const validatePath = (
  structure: object,
  namePath: string | string[],
  categoryPath: string[] = []
) => {
  if (!structure) {
    return;
  }

  const path = categoryPath.length
    ? (concatPath(categoryPath, namePath) as string[])
    : typeof namePath === "string"
    ? [namePath]
    : namePath;

  let parent = structure;
  for (let index = 0; index < path.length; index++) {
    parent = parent[path[index]];
    if (!parent || typeof parent !== "object") return;
  }

  if (typeof parent === "object" && Object.keys(parent).length) {
    // user traced an category, this is not allowed

    throw new Error(`Path ["${path.join('", "')}"]
refers to a category in a feature structure.
Categories cannot be traced, please specify a requirement(leaf node of the feature structure) for tracing.`);
  }
};

const addRecordToFeature = (
  feature: Feature,
  namePath: string[] | string,
  categoryPath: string[],
  specInfo: { title?: string; titlePath?: string[] } = {}
) => {
  const { title = specInfo.title, titlePath = specInfo.titlePath || [] } =
    Cypress.currentTest || {};
  let name = namePath;

  validatePath(feature.structure, namePath, categoryPath);

  if (typeof namePath === "string" || namePath.length <= 1) {
    name = String(namePath);
  }

  feature.records.push({
    requirement: name,
    category: categoryPath,
    title: title || "",
    filePath: Cypress.spec.relative,
    titlePath: [...titlePath],
  });
};

const resolvePath = (
  scope: Scope,
  namePath: string | string[] | RequirementPathFn | [RequirementPathFn]
): string | string[] => {
  let path: string | string[];
  const { feature } = scope;

  if (typeof namePath === "function" || typeof namePath[0] === "function") {
    const categoryPath = scope.categoryPath || [];
    const branch = categoryPath.length
      ? getStructureBranch(feature.structure, categoryPath)
      : null;

    const matcher =
      typeof namePath === "function"
        ? namePath
        : (namePath[0] as RequirementPathFn);

    path = matcher({
      structure: feature.structure,
      categoryPath,
      branch,
    });
  } else if (scope.traceToRequirementMatcher) {
    const categoryPath = scope.matcherInstalledFor || [];
    const branch = categoryPath.length
      ? getStructureBranch(feature.structure, categoryPath)
      : null;

    path = scope.traceToRequirementMatcher({
      name: namePath as string | string[],
      structure: feature.structure,
      categoryPath,
      branch,
    });
  } else {
    path = namePath as string | string[];
  }

  if (path === undefined || (path instanceof Array && !path.length)) {
    throw new Error(
      "Requirement path is empty or undefined and cannot be used for tracing."
    );
  }

  return path;
};

export const createTraceFn =
  (scope: Scope) =>
  (namePath: RequirementPathFn | string | string[], chainFn?: () => void) => {
    const { feature, categoryPath, matcherInstalledFor } = scope;

    const path = resolvePath(scope, namePath);

    addRecordToFeature(feature, path, matcherInstalledFor || categoryPath);

    if (chainFn) {
      chainFn();
    }
  };

export const createRequirementApi =
  (scope: Scope) =>
  (...namePath: string[] | [RequirementPathFn]) => {
    const { feature, categoryPath, matcherInstalledFor } = scope;

    const path = resolvePath(scope, namePath);

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
        addRecordToFeature(feature, path, matcherInstalledFor || categoryPath, {
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
        addRecordToFeature(feature, path, matcherInstalledFor || categoryPath);

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
        addRecordToFeature(feature, path, matcherInstalledFor || categoryPath);

        if (chainFn) {
          chainFn();
        }
      },
    };
  };

export interface CategoryLenseFn {
  (pathFn: CategoryPathFn): FeatureCategory;
  (...path: string[]): FeatureCategory;
}

export type FeatureCategory = {
  category: CategoryLenseFn;
  requirement: ReturnType<typeof createRequirementApi>;
  trace: ReturnType<typeof createTraceFn>;
  setTraceToRequirementMatcher: (matcher: MatcherFn) => void;
};

export const createCategoryApi =
  (parentScope: Scope): CategoryLenseFn =>
  (nameOrFn: string | CategoryPathFn, ...path: string[]) => {
    let categoryPath: string[];
    const { feature, categoryPath: parentPath = [] } = parentScope;

    if (typeof nameOrFn === "function") {
      categoryPath = nameOrFn(
        getStructureBranch(feature.structure, parentPath)
      );
    } else {
      categoryPath = [nameOrFn, ...path];
    }

    const fullCategoryPath = [...parentPath, ...categoryPath];

    const scope: Scope = Object.assign(Object.create(parentScope), {
      categoryPath: fullCategoryPath,
    });

    const setTraceToRequirementMatcher = (matcher: MatcherFn) => {
      if (matcher) {
        scope.traceToRequirementMatcher = matcher;
        scope.matcherInstalledFor = fullCategoryPath;
      } else {
        delete scope.traceToRequirementMatcher;
        delete scope.matcherInstalledFor;
      }
    };

    const category = createCategoryApi(scope);
    const requirement = createRequirementApi(scope);
    const trace = createTraceFn(scope);

    return {
      category,
      requirement,
      trace,
      setTraceToRequirementMatcher,
    };
  };
