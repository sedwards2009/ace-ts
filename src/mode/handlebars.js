/* global define */

define(function(require, exports, module) {
  "use strict";

var oop = require("../lib/oop");
var HtmlMode = require("./HtmlMode").Mode;
var HandlebarsHighlightRules = require("./handlebars_highlight_rules").HandlebarsHighlightRules;
var HtmlBehaviour = require("./behaviour/HtmlBehaviour").HtmlBehaviour;
var HtmlFoldMode = require("./folding/HtmlFoldMode").FoldMode;

var Mode = function() {
    var newThis = new HtmlMode();
    newThis.HighlightRules = HandlebarsHighlightRules;
    newThis.$behaviour = new HtmlBehaviour();

    
    newThis.foldingRules = new HtmlFoldMode();
    return newThis;
};

oop.inherits(Mode, HtmlMode);

(function() {
    
    this.$id = "ace/mode/handlebars";
}).call(Mode.prototype);

exports.Mode = Mode;
});
