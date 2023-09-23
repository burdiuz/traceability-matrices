export const getStructureBranch = (structure: object, path: string[]) => {
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

export const mergeStructure = (source: object, target: object) => {
  Object.entries(source).forEach(([title, children]) => {
    if (title in target) {
      mergeStructure(children, target[title]);
    } else {
      target[title] = children;
    }
  });
};

export const cloneStructure = (source: object, target: object = {}) => {
  for (let name in source) {
    if (!target[name]) {
      target[name] = {};
    }

    cloneStructure(source[name], target[name]);
  }

  return target;
};

export const readStructureRequirements = (structure: object) => {
  const requirements: [string, string[]][] = [];

  const isEmpty = (structure: object, categories: string[]) => {
    let empty = true;

    Object.entries(structure).forEach(([title, children]) => {
      empty = false;

      if (isEmpty(children, [...categories, title])) {
        requirements.push([title, categories]);
      }
    });

    return empty;
  };

  isEmpty(structure, []);

  return requirements;
};

export const concatPath = (...args: (undefined | string | string[])[]) => {
  const path: string[] = [];

  args.forEach((item) => {
    switch (typeof item) {
      case "string":
        path.push(item);
        break;
      case "number":
      case "boolean":
        path.push(String(item));
        break;
      default:
        if (item) {
          path.push(...item);
        }
        break;
    }
  });

  return path.length === 1 ? path[0] : path;
};
