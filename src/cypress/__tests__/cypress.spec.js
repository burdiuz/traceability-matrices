const { jest, describe, beforeEach, it, expect } = require("@jest/globals");

describe("Cypress Integration", () => {
  let createFeature;
  let feature;

  beforeEach(() => {
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

    jest.resetModules();
    ({ createFeature } = require("../../cypress.js"));
  });

  beforeEach(() => {
    feature = createFeature("Test Feature", "Description");
  });

  it("should generate base feature structure", () => {
    expect(feature.valueOf()).toEqual({
      title: "Test Feature",
      description: "Description",
      structure: {},
      headers: [],
      records: {},
    });
  });

  it("should execute after() hook", () => {
    expect(global.after).toHaveBeenCalledTimes(1);
    expect(global.after).toHaveBeenCalledWith(expect.any(Function));
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

      it("should allow cloning sub-tree", () => {
        expect(feature.structure().clone("High")).toMatchInlineSnapshot(`
{
  "PRD I": {
    "req 1": {},
    "req 2": {},
  },
}
`);
        expect(feature.structure().clone("High", "PRD I"))
          .toMatchInlineSnapshot(`
{
  "req 1": {},
  "req 2": {},
}
`);

        expect(() => {
          feature.structure().clone("High", "PRD II");
        }).toThrowError({
          message:
            'Structure path ["High", "PRD II"] is not available in "Test Feature"',
        });
      });

      it("should allow adding to the tree", () => {
        feature.structure().add("Low", "PRD III", "req4");
        feature.structure().add("Low", "PRD III", "req5");
        feature.structure().add("Medium", "PRD II", "req6");
        feature.structure().add("High", "PRD Ia", "req7");

        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "headers": [],
  "records": {},
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
  "headers": [],
  "records": {},
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
  "description": "Feature with optional requirements",
  "headers": [],
  "records": {},
  "structure": {
    "Medium": {
      "PRD II": {
        "req 3": {},
      },
    },
  },
  "title": "Medium PRD Feature",
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
          message:
            'Structure path ["Critical"] is not available in "Test Feature"',
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
  "description": "Sub-Feature with optional requirements",
  "headers": [],
  "records": {},
  "structure": {
    "PRD II": {
      "req 3": {},
    },
  },
  "title": "PRD II Feature",
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
            'Structure path ["Medium,PRD II,Something"] is not available in "Test Feature"',
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
  "headers": [
    "Priority",
    "PRDs",
    "Requirements",
  ],
  "records": {},
  "structure": {
    "High": {
      "PRD II": {
        "req 3": {},
      },
    },
  },
  "title": "Test Feature",
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
  "headers": [],
  "records": {},
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
  "headers": [],
  "records": {},
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

  describe("Records", () => {
    describe("trace()", () => {
      it("shoild record one test", () => {
        feature.trace("req1");
        feature.trace("req2");

        global.Cypress = {
          currentTest: {
            title: "Another test spec",
            titlePath: ["Another test spec"],
          },
        };

        feature.trace("req3");
        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "headers": [],
  "records": {
    "req1": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
    "req2": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
    "req3": [
      {
        "title": "Another test spec",
        "titlePath": [
          "Another test spec",
        ],
      },
    ],
  },
  "structure": {},
  "title": "Test Feature",
}
`);
      });

      describe("When multiple nested requirements", () => {
        beforeEach(() => {
          feature.trace("req1", () => {
            feature.trace("req1");
            feature.trace("req2");
            feature.trace("req3", () => {
              feature.trace("req2");
              feature.trace("req4");
            });
          });
        });

        it("should record multiple tests", () => {
          expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "headers": [],
  "records": {
    "req1": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
    "req2": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
    "req3": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
    "req4": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
  },
  "structure": {},
  "title": "Test Feature",
}
`);
        });
      });
    });

    describe("requirement()", () => {
      beforeEach(() => {
        feature.requirement("req 5").trace(() => {
          feature.requirement("req 5a").trace();
        });
        feature.requirement("req 1").it("should bla-bla-bla", () => {});
        feature
          .requirement("High", "PRD II", "req 3")
          .describe("Test group", () => {});

        // call callback function passed to it()
        global.it.mock.calls[0][1]();

        global.Cypress = {
          currentTest: {
            title: "Another test spec",
            titlePath: ["Another test spec"],
          },
        };

        // call callback function passed to describe()
        global.describe.mock.calls[0][1]();
      });

      it("should generate structure and records", () => {
        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "headers": [],
  "records": {
    "req 1": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
    "req 3": [
      {
        "title": "Another test spec",
        "titlePath": [
          "Another test spec",
        ],
      },
    ],
    "req 5": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
    "req 5a": [
      {
        "title": "Le test",
        "titlePath": [
          "Describe",
          "Le test",
        ],
      },
    ],
  },
  "structure": {
    "High": {
      "PRD II": {
        "req 3": {},
      },
    },
  },
  "title": "Test Feature",
}
`);
      });
    });
  });

  describe("On after()", () => {
    let callback;

    beforeEach(() => {
      global.cy = {
        writeFile: jest.fn(),
      };

      callback = global.after.mock.calls[0][0];
    });

    describe("When single feature tested within one file", () => {
      beforeEach(() => {
        feature.structure({
          Group: {
            req1: {},
            req2: {},
            req3: {},
          },
        });

        feature.trace("req2");
      });

      beforeEach(() => {
        callback();
      });

      it("should request env var for coverage root", () => {
        expect(Cypress.env).toHaveBeenCalledTimes(1);
        expect(Cypress.env).toHaveBeenCalledWith("TRACE_RECORDS_DATA_DIR");
      });

      it("should write file with recorded feature", () => {
        expect(cy.writeFile).toHaveBeenCalledTimes(1);
        expect(cy.writeFile).toHaveBeenCalledWith(
          "coverage/source/folder/file.js.json",
          expect.any(String)
        );
        expect(cy.writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
"[
  {
    "title": "Test Feature",
    "description": "Description",
    "structure": {
      "Group": {
        "req1": {},
        "req2": {},
        "req3": {}
      }
    },
    "headers": [],
    "records": {
      "req2": [
        {
          "title": "Le test",
          "titlePath": [
            "Describe",
            "Le test"
          ]
        }
      ]
    }
  }
]"
`);
      });
    });

    describe("When multiple features tested within one file", () => {
      beforeEach(() => {
        const prj1 = createFeature("Feature 1");
        const prj2 = createFeature("Feature 2", "Description");
        const prj3 = createFeature("Feature 3");

        prj1.structure({
          Group: {
            req1: {},
          },
        });

        prj3.structure({
          req3: {},
        });

        prj2.trace("req2");
      });

      beforeEach(() => {
        callback();
      });

      it("should write file with all recorded features", () => {
        expect(cy.writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
"[
  {
    "title": "Test Feature",
    "description": "Description",
    "structure": {},
    "headers": [],
    "records": {}
  },
  {
    "title": "Feature 1",
    "description": "",
    "structure": {
      "Group": {
        "req1": {}
      }
    },
    "headers": [],
    "records": {}
  },
  {
    "title": "Feature 2",
    "description": "Description",
    "structure": {},
    "headers": [],
    "records": {
      "req2": [
        {
          "title": "Le test",
          "titlePath": [
            "Describe",
            "Le test"
          ]
        }
      ]
    }
  },
  {
    "title": "Feature 3",
    "description": "",
    "structure": {
      "req3": {}
    },
    "headers": [],
    "records": {}
  }
]"
`);
      });
    });
  });
});
