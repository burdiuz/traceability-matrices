import { createFeatureFromJsonAsync } from "@actualwave/traceability-matrices/json";

const Feature = createFeatureFromJsonAsync("cypress/features/ParserJson.json");

describe("JSON", () => {
  describe("Root requirements", () => {
    it("trace optional requirements", () => {
      Feature.trace("Optional Requirement 1");
      Feature.trace("Optional Requirement 3");
    });
  });
  describe("High requirements", () => {
    it("trace high requirements", () => {
      Feature.trace("High Requirement 2");
    });
  });

  describe("Medium requirements", () => {
    it("trace medium requirements", () => {
      Feature.trace("Medium Requirement 1");
      Feature.trace("Medium Requirement 3");
    });

    describe("Sub-category requirements", () => {
      it("trace sub-category requirements", () => {
        Feature.trace("Requirement on a side 2");
      });
    });
  });

  describe("Low requirements", () => {
    it("trace low requirements", () => {
      Feature.trace("Low Requirement 2");
    });
  });
});
