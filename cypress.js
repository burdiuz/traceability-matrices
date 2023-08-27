const projects = [];

const addRecordToProject = (project, namePath) => {
  const { title, titlePath } = Cypress.currentTest || {};

  let name;

  if (typeof namePath === "string" || namePath.length <= 1) {
    name = String(namePath);
  } else {
    let parent = project.structure;

    namePath.forEach((part) => {
      name = part;

      if (!parent[part]) {
        parent[part] = {};
      }

      parent = parent[part];
    });
  }

  if (project.records[name]) {
    project.records[name].push({
      filePath: Cypress.spec.relative,
      title,
      titlePath: [...titlePath],
    });
  } else {
    project.records[name] = [{ title, titlePath: [...titlePath] }];
  }
};

const getStructureBranch = (structure, path) => {
  let index = 0;
  let parent = structure;

  while (index < path.length) {
    const name = path[index];

    if (!parent[name]) {
      return null;
    }

    parent = parent[name];
    index++;
  }

  return parent;
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

const cloneStructure = (source, target = {}) => {
  for (let name in source) {
    if (!target[name]) {
      target[name] = {};
    }

    cloneStructure(source[name], target[name]);
  }

  return target;
};

const createProject = (projectTitle, projectDescription = "") => {
  const project = {
    title: projectTitle,
    description: projectDescription,
    structure: {},
    headers: [],
    records: {},
  };

  projects.push(project);

  const clone = (projectTitle, projectDescription) => ({
    title: projectTitle,
    description: projectDescription,
    structure: cloneStructure(project.structure),
    headers: [...project.headers],
    records: {},
  });

  const structure = (data, columnHeaders) => {
    if (data) {
      mergeStructure(data, project.structure);
    }

    if (columnHeaders) {
      project.headers = columnHeaders;
    }

    function cloneProjectStructure(...path) {
      const branch = getStructureBranch(project.structure, path);

      if (!branch) {
        throw new Error(
          `Structure path [${
            path.length ? `"${path.join('", "')}"` : ""
          }] is not available in "${project.title}"`
        );
      }

      return cloneStructure(branch);
    }

    return {
      add: (...path) => {
        let index = 0;
        let parent = project.structure;

        while (index < path.length) {
          const name = path[index];

          if (!parent[name]) {
            parent[name] = {};
          }

          parent = parent[name];
          index++;
        }

        return parent;
      },
      get: (...path) => getStructureBranch(project.structure, path),
      merge: (struct) => mergeStructure(struct, project.structure),
      clone: cloneProjectStructure,
      branch: (path, projectTitle, projectDescription) => {
        const subProject = createProject(projectTitle, projectDescription);

        subProject.structure(cloneProjectStructure(path));

        return subProject;
      },
      narrow: (path, projectTitle, projectDescription) => {
        const subProject = createProject(projectTitle, projectDescription);
        subProject.valueOf().headers = project.headers.concat();
        const sourceStruct = getStructureBranch(project.structure, path);

        if (!sourceStruct) {
          throw new Error(
            `Structure path [${
              path.length ? `"${path.join('", "')}"` : ""
            }] is not available in "${project.title}"`
          );
        }

        cloneStructure(sourceStruct, subProject.structure().add(path));

        return subProject;
      },
    };
  };

  const headers = (columnHeaders) => {
    if (columnHeaders) {
      project.headers = columnHeaders;
    }

    return {
      clone: () => project.headers.concat(),
      get: (index) => project.headers[index],
      set: (index, header) => {
        project.headers[index] = header;
      },
    };
  };

  const trace = (nameOrPath, chainFn) => {
    addRecordToProject(
      project,
      typeof nameOrPath === "string" ? [nameOrPath] : nameOrPath
    );

    if (chainFn) {
      chainFn();
    }
  };

  const requirement = (...namePath) => {
    // TODO skip adding nested calls to records
    const describeFn = (...args) => {
      // last argument should be callback function
      const fn = args.pop();

      args.push((...fnArgs) => {
        addRecordToProject(project, namePath);

        return fn(...fnArgs);
      });

      return describe(...args);
    };

    const specFn = (...args) => {
      const fn = args.pop();

      args.push((...fnArgs) => {
        addRecordToProject(project, namePath);

        return fn(...fnArgs);
      });

      return it(...args);
    };

    return {
      describe: describeFn,
      context: describeFn,
      suite: describeFn,
      it: specFn,
      specify: specFn,
      test: specFn,
      trace: (chainFn) => {
        addRecordToProject(project, namePath);

        if (chainFn) {
          chainFn();
        }
      },
    };
  };

  return {
    valueOf: () => project,
    structure,
    headers,
    trace,
    requirement,
    clone,
  };
};

after(() => {
  cy.writeFile(
    `${Cypress.env("TRACE_RECORDS_DATA_DIR")}/${Cypress.spec.relative}.json`,
    JSON.stringify(projects, null, 2)
  );
});

module.exports.getStructureBranch = getStructureBranch;
module.exports.mergeStructure = mergeStructure;
module.exports.cloneStructure = cloneStructure;
module.exports.createProject = createProject;