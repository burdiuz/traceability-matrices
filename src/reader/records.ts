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
const convertRecordsListToMap = (list: FeatureRecord[], structure: object) => {
  const requirements = getStructureRequirements(structure);
  const records = {};

  list.forEach(({ requirement, ...spec }) => {
    let id: string | undefined;

    // find out requirement id
    if (typeof requirement === "string") {
      requirement = removeExtraSpaces(requirement);
      id = Object.keys(requirements).find((requirementId) => {
        const path = requirements[requirementId];

        return requirement === path[path.length - 1];
      });

      if (!id) {
        id = getUniqueRequirementId();
        structure[requirement] = id;
      }
    } else if (requirement instanceof Array) {
      id = findPathId(requirement.map(removeExtraSpaces), structure);

      if (!id) {
        console.error(
          `Coverage record
  ${requirement.join("\n  ")}
cannot be used because this path was registered as a category and a requirement.`
        );
        return;
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
 * Removes duplicate specs for each requirement,
 * in case if same requirement was traced multiple times in one spec
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