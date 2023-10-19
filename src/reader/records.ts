import { findPathId, getStructureRequirements } from "./structure";
import { FeatureRecord } from "./types";
import { removeExtraSpaces, getUniqueRequirementId } from "./utils";

/**
 * Converts list of requirements
 * [
 *   {
 *     requirement,
 *     spec
 *   },
 *   {
 *     requirement,
 *     spec
 *   },
 * ]
 * to a hash map
 * {
 *   requirement-id: [
 *     spec,
 *   ],
 *   requirement-id: [
 *     spec,
 *   ],
 * }
 */
export const convertRecordsListToMap = (
  list: FeatureRecord[],
  structure: object
) => {
  const requirements = getStructureRequirements(structure);
  const records: Record<string, FeatureRecord[]> = {};

  list.forEach((spec) => {
    let { requirement } = spec;
    let id: string;

    // find out requirement id
    if (typeof requirement === "string") {
      requirement = removeExtraSpaces(requirement);

      // look for requirement Id by its name
      const reqId = Object.keys(requirements).find((requirementId) => {
        const path = requirements[requirementId];

        return requirement === path[path.length - 1];
      });

      /* if no Id was found, it is a new requirenent,
       * 1. generate id for this requirement
       * 2. add it to the requirements hash
       * 3. add it to the root of the feature structure
       */
      if (!reqId) {
        const newId = getUniqueRequirementId();
        requirements[newId] = [requirement];
        structure[requirement] = newId;
        id = newId;
      } else {
        id = reqId;
      }
    } else if (requirement instanceof Array) {
      const reqId = findPathId(requirement.map(removeExtraSpaces), structure);

      if (!reqId) {
        console.error(
          `Coverage record
  ${requirement.join("\n  ")}
cannot be used because this path was registered as a category and a requirement.`
        );
        return;
      } else {
        id = reqId;
      }
    } else {
      console.error(`Recorded unsupported type of requirement`, requirement);
      return;
    }

    if (!(id in records)) {
      records[id] = [];
    }

    // store spec record under requirement id
    records[id].push(spec);
  });

  return records;
};

/**
 * Removes duplicate specs for each requirement, in case if same
 * requirement was traced multiple times in one spec
 *
 * We just need to know if requirement was traced at least one, so
 * multiple records of same specs are not needed.
 * @param records
 */
export const setSpecsUnique = (records: Record<string, FeatureRecord[]>) => {
  Object.entries(records).forEach(([key, specs]) => {
    const uniqueSpecs: Record<string, true> = {};

    records[key] = specs.filter((spec) => {
      const id = spec.titlePath.join("/");
      if (uniqueSpecs[id]) {
        return false;
      }

      uniqueSpecs[id] = true;
    });
  });
};

/**
 * Used to merge file-level feature records to global feature
 * @param param0
 * @param param1
 */
export const mergeFeatureRecords = (
  { records: source }: { records: Record<string, FeatureRecord[]> },
  { records: target }: { records: Record<string, FeatureRecord[]> }
) => {
  Object.entries(source).forEach(([requirementId, specs]) => {
    if (requirementId in target) {
      target[requirementId] = [...target[requirementId], ...specs];
    } else {
      target[requirementId] = [...specs];
    }
  });
};
