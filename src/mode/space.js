
define(function(require, exports, module) {
"use strict";
var oop = require("../lib/oop");
// defines the parent mode
var TextMode = require("./TextMode").Mode;
var FoldMode = require("./folding/CoffeeFoldMode").FoldMode;
// defines the language specific highlighters and folding rules
var SpaceHighlightRules = require("./space_highlight_rules").SpaceHighlightRules;
var Mode = function() {
    // set everything up
    this.HighlightRules = SpaceHighlightRules;
    this.foldingRules = new FoldMode();
};
oop.inherits(Mode, TextMode);
(function() {
    
    this.$id = "ace/mode/space";
}).call(Mode.prototype);
exports.Mode = Mode;
});
