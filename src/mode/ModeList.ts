/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2018, Simon Edwards
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
"use strict";

export class Mode {
    name: string;
    caption: string;
    mode: string;
    extensions: string;
    extRe: RegExp;
    mimeTypes: string[];

    constructor(name: string, caption: string, extensions: string, mimeTypes: string[]) {
        this.name = name;
        this.caption = caption;
        this.mode = "ace/mode/" + name;
        this.extensions = extensions;
        this.mimeTypes = mimeTypes;
        let re: string;
        if (/\^/.test(extensions)) {
            re = extensions.replace(/\|(\^)?/g, function(a, b) {
                return "$|" + (b ? "^" : "^.*\\.");
            }) + "$";
        } else {
            re = "^.*\\.(" + extensions + ")$";
        }

        this.extRe = new RegExp(re, "gi");
    }

    supportsFile(filename: string): boolean {
        return filename.match(this.extRe) != null;
    }
}

export const modesByName: {[name: string]: Mode; } = {};
const modesByMimeType: {[name: string]: Mode; } = {};

/**
 * Suggests a mode based on the file extension present in the given path
 * @param {string} path The path to the file
 * @returns {object} Returns an object containing information about the
 *  suggested mode.
 */
export function getModeForPath(path) {
    let mode = modesByName.text;
    const fileName = path.split(/[\/\\]/).pop();
    for (let i = 0; i < modes.length; i++) {
        if (modes[i].supportsFile(fileName)) {
            mode = modes[i];
            break;
        }
    }
    return mode;
}

export function getModeByName(name: string): Mode {
    return modesByName[name] || null;
}

export function getModeByMimeType(mimeType: string): Mode {
    return modesByMimeType[mimeType] || null;
}

