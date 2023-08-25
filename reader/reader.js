const { resolve, join, basename } = require("path");
const { readAll } = require("./file-structure");
const {
  readRecords,
  getStructureLeafNodes,
  addEmptyRecordsFromStructure,
} = require("./coverage-records");

const readFiles = async (dirPath, files, projects) => {
  for (let index = 0; index < files.length; index++) {
    const fileName = files[index];
    const filePath = resolve(dirPath, fileName);

    const fileProjects = await readRecords(filePath, projects);

    files[index] = {
      name: fileName,
      specName: basename(fileName, ".json"),
      path: filePath,
      projects: fileProjects,
    };
  }
};

const readDirectories = async (list, projects) => {
  for (let dir of list) {
    await readFiles(dir.path, dir.files, projects);
  }
};

const collectFiles = (roots) => {
  const files = {};

  roots.forEach(({ root, list }) =>
    list.forEach((dir) => {
      dir.files.forEach((file) => {
        const id = join(root.name, dir.localPath, file.name);
        file.id = id;
        files[id] = file;
      });
    })
  );

  return files;
};

const getStructureDepth = (structure, depth = 0) => {
  let newDepth = depth;

  for (key in structure) {
    const value = structure[key];

    if (value && typeof value === "object") {
      newDepth = Math.max(newDepth, getStructureDepth(value, depth + 1));
    }
  }

  return newDepth;
};

/**
 * Adds empty recorts for requirements found in structure and not presdent in records
 * Adds requiremnts to structure which were tested(present in records) but aren't presented there.
 * @param {Record<string, import("./coverage-records").Project>} globalProjects
 * @param {Record<string, import("./reader").FileWithProjects>} files
 */
const normalize = (globalProjects, files) => {
  // generate missing structure pieces from records
  Object.values(globalProjects).forEach((project) => {
    const structReqs = getStructureLeafNodes(project.structure);
    Object.keys(project.records).forEach((req) => {
      if (structReqs.indexOf(req) < 0) {
        project.structure[req] = {};
      }
    });
  });

  // add empty records from structure for global projects
  Object.values(globalProjects).forEach((project) => {
    const { structure, records } = project;

    addEmptyRecordsFromStructure(structure, records);

    // calculate structure depth of the project
    project.depth = getStructureDepth(project.structure);
  });

  // add empty records from requirements found in structure for partial projects
  Object.values(files).forEach(({ projects }) =>
    Object.values(projects).forEach(({ global, records, depth, title }) => {
      addEmptyRecordsFromStructure(global.structure, records);
    })
  );
};

const readCoverage = async (paths, projects = {}) => {
  const roots = await readAll(paths);

  for (item of roots) {
    const { list } = item;

    await readDirectories(list, projects);
  }

  const files = collectFiles(roots);

  normalize(projects, files);

  return { roots, projects, files };
};

module.exports.readCoverage = readCoverage;
