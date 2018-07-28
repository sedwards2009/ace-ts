// LuaPage implements the LuaPage markup as described by the Kepler Project's CGILua
// documentation: http://keplerproject.github.com/cgilua/manual.html#templates
define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var HtmlHighlightRules = require("./HtmlHighlightRules").HtmlHighlightRules;
var LuaHighlightRules = require("./lua_highlight_rules").LuaHighlightRules;

var LuaPageHighlightRules = function() {
    var newThis = new HtmlHighlightRules();
    LuaPageHighlightRules_OldConstructor.call(newThis);
    return newThis;
}
function LuaPageHighlightRules_OldConstructor() {
    var startRules = [
        {
            token: "keyword",
            regex: "<\\%\\=?",
            push: "lua-start"
        }, {
            token: "keyword",
            regex: "<\\?lua\\=?",
            push: "lua-start"
        }
    ];

    var endRules = [
        {
            token: "keyword",
            regex: "\\%>",
            next: "pop"
        }, {
            token: "keyword",
            regex: "\\?>",
            next: "pop"
        }
    ];

    this.embedRules(LuaHighlightRules, "lua-", endRules, ["start"]);

    for (var key in this.$rules)
        this.$rules[key].unshift.apply(this.$rules[key], startRules);

    this.normalizeRules();
};

oop.inherits(LuaPageHighlightRules, HtmlHighlightRules);

exports.LuaPageHighlightRules = LuaPageHighlightRules;

});