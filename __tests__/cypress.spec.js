const { jest, describe, beforeEach, it, expect } = require("@jest/globals");

describe("Cypress Integration", () => {
  let createProject;
  let project;

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
    ({ createProject } = require("../cypress.js"));
  });

  beforeEach(() => {
    project = createProject("Test Project", "Description");
  });

  it("should generate base project structure", () => {
    expect(project.valueOf()).toEqual({
      title: "Test Project",
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
        project.structure({
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
          project.structure().get("High", "PRD I", "non-existent")
        ).toBeNull();
        expect(project.structure().get("High", "PRD I")).toMatchInlineSnapshot(`
{
  "req 1": {},
  "req 2": {},
}
`);
      });

      it("should allow cloning whole tree", () => {
        expect(project.structure().clone()).toMatchInlineSnapshot(`
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
        expect(project.structure().clone("High")).toMatchInlineSnapshot(`
{
  "PRD I": {
    "req 1": {},
    "req 2": {},
  },
}
`);
        expect(project.structure().clone("High", "PRD I"))
          .toMatchInlineSnapshot(`
{
  "req 1": {},
  "req 2": {},
}
`);

        expect(() => {
          project.structure().clone("High", "PRD II");
        }).toThrowError({
          message:
            'Structure path ["High", "PRD II"] is not available in "Test Project"',
        });
      });

      it("should allow adding to the tree", () => {
        project.structure().add("Low", "PRD III", "req4");
        project.structure().add("Low", "PRD III", "req5");
        project.structure().add("Medium", "PRD II", "req6");
        project.structure().add("High", "PRD Ia", "req7");

        expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
}
`);
      });

      it("should allow merging to the tree", () => {
        project.structure().merge({
          Low: { "PRD III": { req4: {}, req5: {} } },
          Medium: { "PRD II": { req6: {} } },
          High: { "PRD Ia": { req7: {} } },
        });

        expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
}
`);
      });

      it("should allow creating a narrow version of project", () => {
        expect(
          project
            .structure()
            .narrow(
              ["Medium"],
              "Medium PRD Project",
              "Project with optional requirements"
            )
            .valueOf()
        ).toMatchInlineSnapshot(`
{
  "description": "Project with optional requirements",
  "headers": [],
  "records": {},
  "structure": {
    "Medium": {
      "PRD II": {
        "req 3": {},
      },
    },
  },
  "title": "Medium PRD Project",
}
`);

        expect(() => {
          project
            .structure()
            .narrow(
              ["Critical"],
              "Medium PRD Project",
              "Project with optional requirements"
            );
        }).toThrowError({
          message:
            'Structure path ["Critical"] is not available in "Test Project"',
        });
      });

      it("should allow creating a sub-project from structure branch", () => {
        expect(
          project
            .structure()
            .branch(
              ["Medium"],
              "PRD II Project",
              "Sub-Project with optional requirements"
            )
            .valueOf()
        ).toMatchInlineSnapshot(`
{
  "description": "Sub-Project with optional requirements",
  "headers": [],
  "records": {},
  "structure": {
    "PRD II": {
      "req 3": {},
    },
  },
  "title": "PRD II Project",
}
`);
        expect(() => {
          project
            .structure()
            .branch(
              ["Medium", "PRD II", "Something"],
              "PRD II Project",
              "Sub-Project with optional requirements"
            );
        }).toThrowError({
          message:
            'Structure path ["Medium,PRD II,Something"] is not available in "Test Project"',
        });
      });
    });

    describe("When structure is set with headers", () => {
      beforeEach(() => {
        project.structure(
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

      it("should add structure and headers to the project", () => {
        expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
}
`);
      });
    });

    describe("When structure is not set", () => {
      it("should allow adding to the tree", () => {
        project.structure().add("Low", "PRD III", "req4");
        project.structure().add("Low", "PRD III", "req5");
        project.structure().add("Medium", "PRD II", "req6");
        project.structure().add("High", "PRD Ia", "req7");

        expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
}
`);
      });

      it("should allow merging to the tree", () => {
        project.structure().merge({
          Low: { "PRD III": { req4: {}, req5: {} } },
          Medium: { "PRD II": { req6: {} } },
          High: { "PRD Ia": { req7: {} } },
        });

        expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
}
`);
      });
    });
  });

  describe("Headers", () => {
    describe("headers()", () => {
      it("should set headers to the project", () => {
        project.headers(["Header 1", "Header 2", "Header 3"]);

        expect(project.valueOf().headers).toEqual([
          "Header 1",
          "Header 2",
          "Header 3",
        ]);
      });
    });

    describe("headers().set()", () => {
      it("should rewrite existing header", () => {
        project.headers(["Header 1", "Header 2", "Header 3"]);
        project.headers().set(1, "ABC Header");

        expect(project.valueOf().headers).toEqual([
          "Header 1",
          "ABC Header",
          "Header 3",
        ]);
      });

      it("should add new header to empty space", () => {
        project.headers().set(1, "ABC Header");

        expect(project.valueOf().headers).toEqual([undefined, "ABC Header"]);
      });
    });

    describe("headers().get()", () => {
      it("should access header by index", () => {
        project.headers(["Header 1", "Header 2", "Header 3"]);

        expect(project.headers().get(1)).toBe("Header 2");
        expect(project.headers().get(5)).toBeUndefined();
      });
    });

    describe("headers().clone()", () => {
      it("should clone exisitng headers list", () => {
        project.headers(["Header 1", "Header 2", "Header 3"]);

        expect(project.headers().clone()).toEqual([
          "Header 1",
          "Header 2",
          "Header 3",
        ]);

        expect(project.headers().clone()).not.toBe(project.valueOf().headers);
      });
    });
  });

  describe("Records", () => {
    describe("trace()", () => {
      it("shoild record one test", () => {
        project.trace("req1");
        project.trace("req2");

        global.Cypress = {
          currentTest: {
            title: "Another test spec",
            titlePath: ["Another test spec"],
          },
        };

        project.trace("req3");
        expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
}
`);
      });

      describe("When multiple nested requirements", () => {
        beforeEach(() => {
          project.trace("req1", () => {
            project.trace("req1");
            project.trace("req2");
            project.trace("req3", () => {
              project.trace("req2");
              project.trace("req4");
            });
          });
        });

        it("should record multiple tests", () => {
          expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
}
`);
        });
      });
    });

    describe("requirement()", () => {
      beforeEach(() => {
        project.requirement("req 5").trace(() => {
          project.requirement("req 5a").trace();
        });
        project.requirement("req 1").it("should bla-bla-bla", () => {});
        project
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
        expect(project.valueOf()).toMatchInlineSnapshot(`
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
  "title": "Test Project",
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

    describe("When single project tested within one file", () => {
      beforeEach(() => {
        project.structure({
          Group: {
            req1: {},
            req2: {},
            req3: {},
          },
        });

        project.trace("req2");
      });

      beforeEach(() => {
        callback();
      });

      it("should request env var for coverage root", () => {
        expect(Cypress.env).toHaveBeenCalledTimes(1);
        expect(Cypress.env).toHaveBeenCalledWith("TRACE_RECORDS_DATA_DIR");
      });

      it("should write file with recorded project", () => {
        expect(cy.writeFile).toHaveBeenCalledTimes(1);
        expect(cy.writeFile).toHaveBeenCalledWith(
          "coverage/source/folder/file.js.json",
          expect.any(String)
        );
        expect(cy.writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
"[
  {
    "title": "Test Project",
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

    describe("When multiple projects tested within one file", () => {
      beforeEach(() => {
        const prj1 = createProject("Project 1");
        const prj2 = createProject("Project 2", "Description");
        const prj3 = createProject("Project 3");

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

      it("should write file with all recorded projects", () => {
        expect(cy.writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
"[
  {
    "title": "Test Project",
    "description": "Description",
    "structure": {},
    "headers": [],
    "records": {}
  },
  {
    "title": "Project 1",
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
    "title": "Project 2",
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
    "title": "Project 3",
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
