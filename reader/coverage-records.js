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

const createNewRecord = (name, structure) => ({
  title: name,
  parent: structure,
  specs: [],
  children: {},
  files: {},
});

const buildStructure = (structure, requirements, source, depth = 1) => {
  if (!isStructure(source)) {
    return depth;
  }

  Object.entries(source).forEach(([name, value]) => {
    const record = createNewRecord(name, structure);

    structure[name] = record;
    requirements[name] = record;

    if (isPopulatedStructure(value)) {
      depth = Math.max(
        depth,
        buildStructure(record.children, requirements, value, depth + 1)
      );
    }
  });

  return depth;
};

const createNewProject = (source) => ({
  title: source.title,
  depth: 1,
  structure: {},
  requirements: {},
  files: {},
  specs: {},
  source,
});

const lookupForProjects = (filePath, projectList, globalProjects = {}) => {
  const projects = {};

  projectList.forEach((source) => {
    // init project
    //const project = projects[source.title] ?? createNewProject(source);
    const project = createNewProject(source);

    const { structure, requirements, specs } = project;
    const file = project.files[filePath] ?? {};

    project.files[filePath] = file;
    globalProjects[source.title] = project;
    projects[source.title] = project;

    // build requirements from structure
    project.depth = buildStructure(
      structure,
      requirements,
      source.structure,
      project.depth
    );

    // apply records
    Object.entries(source.records).forEach(([requirementName, records]) => {
      let requirement = requirements[requirementName];

      if (!requirement) {
        requirement = createNewRecord(requirementName, structure);
        requirements[requirementName] = requirement;
        structure[requirementName] = requirement;
      }

      records.forEach(({ title, titlePath }) => {
        const id = `${filePath}:${titlePath.join(":")}`;

        if (!specs[id]) {
          const spec = {
            id,
            file,
            title,
            filePath,
            titlePath,
            requirements: [],
          };

          specs[id] = spec;
          file[id] = spec;
        }

        const spec = specs[id];

        // we may lookup by requirement ref since they kept same for same name
        if (!spec.requirements.includes(requirement)) {
          spec.requirements.push(requirement);
          requirement.specs.push(spec);

          // Register spec in file for requriements so we can identify files where it was tested
          if (!requirement.files[filePath]) {
            requirement.files[filePath] = {};
          }

          requirement.files[filePath][id] = spec;
        }
      });
    });
  });

  return projects;
};

const readRecords = async (filePath, globalProjects) => {
  const records = await readCoverageReportFile(filePath);
  const specFile = filePath.replace(/\.json$/, "");

  const projects = lookupForProjects(specFile, records, globalProjects);

  //console.log(projects['Project A'].structure['Grand requirement'].children);
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
module.exports.isPopulatedStructure = isPopulatedStructure;
