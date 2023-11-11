import {
  afterEach,
  jest,
  describe,
  beforeEach,
  it,
  expect,
} from "@jest/globals";

describe("Cypress Integration", () => {
  let createFeature;
  let feature;

  beforeEach(async () => {
    global.Cypress = {
      currentTest: {
        title: "Le test",
        titlePath: ["Describe", "Le test"],
      },
      env: jest.fn(() => "coverage"),
      spec: {
        relative: "source/folder/file.js",
      },
    };

    ({ createFeature } = await import("../index.ts"));
  });

  afterEach(() => {
    delete global.tm_features;
    jest.resetModules();
    global.after.mockReset();
  });

  beforeEach(() => {
    feature = createFeature({
      title: "Test Feature",
      description: "Description",
      group: "Group",
    });
  });
  
  describe("Structure", () => {
    describe("When structure is set", () => {
      beforeEach(() => {
        feature.structure({
          High: {
            "PRD I": {
              "req 1": {},
              "req 2": {},
            },
          },
          Medium: {
            "PRD II": {
              "req 3": {},
            },
          },
        });
      });

      it("should allow getting subtree", () => {
        expect(
          feature.structure().get("High", "PRD I", "non-existent")
        ).toBeNull();
        expect(feature.structure().get("High", "PRD I")).toMatchInlineSnapshot(`
{
  "req 1": {},
  "req 2": {},
}
`);
      });

      it("should allow cloning whole tree", () => {
        expect(feature.structure().clone()).toMatchInlineSnapshot(`
{
  "High": {
    "PRD I": {
      "req 1": {},
      "req 2": {},
    },
  },
  "Medium": {
    "PRD II": {
      "req 3": {},
    },
  },
}
`);
      });

      it("should allow cloning structure tree", () => {
        expect(feature.structure().clone()).toMatchInlineSnapshot(`
{
  "High": {
    "PRD I": {
      "req 1": {},
      "req 2": {},
    },
  },
  "Medium": {
    "PRD II": {
      "req 3": {},
    },
  },
}
`);
      });

      it("should allow adding to the tree", () => {
        feature.structure().add("Low", "PRD III", "req4");
        feature.structure().add("Low", "PRD III", "req5");
        feature.structure().add("Medium", "PRD II", "req6");
        feature.structure().add("High", "PRD Ia", "req7");

        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [],
  "records": [],
  "structure": {
    "High": {
      "PRD I": {
        "req 1": {},
        "req 2": {},
      },
      "PRD Ia": {
        "req7": {},
      },
    },
    "Low": {
      "PRD III": {
        "req4": {},
        "req5": {},
      },
    },
    "Medium": {
      "PRD II": {
        "req 3": {},
        "req6": {},
      },
    },
  },
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
      });

      it("should allow merging to the tree", () => {
        feature.structure().merge({
          Low: { "PRD III": { req4: {}, req5: {} } },
          Medium: { "PRD II": { req6: {} } },
          High: { "PRD Ia": { req7: {} } },
        });

        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [],
  "records": [],
  "structure": {
    "High": {
      "PRD I": {
        "req 1": {},
        "req 2": {},
      },
      "PRD Ia": {
        "req7": {},
      },
    },
    "Low": {
      "PRD III": {
        "req4": {},
        "req5": {},
      },
    },
    "Medium": {
      "PRD II": {
        "req 3": {},
        "req6": {},
      },
    },
  },
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
      });

      it("should allow creating a narrow version of feature", () => {
        expect(
          feature
            .structure()
            .narrow(
              ["Medium"],
              "Medium PRD Feature",
              "Feature with optional requirements"
            )
            .valueOf()
        ).toMatchInlineSnapshot(`
{
  "Medium": {
    "PRD II": {
      "req 3": {},
    },
  },
}
`);

        expect(() => {
          feature
            .structure()
            .narrow(
              ["Critical"],
              "Medium PRD Feature",
              "Feature with optional requirements"
            );
        }).toThrowError({
          message: 'Structure path ["Critical"] is not available.',
        });
      });

      it("should allow creating a sub-feature from structure branch", () => {
        expect(
          feature
            .structure()
            .branch(
              ["Medium"],
              "PRD II Feature",
              "Sub-Feature with optional requirements"
            )
            .valueOf()
        ).toMatchInlineSnapshot(`
{
  "PRD II": {
    "req 3": {},
  },
}
`);
        expect(() => {
          feature
            .structure()
            .branch(
              ["Medium", "PRD II", "Something"],
              "PRD II Feature",
              "Sub-Feature with optional requirements"
            );
        }).toThrowError({
          message:
            'Structure path ["Medium", "PRD II", "Something"] is not available.',
        });
      });
    });

    describe("When structure is set with headers", () => {
      beforeEach(() => {
        feature.structure(
          {
            High: {
              "PRD II": {
                "req 3": {},
              },
            },
          },
          ["Priority", "PRDs", "Requirements"]
        );
      });

      it("should add structure and headers to the feature", () => {
        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [
    "Priority",
    "PRDs",
    "Requirements",
  ],
  "records": [],
  "structure": {
    "High": {
      "PRD II": {
        "req 3": {},
      },
    },
  },
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
      });
    });

    describe("When structure is not set", () => {
      it("should allow adding to the tree", () => {
        feature.structure().add("Low", "PRD III", "req4");
        feature.structure().add("Low", "PRD III", "req5");
        feature.structure().add("Medium", "PRD II", "req6");
        feature.structure().add("High", "PRD Ia", "req7");

        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [],
  "records": [],
  "structure": {
    "High": {
      "PRD Ia": {
        "req7": {},
      },
    },
    "Low": {
      "PRD III": {
        "req4": {},
        "req5": {},
      },
    },
    "Medium": {
      "PRD II": {
        "req6": {},
      },
    },
  },
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
      });

      it("should allow merging to the tree", () => {
        feature.structure().merge({
          Low: { "PRD III": { req4: {}, req5: {} } },
          Medium: { "PRD II": { req6: {} } },
          High: { "PRD Ia": { req7: {} } },
        });

        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [],
  "records": [],
  "structure": {
    "High": {
      "PRD Ia": {
        "req7": {},
      },
    },
    "Low": {
      "PRD III": {
        "req4": {},
        "req5": {},
      },
    },
    "Medium": {
      "PRD II": {
        "req6": {},
      },
    },
  },
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
      });
    });
  });

  describe("Headers", () => {
    describe("headers()", () => {
      it("should set headers to the feature", () => {
        feature.headers(["Header 1", "Header 2", "Header 3"]);

        expect(feature.valueOf().headers).toEqual([
          "Header 1",
          "Header 2",
          "Header 3",
        ]);
      });
    });

    describe("headers().set()", () => {
      it("should rewrite existing header", () => {
        feature.headers(["Header 1", "Header 2", "Header 3"]);
        feature.headers().set(1, "ABC Header");

        expect(feature.valueOf().headers).toEqual([
          "Header 1",
          "ABC Header",
          "Header 3",
        ]);
      });

      it("should add new header to empty space", () => {
        feature.headers().set(1, "ABC Header");

        expect(feature.valueOf().headers).toEqual([undefined, "ABC Header"]);
      });
    });

    describe("headers().get()", () => {
      it("should access header by index", () => {
        feature.headers(["Header 1", "Header 2", "Header 3"]);

        expect(feature.headers().get(1)).toBe("Header 2");
        expect(feature.headers().get(5)).toBeUndefined();
      });
    });

    describe("headers().clone()", () => {
      it("should clone exisitng headers list", () => {
        feature.headers(["Header 1", "Header 2", "Header 3"]);

        expect(feature.headers().clone()).toEqual([
          "Header 1",
          "Header 2",
          "Header 3",
        ]);

        expect(feature.headers().clone()).not.toBe(feature.valueOf().headers);
      });
    });
  });
});
