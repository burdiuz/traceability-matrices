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

  it("should execute after() hook", () => {
    expect(global.after).toHaveBeenCalledTimes(1);
    expect(global.after).toHaveBeenCalledWith(expect.any(Function));
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
    "group": "Group",
    "description": "Description",
    "structure": {
      "Group": {
        "req1": {},
        "req2": {},
        "req3": {}
      }
    },
    "headers": [],
    "records": [
      {
        "requirement": "req2",
        "category": [],
        "title": "Le test",
        "filePath": "source/folder/file.js",
        "titlePath": [
          "Describe",
          "Le test"
        ]
      }
    ]
  }
]"
`);
      });
    });

    describe("When multiple features tested within one file", () => {
      beforeEach(() => {
        const prj1 = createFeature({ title: "Feature 1" });
        const prj2 = createFeature({
          title: "Feature 2",
          description: "Description",
        });
        const prj3 = createFeature({ title: "Feature 3" });

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
    "group": "Group",
    "description": "Description",
    "structure": {},
    "headers": [],
    "records": []
  },
  {
    "title": "Feature 1",
    "group": "",
    "description": "",
    "structure": {
      "Group": {
        "req1": {}
      }
    },
    "headers": [],
    "records": []
  },
  {
    "title": "Feature 2",
    "group": "",
    "description": "Description",
    "structure": {},
    "headers": [],
    "records": [
      {
        "requirement": "req2",
        "category": [],
        "title": "Le test",
        "filePath": "source/folder/file.js",
        "titlePath": [
          "Describe",
          "Le test"
        ]
      }
    ]
  },
  {
    "title": "Feature 3",
    "group": "",
    "description": "",
    "structure": {
      "req3": {}
    },
    "headers": [],
    "records": []
  }
]"
`);
      });
    });
  });
});
