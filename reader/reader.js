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

const readCoverage = async (paths, projects = {}) => {
  const roots = await readAll(paths);

  for (item of roots) {
    const { list } = item;

    await readDirectories(list, projects);
  }

  // generate missing structure pieces from records
  Object.values(projects).forEach((project) => {
    const structReqs = getStructureLeafNodes(project.structure);
    Object.keys(project.records).forEach((req) => {
      if (structReqs.indexOf(req) < 0) {
        project.structure[req] = {};
      }
    });
  });

  const files = collectFiles(roots);

  // add empty records from requirements found in structure
  Object.values(files).forEach(({ projects }) =>
    Object.values(projects).forEach(({ global, records }) =>
      addEmptyRecordsFromStructure(global.structure, records)
    )
  );

  return { roots, projects, files };
};

module.exports.readCoverage = readCoverage;
