/* eslint-env mocha */

/**
 * This is a quick sanity check to make sure that the compiled main-entry point
 * works. It requires that the code has been compiled.
 */

const moduleUnderTest = require("../..");

describe("This module as a JS package", () => {
  it("should be the expected export", () => {
    expect(moduleUnderTest).toBeInstanceOf(Function);
  });
});
