import { createFeatureFromHtmlAsync } from "@actualwave/traceability-matrices/html";

const Feature = createFeatureFromHtmlAsync(
  "cypress/features/ParserHtml.html"
);

describe("HTML", () => {
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
