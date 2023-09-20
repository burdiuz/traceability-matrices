/**
 * Storing and assigning a list from global nsmepsace will allow to collect all features
 * of current test run from independent instances of this module.
 * It might be useful if this file gets bundled with other module and used there, by runtime
 * it will br treated as a separate module and without this check it will have own features
 * list and might overwrite coverage from other sources for same spec file.
 *
 */
const features = (() => {
  let list = [];

  try {
    if (typeof global !== "undefined" && global) {
      list = global.tm_features || list;
      global.tm_features = list;
    } else if (typeof window !== "undefined" && window) {
      list = window.tm_features || list;
      window.tm_features = list;
    }
  } catch (error) {
    // global scope is not avialable
  }

  return list;
})();

const setupSaveHook = (features, path = "") => {
  after(() => {
    const filePath = path || Cypress.spec.relative;

    cy.writeFile(
      `${Cypress.env("TRACE_RECORDS_DATA_DIR")}/${filePath}.json`,
      JSON.stringify(features, null, 2)
    );
  });
};

const addRecordToFeature = (feature, namePath) => {
  const { title, titlePath } = Cypress.currentTest || {};

  let name;

  if (typeof namePath === "string" || namePath.length <= 1) {
    name = String(namePath);
  } else {
    let parent = feature.structure;

    namePath.forEach((part) => {
      name = part;

      if (!parent[part]) {
        parent[part] = {};
      }

      parent = parent[part];
    });
  }

  if (feature.records[name]) {
    feature.records[name].push({
      filePath: Cypress.spec.relative,
      title,
      titlePath: [...titlePath],
    });
  } else {
    feature.records[name] = [{ title, titlePath: [...titlePath] }];
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

const readStructureRequirements = (structure) => {
  const records = {};

  const isEmpty = (structure, categories) => {
    let empty = true;

    Object.entries(structure).forEach(([title, children]) => {
      empty = false;

      if (isEmpty(children, [...categories, title])) {
        records[title] = categories;
      }
    });

    return empty;
  };

  isEmpty(structure, []);

  return records;
};

const createEmptyFeatureState = (featureTitle, featureDescription = "") => ({
  title: featureTitle,
  description: featureDescription,
  structure: {},
  headers: [],
  records: {},
});

const registerFeature = (feature) => features.push(feature.valueOf());

const wrapFeatureState = (feature) => {
  let traceToRequirementMatcher;

  const setTraceToRequirementMatcher = (matcher) => {
    traceToRequirementMatcher = matcher;
  };

  const clone = (featureTitle, featureDescription) => wrapFeatureState({
    title: featureTitle,
    description: featureDescription,
    structure: cloneStructure(feature.structure),
    headers: [...feature.headers],
    records: {},
  });

  const structure = (data, columnHeaders) => {
    if (data) {
      mergeStructure(data, feature.structure);
    }

    if (columnHeaders) {
      feature.headers = columnHeaders;
    }

    function cloneFeatureStructure(...path) {
      const branch = getStructureBranch(feature.structure, path);

      if (!branch) {
        throw new Error(
          `Structure path [${
            path.length ? `"${path.join('", "')}"` : ""
          }] is not available in "${feature.title}"`
        );
      }

      return cloneStructure(branch);
    }

    return {
      add: (...path) => {
        let index = 0;
        let parent = feature.structure;

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
      get: (...path) => getStructureBranch(feature.structure, path),
      merge: (struct) => mergeStructure(struct, feature.structure),
      clone: cloneFeatureStructure,
      branch: (path, featureTitle, featureDescription) => {
        const subFeature = createFeature(featureTitle, featureDescription);

        subFeature.structure(cloneFeatureStructure(path));

        return subFeature;
      },
      narrow: (path, featureTitle, featureDescription) => {
        const subFeature = createFeature(featureTitle, featureDescription);
        subFeature.valueOf().headers = feature.headers.concat();
        const sourceStruct = getStructureBranch(feature.structure, path);

        if (!sourceStruct) {
          throw new Error(
            `Structure path [${
              path.length ? `"${path.join('", "')}"` : ""
            }] is not available in "${feature.title}"`
          );
        }

        cloneStructure(sourceStruct, subFeature.structure().add(path));

        return subFeature;
      },
    };
  };

  const headers = (columnHeaders) => {
    if (columnHeaders) {
      feature.headers = columnHeaders;
    }

    return {
      clone: () => feature.headers.concat(),
      get: (index) => feature.headers[index],
      set: (index, header) => {
        feature.headers[index] = header;
      },
    };
  };

  const trace = (nameOrPath, chainFn) => {
    if (traceToRequirementMatcher) {
      nameOrPath = traceToRequirementMatcher(
        nameOrPath,
        readStructureRequirements(feature.structure),
        feature.structure
      );
    }

    addRecordToFeature(
      feature,
      typeof nameOrPath === "string" ? [nameOrPath] : nameOrPath
    );

    if (chainFn) {
      chainFn();
    }
  };

  const requirement = (...namePath) => {
    if (traceToRequirementMatcher) {
      namePath = traceToRequirementMatcher(
        namePath,
        readStructureRequirements(feature.structure),
        feature.structure
      );
    }

    // TODO skip adding nested calls to records
    const describeFn = (...args) => {
      // last argument should be callback function
      const fn = args.pop();

      args.push((...fnArgs) => {
        addRecordToFeature(feature, namePath);

        return fn(...fnArgs);
      });

      return describe(...args);
    };

    const specFn = (...args) => {
      const fn = args.pop();

      args.push((...fnArgs) => {
        addRecordToFeature(feature, namePath);

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
        addRecordToFeature(feature, namePath);

        if (chainFn) {
          chainFn();
        }
      },
    };
  };

  return {
    valueOf: () => feature,
    structure,
    headers,
    trace,
    requirement,
    clone,
    setTraceToRequirementMatcher,
  };
};

const createFeature = (featureTitle, featureDescription = "") => {
  const feature = createEmptyFeatureState(featureTitle, featureDescription);

  registerFeature(feature);

  return wrapFeatureState(feature);
};

setupSaveHook(features);

export {
  getStructureBranch,
  mergeStructure,
  cloneStructure,
  createEmptyFeatureState,
  createFeature,
  registerFeature,
  wrapFeatureState,
  setupSaveHook,
};
