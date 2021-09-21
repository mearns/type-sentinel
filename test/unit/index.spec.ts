/* eslint-env mocha */
/* eslint no-unused-expressions: off */

// Module under test
import moduleUnderTest from "../../src/index";

describe("The package", () => {
  it("should really have some unit tests", () => {
    expect(moduleUnderTest).toBeInstanceOf(Function);
  });
});
