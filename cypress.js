const projects = [];

const addRecordToProject = (project, name) => {
  const { title, titlePath } = Cypress.currentTest || {};

  if (project.records[name]) {
    project.records[name].push({ title, titlePath: [...titlePath] });
  } else {
    project.records[name] = [{ title, titlePath: [...titlePath] }];
  }
};

// TODO make structure flat
// TODO protect from initinite loop
// TODO do not prebuild, build structure for rendering not for storage

/*
flat structure 
project = {
  'req a': {
    children: ['req b'],
    specs: [{RECORD HERE}],
  },
  'req b': {
    children: [],
    specs: [{RECORD HERE}],
  }
};
*/

const initRecord

const applyStructureToProject = (structure, project) => {

};

export const createProject = (projectTitle) => {
  const project = {
    title: projectTitle,
    headers: [],
    records: {},
  };

  projects.push(project);

  const structure = (data, columnHeaders) => {
    if (data) {
      project.structure = data;
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
  }

  const trace = (name, chainFn) => {
    addRecordToProject(project, name);

    if (chainFn) {
      chainFn();
    }
  };

  const requirement = (name) => {
    // TODO skip adding nested calls to records
    const describeFn = (...args) => {
      // last argument should be callback function
      const fn = args.pop();

      args.push((...fnArgs) => {
        addRecordToProject(project, name);

        return fn(...fnArgs);
      });

      return describe(...args);
    };

    const specFn = (...args) => {
      const fn = args.pop();

      args.push((...fnArgs) => {
        addRecordToProject(project, name);

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
