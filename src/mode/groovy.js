define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var JavaScriptMode = require("./JavaScriptMode").Mode;
var GroovyHighlightRules = require("./groovy_highlight_rules").GroovyHighlightRules;

var Mode = function() {
    var newThis = new JavaScriptMode();
    newThis.HighlightRules = GroovyHighlightRules;
    return newThis;
};
oop.inherits(Mode, JavaScriptMode);

(function() {

    this.createWorker = function(session) {
        return null;
    };

    this.$id = "ace/mode/groovy";
}).call(Mode.prototype);

exports.Mode = Mode;
});
