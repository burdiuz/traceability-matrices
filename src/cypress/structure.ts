import { Feature } from "./types";
import { cloneStructure, getStructureBranch, mergeStructure } from "./utils";

type HeradersApi = {
  clone: () => string[];
  get: (index: number) => string;
  set: (index: number, header: string) => void;
};

export type HeradersFn = (columnHeaders?: string[]) => HeradersApi;

type StructureApi = {
  add: (...path: string[]) => void;
  get: (...path: string[]) => object;
  merge: (struct: object) => void;
  clone: () => object;
  branch: (path: string[]) => object;
  narrow: (path: string[]) => object;
};

export type StructureFn = (
  data?: object,
  columnHeaders?: string[]
) => StructureApi;

export const createHeadersApi =
  ({ feature }: { feature: Feature }) =>
  (columnHeaders?: string[]) => {
    if (columnHeaders) {
      feature.headers = columnHeaders;
    }

    return {
      clone: () => feature.headers.concat(),
      get: (index: number) => feature.headers[index],
      set: (index: number, header: string) => {
        feature.headers[index] = header;
      },
    };
  };

export const addBranchTo = (structure: object, path: string[]) => {
  let index = 0;
  let parent = structure;

  while (index < path.length) {
    const name = path[index];

    if (!parent[name]) {
      parent[name] = {};
    }

    parent = parent[name];
    index++;
  }

  return parent;
};

export const getBranchOf = (structure: object, path: string[]) => {
  const branch = getStructureBranch(structure, path);

  if (!branch) {
    throw new Error(
      `Structure path [${
        path.length ? `"${path.join('", "')}"` : ""
      }] is not available.`
    );
  }

  return cloneStructure(branch);
};

export const getNarrowStructure = (structure: object, path: string[]) => {
  const sourceStruct = getStructureBranch(structure, path);

  if (!sourceStruct) {
    throw new Error(
      `Structure path [${
        path.length ? `"${path.join('", "')}"` : ""
      }] is not available.`
    );
  }

  return cloneStructure(sourceStruct, addBranchTo({}, path));
};

export const createStructureApi = ({ feature }: { feature: Feature }) => {
  const add = (...path: string[]) => addBranchTo(feature.structure, path);
  const get = (...path: string[]) =>
    getStructureBranch(feature.structure, path);
  const merge = (struct: object) => mergeStructure(struct, feature.structure);
  const clone = () => cloneStructure(feature.structure);

  const branch = (path: string[]) => getBranchOf(feature.structure, path);

  const narrow = (path: string[]) =>
    getNarrowStructure(feature.structure, path);

  return (data?: object, columnHeaders?: string[]) => {
    if (data) {
      mergeStructure(data, feature.structure);
    }

    if (columnHeaders) {
      feature.headers = columnHeaders;
    }

    return {
      add,
      get,
      merge,
      clone,
      branch,
      narrow,
    };
  };
};
