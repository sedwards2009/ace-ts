
define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./TextMode").Mode;
var GitignoreHighlightRules = require("./gitignore_highlight_rules").GitignoreHighlightRules;

var Mode = function() {
    this.HighlightRules = GitignoreHighlightRules;
};
oop.inherits(Mode, TextMode);

(function() {
    this.$id = "ace/mode/gitignore";
}).call(Mode.prototype);

exports.Mode = Mode;
});
