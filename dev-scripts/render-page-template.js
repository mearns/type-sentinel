/* eslint no-warning-comments: off */
const handlebars = require("handlebars");
const fs = require("fs");
const marked = require("marked");
const path = require("path");
const packageData = require("../package.json");

function stripHeader(contents) {
  const lines = contents.split(/\r?\n/);
  const idx = lines.findIndex((line) => line.trim() === "---") + 1;
  return lines.slice(idx).join("\n");
}

const contextAsPromised = (async function loadPackageData() {
  packageData.logo = "logo.png";
  packageData.repoUrl = ((packageData.repository || {}).url || "").replace(
    /^git\+/,
    ""
  );
  // TODO: Parse the HTML, look for links to local files, link to the rendered snapshot.
  packageData.readme = marked(
    stripHeader(
      await fs.promises.readFile(
        path.resolve(__dirname, "../README.md"),
        "utf-8"
      )
    ),
    {
      gfm: true,
      smartLists: true,
      xhtml: true,
    }
  );
  return packageData;
})();

async function main() {
  try {
    const [, , template] = process.argv;
    const [templateContent, context] = await Promise.all([
      fs.promises.readFile(template, "utf-8"),
      contextAsPromised,
    ]);
    console.log(handlebars.compile(templateContent)(context));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

main();
