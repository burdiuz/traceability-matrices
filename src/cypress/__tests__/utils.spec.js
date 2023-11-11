import {
  afterEach,
  jest,
  describe,
  beforeEach,
  it,
  expect,
} from "@jest/globals";
import {
  cloneStructure,
  concatPath,
  getStructureBranch,
  mergeStructure,
  readStructureRequirements,
} from "../utils";

describe("Cypress Integration", () => {
  let structure;

  beforeEach(() => {
    structure = {
      "Requirement 1": null,
      Category: {
        "Requirement 2": true,
        "Sub-Category": { "Requirement 3": "" },
      },
    };
  });

  it("cloneStructure()", () => {
    expect(cloneStructure(structure)).toEqual({
      "Requirement 1": {},
      Category: {
        "Requirement 2": {},
        "Sub-Category": { "Requirement 3": {} },
      },
    });
  });

  it("concatPath()", () => {
    expect(concatPath(["Part 1", "Part 2"], "Part 3", true, 123)).toEqual([
      "Part 1",
      "Part 2",
      "Part 3",
      "true",
      "123",
    ]);
  });

  it("getStructureBranch()", () => {
    expect(getStructureBranch(structure, ["Category"])).toEqual({
      "Requirement 2": true,
      "Sub-Category": { "Requirement 3": "" },
    });

    expect(getStructureBranch(structure, ["Category"])).toBe(
      structure.Category
    );

    expect(getStructureBranch(structure, ["Category", "Sub-Category"])).toEqual(
      { "Requirement 3": "" }
    );

    expect(getStructureBranch(structure, ["Category", "Sub-Category"])).toBe(
      structure.Category["Sub-Category"]
    );
  });

  it("mergeStructure()", () => {
    mergeStructure(
      {
        Category2: {
          "Requirement 4": 1,
        },
        Category: {
          "Requirement 5": 1,
        },
      },
      structure
    );

    expect(structure).toEqual({
      Category: {
        "Requirement 2": true,
        "Requirement 5": 1,
        "Sub-Category": {
          "Requirement 3": "",
        },
      },
      Category2: {
        "Requirement 4": 1,
      },
      "Requirement 1": null,
    });
  });

  it("readStructureRequirements()", () => {
    expect(readStructureRequirements(structure)).toEqual([
      ["Requirement 1", ["Requirement 1"]],
      ["Requirement 2", ["Category", "Requirement 2"]],
      ["Requirement 3", ["Category", "Sub-Category", "Requirement 3"]],
    ]);
  });
});
