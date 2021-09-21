module.exports = {
  roots: ["test/unit"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.js", "src/**/*.ts", "test-utils/**/*.js"],
  coverageDirectory: "reports/coverage/",
  coverageReporters: ["json", "lcov", "text", "clover", "cobertura"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "reports",
        outputName: "xunit.xml",
      },
    ],
    [
      "jest-stare",
      {
        resultDir: "reports/unit-tests/",
        resultHtml: "index.html",
        resultJson: "data.json",
        report: true,
        reportSummary: true,
        coverageLink: "../coverage/lcov-report/index.html",
      },
    ],
  ],
};
