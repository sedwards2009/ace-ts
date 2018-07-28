define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var HtmlMode = require("./HtmlMode").Mode;
var LuaMode = require("./lua").Mode;
var LuaPageHighlightRules = require("./luapage_highlight_rules").LuaPageHighlightRules;

var Mode = function() {
    // This work-around is needed to combine this old style code with the superclass which uses JS 'class'.
    var newThis = new HtmlMode();
    
    newThis.HighlightRules = LuaPageHighlightRules;
    newThis.createModeDelegates({
        "lua-": LuaMode
    });
    return newThis;
};
oop.inherits(Mode, HtmlMode);

(function() {
    this.$id = "ace/mode/luapage";
}).call(Mode.prototype);

exports.Mode = Mode;
});