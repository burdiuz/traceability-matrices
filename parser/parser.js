const { readFile } = require('fs/promises');

const readCoverageReportFile = async (filePath) => {
  const data = await readFile(filePath, { encoding: 'utf-8' });

  return JSON.parse(data);
};

const isPopulated = (obj) => Object.keys(obj).length > 0;

const isStructure = (obj) =>
  !!obj &&
  typeof obj === 'object' &&
  Object.getPrototypeOf(obj) === Object.prototype;

const isPopulatedStructure = (obj) => isStructure(obj) && isPopulated(obj);

const createNewRecord = (name, structure) => ({
  title: name,
  parent: structure,
  specs: [],
  children: {},
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

const lookupForProjects = (filePath, projectList, projects = {}) => {
  projectList.forEach((source) => {
    // init project
    const project = projects[source.title] ?? {
      title: source.title,
      depth: 1,
      structure: {},
      requirements: {},
      files: {},
      specs: {},
      source,
    };

    const { structure, requirements, specs } = project;
    const file = project.files[filePath] ?? {};

    project.files[filePath] = file;
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
        const id = `${filePath}:${titlePath.join(':')}`;

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
        }
      });
    });
  });

  return projects;
};

const parse = async (filePath) => {
  const records = await readCoverageReportFile(filePath);
  const specFile = filePath.replace(/\.json$/, '');

  const projects = lookupForProjects(specFile, records);

  //console.log(projects['Project A'].structure['Grand requirement'].children);
  /*
  console.log(
    projects['Project A'].requirements['PRD Requirement 3'].specs[0]
      .requirements
  );
  */

  return projects;
};

//console.log(process.cwd());

const buildHorizontalHeaders = ({ files }) => {
  const specs = [];
  const filesRow = [];
  const specsRow = [];

  // [path, specs]
  Object.entries(files)
    .sort(([path1], [path2]) => (path1 < path2 ? -1 : 1))
    .forEach(([filePath, fileSpecsObj]) => {
      const specList = Object.values(fileSpecsObj);

      if (!specList.length) {
        return;
      }

      // add cell for file names row
      filesRow.push({
        name: filePath.match(/[^\/\\]+$/)[0],
        // TODO remove cypress coverage path part
        title: filePath,
        colspan: specList.length,
      });

      specList
        .sort(({ title: a }, { title: b }) => (a < b ? -1 : 1))
        .forEach((spec) => {
          specs.push(spec);
          specsRow.push({
            name: spec.title,
            title: spec.titlePath.join(' > '),
            colspan: 1,
          });
        });
    });

  // a list of specs in indices matching to their cell indices and rows list(first for file names and second for spec names).
  return { specs, filesRow, specsRow, rows: [filesRow, specsRow] };
};

/**
 * Go to the leaf nodes of a structure
 * 1. start building from leaf by adding new row
 * 2. leaf node will colspan maxDepth - currentDepth, add leaf requirements into some list to know which row corresponds to which requirement
 * 3. parent nodes will rowspan by count of children
 * 4. after building all nodes returns first row so we know where to add its parent, also inform parent about count of rows
 */
const buildVerticalHeaders = (project) => {
  const { depth: maxDepth, structure } = project;

  const buildChildren = (children, depth) => {
    const childReqs = [];
    const childRows = [];

    Object.values(children)
      .sort(({ title: a }, { title: b }) => (a < b ? -1 : 1))
      .forEach((requirement) => {
        const child = build(requirement, depth);
        childReqs.push(...child.requirements);
        childRows.push(...child.rows);
      });

    return { requirements: childReqs, rows: childRows };
  };

  const build = (requirement, depth) => {
    const cell = {
      name: requirement.title,
      title: requirement.title,
      colspan: 1,
      rowspan: 1,
    };

    if (isPopulated(requirement.children)) {
      const children = buildChildren(requirement.children, depth + 1);
      cell.rowspan = children.rows.length;
      children.rows[0].unshift(cell);
      return children;
    }

    cell.colspan = maxDepth - depth;

    return { requirements: [requirement], rows: [[cell]] };
  };

  return buildChildren(structure, 0);
};

const buildDataRows = (vertical, horizontal) => {
  const totalSpecCount = horizontal.specs.length;
  const totalRequirements = vertical.rows.length;
  let coveredRequirements = 0;
  const rows = vertical.rows.map((headers, index) => {
    const requirement = vertical.requirements[index];
    const specCount = requirement.specs.length;
    const row = new Array(totalSpecCount + 1).fill({
      name: '',
      title: `Requirement: ${requirement.title}`,
      colspan: 1,
      rowspan: 1,
      class: 'empty',
    });

    if (specCount) {
      coveredRequirements++;
    }

    // first column is count of specs used for a requirement
    row[0] = {
      name: specCount,
      title: `${specCount} specs test this requirement`,
      colspan: 1,
      rowspan: 1,
      class: 'spec-count',
    };

    requirement.specs.forEach((spec) => {
      const specIndex = horizontal.specs.indexOf(spec);

      if (specIndex < 0) {
        console.error(
          'Spec not found for requirement:',
          requirement.title,
          spec.filePath,
          spec.titlePath
        );

        return;
      }

      row[1 + specIndex] = {
        name: 'X',
        title: `Requirement: ${requirement.title}\nSpec: ${spec.titlePath.join(' > ')}\nFile: ${spec.filePath}`,
        colspan: 1,
        rowspan: 1,
        class: 'covered',
      };
    });

    return {
      specCount,
      class: specCount ? 'covered' : 'empty',
      cells: row,
    };
  });

  return { totalRequirements, coveredRequirements, totalSpecCount, rows };
};
