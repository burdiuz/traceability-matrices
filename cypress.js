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
      // filePath: Cypress.spec.relative,
      title,
      titlePath: [...titlePath],
    });
  } else {
    project.records[name] = [{ title, titlePath: [...titlePath] }];
  }
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

export const createProject = (projectTitle) => {
  const project = {
    title: projectTitle,
    structure: {},
    headers: [],
    records: {},
  };

  projects.push(project);

  const structure = (data, columnHeaders) => {
    if (data) {
      mergeStructure(data, project.structure);
    }

    if (columnHeaders) {
      project.headers = columnHeaders;
    }
  };

  const headers = (columnHeaders) => {
    if (columnHeaders) {
      project.headers = columnHeaders;
    }

    return {
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
    structure,
    headers,
    trace,
    requirement,
  };
};

after(() => {
  cy.writeFile(
    `${Cypress.env("TRACE_RECORDS_DATA_DIR")}/${Cypress.spec.relative}.json`,
    JSON.stringify(projects, null, 2)
  );
});
