import { getUniqueRequirementId, removeExtraSpaces } from "./utils";

/**
 * Lookup for leaf nodes and assign unique ids to them.
 * Treats leaf nodes as requirments and assigns unique id instead of their original value.
 * @param structure
 */
export const seedStructure = (structure: object) => {
  Object.entries(structure).forEach(([key, value]) => {
    key = removeExtraSpaces(key);
    delete structure[key];

    if (Object.keys(value).length) {
      structure[key] = value;
      seedStructure(value);
      return;
    }

    const id = getUniqueRequirementId();
    structure[key] = id;
  });
};

const mergeFeatureStructure = (
  featureTitle: string,
  source: object,
  target: object
) => {
  Object.entries(source).forEach(([title, children]) => {
    if (title in target) {
      const targetChildren = target[title];

      if (typeof children === "object") {
        if (typeof targetChildren !== "object") {
          console.error(
            `Instances of ${featureTitle} have srutuctural mismatch, please make sure it records similar structure in all test files.`
          );
        } else {
          mergeFeatureStructure(featureTitle, children, targetChildren);
        }

        // no need to overwrite requirement id, we just check if there are no mismatch
      } else if (typeof targetChildren === "object") {
        console.error(
          `Different instances of ${featureTitle} have srutuctural mismatch, please make sure it records similar structure in all test files.`
        );
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
          console.error(
            `"${key}" was recorded as a requirement and a category. Please, make sure you are tracing a requirement and not a category and run tests to generate updated coverage report.`
          );

          // replace string with category object
          parent[key] = {};
        }

        parent = parent[key];
      } else {
        // edge case when key exists in records as a requirement and category
        if (typeof value === "object") {
          console.error(
            `"${key}" was recorded as a requirement and a category. Please, make sure you are tracing a requirement and not a category and run tests to generate updated coverage report.`
          );

          return "";
        }

        id = value;
      }
    }
  }

  return id;
};