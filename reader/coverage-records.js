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

const addEmptyRecordsFromStructure = (structure, records, requirements = []) => {
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
  Object.entries(source).forEach(([title, children]) => {
    if (title in target) {
      mergeStructure(children, target[title]);
    } else {
      target[title] = children;
    }
  });
};

const copyProjectRecords = ({ records: source }, { records: target }) => {
  Object.entries(source).forEach(([requirement, specs]) => {
    if (requirement in target) {
      target[requirement] = [...target[requirement], ...specs];
    } else {
      target[requirement] = [...specs];
    }
  });
};

const getStructureDepth = (source, depth = 1) => {
  Object.values(source).forEach((value) => {
    if (isPopulatedStructure(value)) {
      depth = Math.max(depth, getStructureDepth(value, depth + 1));
    }
  });

  return depth;
};

const lookupForProjects = (filePath, projectList, globalProjects = {}) => {
  const specsUnique = {};
  const projects = {};

  projectList.forEach((source) => {
    let global = globalProjects[source.title];

    setSpecsUnique(source.records, specsUnique);

    if (global) {
      mergeStructure(source.structure, global.structure);
    } else {
      global = {
        title: source.title,
        structure: source.structure,
        records: {},
        files: {},
      };

      globalProjects[source.title] = global;
    }

    // delete structure to be able to assign global getter
    delete source.structure;

    copyProjectRecords(source, global);
    global.depth = getStructureDepth(global.structure);
    global.files[filePath] = source.records;
    projects[source.title] = source;

    // one file projedct also gets files record just to match global project shape for easier processing
    source.files = { [filePath]: source.records };

    Object.assign(source, {
      get global() {
        return global;
      },
      get structure() {
        return global.structure;
      },
      get depth() {
        return global.depth;
      },
    });
  });

  return projects;
};

const readRecords = async (filePath, globalProjects) => {
  const records = await readCoverageReportFile(filePath);
  // const specFile = filePath.replace(/\.json$/, "");

  const projects = lookupForProjects(filePath, records, globalProjects);

  //console.log(projects['Project A'].structure['Grand requirement']);
  /*
  console.log(
    projects['Project A'].requirements['PRD Requirement 3'].specs[0]
      .requirements
  );
  */

  return projects;
};

module.exports.readRecords = readRecords;
module.exports.isPopulated = isPopulated;
module.exports.isStructure = isStructure;
module.exports.addEmptyRecordsFromStructure = addEmptyRecordsFromStructure;
module.exports.getStructureLeafNodes = getStructureLeafNodes;
module.exports.isPopulatedStructure = isPopulatedStructure;