const modes: Mode[] = [
    // new Mode("abap", "ABAP", "abap", ["application/vnd.abap"]),
    // new Mode("actionscript", "ActionScript", "as", ["text/x-actionscript"]),
    // new Mode("ada", "ADA", "ada|adb|ads", ["text/x-ada"]),
    // new Mode("apache_conf", "Apache Conf", "^htaccess|^htgroups|^htpasswd|^conf|htaccess|htgroups|htpasswd", ["application/x-apache-conf"]),
    new Mode("asciidoc", "AsciiDoc", "asciidoc", ["text/x-asciidoc"]),
    // new Mode("assembly_x86", "Assembly x86", "asm", ["text/x-asm"]),
    // new Mode("autohotkey", "AutoHotKey", "ahk", ["application/vnd.autohotkey"]),
    // new Mode("batchfile", "BatchFile", "bat|cmd", ["application/bat", "application/x-bat", "application/x-msdos-program"]),
    // new Mode("c9search", "C9Search", "c9search_results", []),
    // new Mode("c_cpp", "C and C++", "cpp|c|cc|cxx|h|hh|hpp", ["text/x-csrc", "text/x-c++src"]),
    // new Mode("cirru", "Cirru", "cirru|cr", []),
    new Mode("clojure", "Clojure", "clj|cljs", ["text/x-clojure"]),
    // new Mode("cobol", "Cobol", "CBL|COB", ["text/x-cobol"]),
    // new Mode("coffee", "CoffeeScript", "coffee|cf|cson|^Cakefile", ["application/vnd.coffeescript", "text/coffeescript", "text/x-coffeescript"]),
    // new Mode("coldfusion", "ColdFusion", "cfm", ["application/vnd.coldfusion", "text/x-coldfusion"]),
    // new Mode("csharp", "C#", "cs", ["text/x-csharp"]),
    new Mode("css", "CSS", "css", ["text/css"]),
    // new Mode("curly", "Curly", "curly", []),
    new Mode("d", "D", "d|di", ["text/x-d"]),
    new Mode("dart", "Dart", "dart", ["application/dart", "text/x-dart"]),
    new Mode("diff", "Diff", "diff|patch", ["text/x-diff"]),
    new Mode("dockerfile", "Dockerfile", "^Dockerfile", ["text/x-dockerfile"]),
    new Mode("dot", "Dot", "dot|gv", ["text/vnd.graphviz"]),
    new Mode("eiffel", "Eiffel", "e", ["text/x-eiffel"]),
    new Mode("ejs", "EJS", "ejs", ["application/x-ejs"]),
    // new Mode("erlang", "Erlang", "erl|hrl", ["text/x-erlang"]),
    new Mode("forth", "Forth", "frt|fs|ldr", ["text/x-forth"]),
    new Mode("ftl", "FreeMarker", "ftl", ["text/x-freemarker"]),
    new Mode("gcode", "Gcode", "gcode", ["text/x-gcode"]),
    new Mode("gherkin", "Gherkin", "feature", ["text/x-feature"]),
    new Mode("gitignore", "Gitignore", "^.gitignore", ["text/x-gitignore"]),
    new Mode("glsl", "Glsl", "glsl|frag|vert", ["text/x-glsl"]),
    new Mode("golang", "Go", "go", ["text/x-go"]),
    new Mode("groovy", "Groovy", "groovy", ["text/x-groovy"]),
    new Mode("haml", "HAML", "haml", ["text/x-haml"]),
    new Mode("handlebars", "Handlebars", "hbs|handlebars|tpl|mustache", ["text/x-handlebars"]),
    new Mode("haskell", "Haskell", "hs", ["text/x-haskell"]),
    new Mode("haxe", "haXe", "hx", ["text/x-haxe"]),
    new Mode("html", "HTML", "html|htm|xhtml", ["text/html"]),
    new Mode("html_ruby", "HTML (Ruby)", "erb|rhtml|html.erb", ["text/x-html-ruby"]),
    // new Mode("ini", "INI", "ini|conf|cfg|prefs", []),
    // new Mode("io", "Io", "io", []),
    // new Mode("jack", "Jack", "jack", []),
    new Mode("jade", "Jade", "jade", ["text/x-jade"]),
    new Mode("java", "Java", "java", ["text/x-java", "text/x-java-source"]),
    new Mode("javascript", "JavaScript", "js|jsm", ["text/javascript", "text/ecmascript", "application/javascript", "application/x-javascript", "application/ecmascript"]),
    new Mode("json", "JSON", "json", ["application/json", "application/x-json"]),
    new Mode("jsoniq", "JSONiq", "jq", ["text/x-jsoniq"]),
    new Mode("jsp", "JSP", "jsp", ["text/x-jsp"]),
    new Mode("jsx", "JSX", "jsx", ["text/jsx"]),
    new Mode("julia", "Julia", "jl", ["text/x-julia"]),
    new Mode("latex", "LaTeX", "tex|latex|ltx|bib", ["text/x-latex"]),
    new Mode("less", "LESS", "less", ["text/x-less"]),
    new Mode("liquid", "Liquid", "liquid", ["text/x-liquid"]),
    new Mode("lisp", "Lisp", "lisp", ["text/x-lisp"]),
    new Mode("livescript", "LiveScript", "ls", ["text/x-livescript"]),
    new Mode("logiql", "LogiQL", "logic|lql", ["text/x-logiql"]),
    new Mode("lsl", "LSL", "lsl", ["text/x-lsl"]),
    new Mode("lua", "Lua", "lua", ["text/x-lua"]),
    new Mode("luapage", "LuaPage", "lp", ["text/x-luapage"]),
    new Mode("lucene", "Lucene", "lucene", ["text/x-lucene"]),
    new Mode("makefile", "Makefile", "^Makefile|^GNUmakefile|^makefile|^OCamlMakefile|make", ["application/vnd.make"]),
    new Mode("markdown", "Markdown", "md|markdown", ["text/x-markdown"]),
    new Mode("matlab", "MATLAB", "matlab", ["text/x-matlab"]),
    new Mode("mel", "MEL", "mel", ["application/x-maya-embedded-language"]),
    new Mode("mushcode", "MUSHCode", "mc|mush", ["text/x-mushcode"]),
    new Mode("mysql", "MySQL", "mysql", ["text/x-mysql"]),
    new Mode("nix", "Nix", "nix", ["text/x-nix"]),
    new Mode("objectivec", "Objective-C", "m|mm", ["text/x-objectivec"]),
    new Mode("ocaml", "OCaml", "ml|mli", ["text/x-ocaml"]),
    new Mode("pascal", "Pascal", "pas|p", ["text/x-pascal"]),
    new Mode("perl", "Perl", "pl|pm", ["text/x-perl"]),
    new Mode("pgsql", "pgSQL", "pgsql", ["text/x-pgsql"]),
    new Mode("php", "PHP", "php|phtml", ["text/x-php", "application/x-httpd-php", "application/x-httpd-php-open"]),
    new Mode("powershell", "Powershell", "ps1", ["application/x-powershell"]),
    // new Mode("praat", "Praat", "praat|praatscript|psc|proc", []),
    new Mode("prolog", "Prolog", "plg|prolog", ["text/x-prolog"]),
    new Mode("properties", "Properties", "properties", ["text/x-java-properties"]),
    new Mode("protobuf", "Protobuf", "proto", ["text/x-protobuf"]),
    // PureScript
    new Mode("python", "Python", "py", ["text/x-python"]),
    new Mode("r", "R", "r", ["text/x-rsrc"]),
    new Mode("rdoc", "RDoc", "Rd", ["application/vnd.rdoc"]),
    new Mode("rhtml", "RHTML", "Rhtml", ["application/x-httpd-eruby"]),
    // new Mode("ruby", "Ruby", "rb|ru|gemspec|rake|^Guardfile|^Rakefile|^Gemfile", ["text/x-ruby"]),
    new Mode("rust", "Rust", "rs", ["text/x-rustsrc"]),
    new Mode("sass", "SASS", "sass", ["text/x-sass"]),
    new Mode("scad", "SCAD", "scad", ["application/x-scad"]),
    new Mode("scala", "Scala", "scala", ["text/x-scala"]),
    new Mode("scheme", "Scheme", "scm|rkt", ["text/x-scheme"]),
    new Mode("scss", "SCSS", "scss", ["text/x-scss"]),
    new Mode("sh", "SH", "sh|bash|^.bashrc", ["application/x-sh"]),
    new Mode("sjs", "SJS", "sjs", ["text/x-sjs"]),
    // new Mode("smarty", "Smarty", "smarty|tpl", ["text/x-smarty"]),
    new Mode("snippets", "snippets", "snippets", ["text/x-snippets"]),
    new Mode("soy_template", "Soy Template", "soy", ["text/x-soy"]),
    new Mode("space", "Space", "space", ["text/x-space"]),
    new Mode("sql", "SQL", "sql", ["text/x-sql"]),
    // new Mode("stylus", "Stylus", "styl|stylus", ["text/x-styl"]),
    new Mode("svg", "SVG", "svg", ["image/svg+xml"]),
    new Mode("tcl", "Tcl", "tcl", ["text/x-tcl"]),
    new Mode("tex", "Tex", "tex", ["application/x-tex"]),
    new Mode("text", "Text", "txt", ["text/plain"]),
    new Mode("textile", "Textile", "textile", ["text/x-textile"]),
    // new Mode("toml", "Toml", "toml", ["text/x-toml"]),
    // new Mode("twig", "Twig", "twig", ["text/x-twig"]),
    new Mode("typescript", "TypeScript", "ts|typescript|str", ["application/typescript"]),
    // new Mode("vala", "Vala", "vala", ["text/x-vala"]),
    // new Mode("vbscript", "VBScript", "vbs|vb", ["text/vbscript"]),
    // new Mode("velocity", "Velocity", "vm", ["text/velocity"]),
    // new Mode("verilog", "Verilog", "v|vh|sv|svh", ["text/x-verilog"]),
    // new Mode("vhdl", "VHDL", "vhd|vhdl", ["text/x-vhdl"]),
    new Mode("xml", "XML", "xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl", ["application/xml", "text/xml"]),
    new Mode("xquery", "XQuery", "xq", ["application/xquery"]),
    new Mode("yaml", "YAML", "yaml|yml", ["text/x-yaml", "text/yaml"]),

];

for (let mode of modes) {
    modesByName[mode.name] = mode;
    for (let mimeType of mode.mimeTypes) {
        modesByMimeType[mimeType] = mode;
    }
}
