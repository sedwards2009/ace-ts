const fs = require('fs');
const shelljs = require("shelljs");
const echo = shelljs.echo;
const tar = require("tar");

echo("Creating tarball");

const packageJson = fs.readFileSync('package.json');
const packageData = JSON.parse(packageJson);

const tarballFilename = 'ace-ts-' + packageData.version + '.tgz'

tar.create({
    gzip: true,
    file: tarballFilename
  },
  ["package.json", "README.md", "build"]
).then(_ => {
  echo("Done creating tarball");
});
