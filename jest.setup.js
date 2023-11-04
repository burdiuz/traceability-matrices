const { jest, beforeEach } = require("@jest/globals");

global.describe = jest.fn();
global.context = jest.fn();
global.suite = jest.fn();
global.it = jest.fn();
global.specify = jest.fn();
global.test = jest.fn();
global.after = jest.fn();

beforeEach(() => {
  global.describe.mockReset();
  global.context.mockReset();
  global.suite.mockReset();
  global.it.mockReset();
  global.specify.mockReset();
  global.test.mockReset();

  // after should be called once on import
  // and does not need to be reset
  // global.after.mockReset();
});
