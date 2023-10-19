const { readFile } = require("fs/promises");

const readCoverageReportFile = async (filePath) => {
  const data = await readFile(filePath, { encoding: "utf-8" });

  return JSON.parse(data);
};

const isPopulated = (obj) => Object.keys(obj).length > 0;

const isStructure = (obj) =>
  !!obj &&
  typeof obj === "object" &&
  Object.getPrototypeOf(obj) === Object.prototype;

const isPopulatedStructure = (obj) => isStructure(obj) && isPopulated(obj);

const isLeafNode = (value) =>
  typeof value !== "object" || !isPopulatedStructure(value);

const getUniqueRequirementId = (() => {
  let id = 1;
  return () => `requirement-${String(id++).padStart(8, "0")}`;
})();

const removeExtraSpaces = (value) => value.replace(/\s+/g, " ").trim();

const getStructureRequirements = (structure, requirements = {}) => {
  Object.entries(structure).forEach(([key, value]) => {
    if (typeof value === "object") {
      getStructureRequirements(value, requirements);
      return;
    }

    requirements[value] = key;
  });

  return requirements;
};

const seedStructure = (structure) => {
  Object.entries(structure).forEach(([key, value]) => {
    key = removeExtraSpaces(key);
    delete structure[key];

    if (isPopulatedStructure(value)) {
      structure[key] = value;
      seedStructure(value);
      return;
    }

    const id = getUniqueRequirementId();
    structure[key] = id;
  });
};

const findPathId = (keys, structure) => {
  const lastIndex = keys.length - 1;
  let parent = structure;
  let id;

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
            `"${key}" was recorded as a requirement and category. Categories cannot be recoreded as covered in tests.`
          );

          // replace string with category object
          parent[key] = {};
        }

        parent = parent[key];
      } else {
        // edge case when key exists in records as a requirement and category
        if (typeof value === "object") {
          console.error(
            `"${key}" was recorded as a requirement and category. Categories cannot be recoreded as covered in tests.`
          );

          return;
        }

        id = value;
      }
    }
  }

  return id;
};

/*
Converts list of requirements
[
  {
    requirement,
    spec
  },
  {
    requirement,
    spec
  },
]
to a hash map
{
  requirement: [
    spec,
  ],
  requirement: [
    spec,
  ],
}
 */
const convertRecordsListToMap = (list, structure) => {
  const requirements = getStructureRequirements(structure);
  const records = {};

  list.forEach(({ requirement, ...spec }) => {
    let id;

    // find out requirement id
    if (typeof requirement === "string") {
      requirement = removeExtraSpaces(requirement);
      id = requirements[requirement];

      if (!id) {
        id = getUniqueRequirementId();
        structure[requirement] = id;
      }
    } else if (requirement instanceof Array) {
      id = findPathId(requirement.map(removeExtraSpaces), structure);

      if (!id) {
        console.error(
          `Coverage record
  ${requirement.join(
            "\n  "
          )}
cannot be used because this path registered as a category and requirement.
Look for other traces with same path.`
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

const addEmptyRecordsFromStructure = (
  structure,
  records,
  requirements = []
) => {
  Object.entries(structure).forEach(([name, children]) => {
    if (isPopulated(children)) {
      addEmptyRecordsFromStructure(children, records);
    } else {
      requirements.push(name);

      if (!(name in records)) {
        records[name] = [];
      }
    }
  });

  // appeared to be not needed
  return requirements;
};
const getStructureLeafNodes = (structure, requirements = []) => {
  Object.entries(structure).forEach(([name, children]) => {
    if (isPopulated(children)) {
      getStructureLeafNodes(children, requirements);
    } else {
      requirements.push(name);
    }
  });

  return requirements;
};

const setSpecsUnique = (records, uniqueSpecs = {}) => {
  Object.entries(records).forEach(([key, record]) => {
    const newRecord = record.map((spec) => {
      const id = spec.titlePath.join("/");

      if (!(id in uniqueSpecs)) {
        uniqueSpecs[id] = spec;
      }

      return uniqueSpecs[id];
    });

    records[key] = Array.from(new Set(newRecord).values());
  });
};

const mergeStructure = (source, target) => {
  if (
    !source ||
    !target ||
    // might be a string for a requirement value
    typeof source !== "object" ||
    typeof target !== "object"
  ) {
    return;
  }

  Object.entries(source).forEach(([title, children]) => {
    if (title in target) {
      mergeStructure(children, target[title]);
    } else {
      target[title] = children;
    }
  });
};

const copyFeatureRecords = ({ records: source }, { records: target }) => {
  Object.entries(source).forEach(([requirement, specs]) => {
    if (requirement in target) {
      target[requirement] = [...target[requirement], ...specs];
    } else {
      target[requirement] = [...specs];
    }
  });
};

const lookupForFeatures = (filePath, featureList, globalFeatures = {}) => {
  const specsUnique = {};
  const features = {};

  featureList.forEach((source) => {
    let global = globalFeatures[source.title];

    seedStructure(source.structure);

    if (global) {
      global.description = global.description || source.description;
      mergeStructure(source.structure, global.structure);
    } else {
      global = {
        title: source.title,
        description: source.description,
        structure: source.structure,
        records: {},
        files: {},
      };

      globalFeatures[source.title] = global;
    }

    // delete structure to be able to assign global getter
    delete source.structure;

    Object.defineProperties(source, {
      global: {
        get() {
          return global;
        },
      },
      structure: {
        get() {
          return global.structure;
        },
      },
      depth: {
        get() {
          return global.depth;
        },
      },
    });

    source.records = convertRecordsListToMap(source.records, source.structure);

    setSpecsUnique(source.records, specsUnique);

    copyFeatureRecords(source, global);
    global.depth = 1;
    global.files[filePath] = source.records;
    features[source.title] = source;

    // one file projedct also gets files record just to match global feature shape for easier processing
    source.files = { [filePath]: source.records };
  });

  return features;
};

const readRecords = async (filePath, globalFeatures) => {
  const records = await readCoverageReportFile(filePath);
  // const specFile = filePath.replace(/\.json$/, "");

  const features = lookupForFeatures(filePath, records, globalFeatures);

  //console.log(features['Feature A'].structure['Grand requirement']);
  /*
  console.log(
    features['Feature A'].requirements['PRD Requirement 3'].specs[0]
      .requirements
  );
  */

  return features;
};

module.exports.readRecords = readRecords;
module.exports.isPopulated = isPopulated;
module.exports.isStructure = isStructure;
module.exports.addEmptyRecordsFromStructure = addEmptyRecordsFromStructure;
module.exports.getStructureLeafNodes = getStructureLeafNodes;
module.exports.isPopulatedStructure = isPopulatedStructure;
