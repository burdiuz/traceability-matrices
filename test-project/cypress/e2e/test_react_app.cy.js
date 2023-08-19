describe("React App", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    cy.get(".App-header p").should("contain", "save to reload.");
  });

  it("should display entry point path", () => {
    cy.get(".App-header p > code").should("contain", "src/App.js");
  });

  describe("Graphics", () => {
    it("should display logo", () => {
      cy.get(".App-header .App-logo").should("exist");
    });
  });

  describe("Redirects", () => {
    it("should have a link with proper text", () => {
      cy.get("a.App-link").should("contain", "Learn React");
    });

    context("Links", () => {
      it("should have a react offsite link", () => {
        cy.get(".App-link")
          .invoke("attr", "href")
          .should("eq", "https://reactjs.org");
      });
    });
  });
});
