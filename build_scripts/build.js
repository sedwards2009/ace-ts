
var shelljs = require("shelljs");
var path = require("path");
var echo = shelljs.echo;

echo("Cleaning 'build' directory");
shelljs.rm("-rf", "build");

echo("");
echo("Compiling TS files");
shelljs.exec("tsc");
if (shelljs.error()) {
  process.exit(1);
}

echo("Copying remaining JS source files to 'build'");
var baseDir = shelljs.pwd();

shelljs.cd("src");

var jsSourceFiles = shelljs.find(".").filter(function(file) { return file.match(/\.(js|css)$/); });

for (var i=0; i<jsSourceFiles.length; i++) {
  var jsSourceFile = jsSourceFiles[i];
  var dest = path.join(""+baseDir, "build", jsSourceFile);
  echo(jsSourceFile + " -> " + dest);
  shelljs.mkdir("-p", path.dirname(dest));
  shelljs.cp(jsSourceFile, dest);
}
shelljs.cd(baseDir);

echo("");
echo("Done");
