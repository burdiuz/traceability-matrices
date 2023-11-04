import { getUniqueRequirementId, removeExtraSpaces } from "./utils";

/**
 * Lookup for leaf nodes and assign unique ids to them.
 * Treats leaf nodes as requirments and assigns unique id instead of their original value.
 * @param structure
 */
export const seedStructure = (structure: object) => {
  Object.entries(structure).forEach(([key, value]) => {
    delete structure[key];

    key = removeExtraSpaces(key);

    if (value && typeof value === "object" && Object.keys(value).length) {
      structure[key] = value;
      seedStructure(value);
      return;
    }

    const id = getUniqueRequirementId();
    structure[key] = id;
  });
};

const logStructuralErrorFor = (title: string) =>
  console.error(
    `Instances of "${title}" have srutuctural mismatch, please make sure it records similar structure in all test files.
Possible data loss while merging feature instances.`
  );

export const mergeFeatureStructure = (
  featureTitle: string,
  source: object,
  target: object
) => {
  Object.entries(source).forEach(([title, children]) => {
    if (title in target) {
      const targetChildren = target[title];

      if (typeof children === "object") {
        if (typeof targetChildren !== "object") {
          logStructuralErrorFor(featureTitle);
        } else {
          mergeFeatureStructure(featureTitle, children, targetChildren);
        }

        // no need to overwrite requirement id, we just check if there are no mismatch
      } else if (typeof targetChildren === "object") {
        logStructuralErrorFor(featureTitle);
      }
    } else {
      target[title] = children;
    }
  });
};

/**
 * Returns a map of requirement paths assigned to their ids
 * {
 *  id: path[]
 * }
 * @param structure
 * @param requirements
 * @returns
 */
export const getStructureRequirements = (
  structure: object,
  requirements: Record<string, string[]> = {},
  path: string[] = []
) => {
  Object.entries(structure).forEach(([key, value]) => {
    const currentPath = [...path, key];

    if (typeof value === "object") {
      getStructureRequirements(value, requirements, currentPath);
      return;
    }

    requirements[value] = currentPath;
  });

  return requirements;
};

const logPathErrorFor = (key: string) =>
  console.error(
    `"${key}" was recorded as a requirement and a category. Please, make sure you are tracing a requirement and not a category and run tests to generate updated coverage report.`
  );

/**
 * Find requirement id by its name or path,
 * if not exists will create structure branch and return id
 * @param keys
 * @param structure
 * @returns
 */
export const findPathId = (keys: string[], structure: object) => {
  const lastIndex = keys.length - 1;
  let parent = structure;
  let id = "";

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = parent[key];

    if (!value) {
      if (index < lastIndex) {
        parent[key] = {};
        parent = parent[key];
      } else {
        id = getUniqueRequirementId();
        parent[key] = id;
        break;
      }
    } else {
      if (index < lastIndex) {
        // edge case when key exists in records as a requirement and category
        if (typeof value !== "object") {
          logPathErrorFor(key);

          // replace string with category object
          parent[key] = {};
        }

        parent = parent[key];
      } else {
        // edge case when key exists in records as a requirement and category
        if (typeof value === "object") {
          logPathErrorFor(key);

          return "";
        }

        id = value;
      }
    }
  }

  return id;
};
