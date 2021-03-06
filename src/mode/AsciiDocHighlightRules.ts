/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { TextHighlightRules } from './TextHighlightRules';
import { HighlighterRule } from './Highlighter';

/**
 *
 */
export class AsciiDocHighlightRules extends TextHighlightRules {
    constructor() {
        super();
        const identifierRe = "[a-zA-Z\u00a1-\uffff]+\\b";

        this.$rules = {
            "start": [
                { token: "empty", regex: /$/ },
                { token: "literal", regex: /^\.{4,}\s*$/, next: "listingBlock" },
                { token: "literal", regex: /^-{4,}\s*$/, next: "literalBlock" },
                { token: "string", regex: /^\+{4,}\s*$/, next: "passthroughBlock" },
                { token: "keyword", regex: /^={4,}\s*$/ },
                { token: "text", regex: /^\s*$/ },
                // immediately return to the start mode without matching anything
                { token: "empty", regex: "", next: "dissallowDelimitedBlock" }
            ],

            "dissallowDelimitedBlock": [
                { include: "paragraphEnd" },
                { token: "comment", regex: '^//.+$' },
                { token: "keyword", regex: "^(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION):" },

                { include: "listStart" },
                { token: "literal", regex: /^\s+.+$/, next: "indentedBlock" },
                { token: "empty", regex: "", next: "text" }
            ],

            "paragraphEnd": [
                { token: "doc.comment", regex: /^\/{4,}\s*$/, next: "commentBlock" },
                { token: "tableBlock", regex: /^\s*[|!]=+\s*$/, next: "tableBlock" },
                // open block, ruller
                { token: "keyword", regex: /^(?:--|''')\s*$/, next: "start" },
                { token: "option", regex: /^\[.*\]\s*$/, next: "start" },
                { token: "pageBreak", regex: /^>{3,}$/, next: "start" },
                { token: "literal", regex: /^\.{4,}\s*$/, next: "listingBlock" },
                { token: "titleUnderline", regex: /^(?:={2,}|-{2,}|~{2,}|\^{2,}|\+{2,})\s*$/, next: "start" },
                { token: "singleLineTitle", regex: /^={1,5}\s+\S.*$/, next: "start" },

                { token: "otherBlock", regex: /^(?:\*{2,}|_{2,})\s*$/, next: "start" },
                // .optional title
                { token: "optionalTitle", regex: /^\.[^.\s].+$/, next: "start" }
            ],

            "listStart": [
                { token: "keyword", regex: /^\s*(?:\d+\.|[a-zA-Z]\.|[ixvmIXVM]+\)|\*{1,5}|-|\.{1,5})\s/, next: "listText" },
                { token: "meta.tag", regex: /^.+(?::{2,4}|;;)(?: |$)/, next: "listText" },
                { token: "support.function.list.callout", regex: /^(?:<\d+>|\d+>|>) /, next: "text" },
                // continuation
                { token: "keyword", regex: /^\+\s*$/, next: "start" }
            ],

            "text": [
                { token: ["link", "variable.language"], regex: /((?:https?:\/\/|ftp:\/\/|file:\/\/|mailto:|callto:)[^\s\[]+)(\[.*?\])/ },
                { token: "link", regex: /(?:https?:\/\/|ftp:\/\/|file:\/\/|mailto:|callto:)[^\s\[]+/ },
                { token: "link", regex: /\b[\w\.\/\-]+@[\w\.\/\-]+\b/ },
                { include: "macros" },
                { include: "paragraphEnd" },
                { token: "literal", regex: /\+{3,}/, next: "smallPassthrough" },
                { token: "escape", regex: /\((?:C|TM|R)\)|\.{3}|->|<-|=>|<=|&#(?:\d+|x[a-fA-F\d]+);|(?: |^)--(?=\s+\S)/ },
                { token: "escape", regex: /\\[_*'`+#]|\\{2}[_*'`+#]{2}/ },
                { token: "keyword", regex: /\s\+$/ },
                // any word
                { token: "text", regex: identifierRe },
                {
                    token: ["keyword", "string", "keyword"],
                    regex: /(<<[\w\d\-$]+,)(.*?)(>>|$)/
                },
                { token: "keyword", regex: /<<[\w\d\-$]+,?|>>/ },
                { token: "constant.character", regex: /\({2,3}.*?\){2,3}/ },
                // Anchor
                { token: "keyword", regex: /\[\[.+?\]\]/ },
                // bibliography
                { token: "support", regex: /^\[{3}[\w\d =\-]+\]{3}/ },

                { include: "quotes" },
                // text block end
                { token: "empty", regex: /^\s*$/, next: "start" }
            ],

            "listText": [
                { include: "listStart" },
                { include: "text" }
            ],

            "indentedBlock": [
                { token: "literal", regex: /^[\s\w].+$/, next: "indentedBlock" },
                { token: "literal", regex: "", next: "start" }
            ],

            "listingBlock": [
                { token: "literal", regex: /^\.{4,}\s*$/, next: "dissallowDelimitedBlock" },
                { token: "constant.numeric", regex: '<\\d+>' },
                { token: "literal", regex: '[^<]+' },
                { token: "literal", regex: '<' }
            ],
            "literalBlock": [
                { token: "literal", regex: /^-{4,}\s*$/, next: "dissallowDelimitedBlock" },
                { token: "constant.numeric", regex: '<\\d+>' },
                { token: "literal", regex: '[^<]+' },
                { token: "literal", regex: '<' }
            ],
            "passthroughBlock": [
                { token: "literal", regex: /^\+{4,}\s*$/, next: "dissallowDelimitedBlock" },
                { token: "literal", regex: identifierRe + "|\\d+" },
                { include: "macros" },
                { token: "literal", regex: "." }
            ],

            "smallPassthrough": [
                { token: "literal", regex: /[+]{3,}/, next: "dissallowDelimitedBlock" },
                { token: "literal", regex: /^\s*$/, next: "dissallowDelimitedBlock" },
                { token: "literal", regex: identifierRe + "|\\d+" },
                { include: "macros" }
            ],

            "commentBlock": [
                { token: "doc.comment", regex: /^\/{4,}\s*$/, next: "dissallowDelimitedBlock" },
                { token: "doc.comment", regex: '^.*$' }
            ],
            "tableBlock": [
                { token: "tableBlock", regex: /^\s*\|={3,}\s*$/, next: "dissallowDelimitedBlock" },
                { token: "tableBlock", regex: /^\s*!={3,}\s*$/, next: "innerTableBlock" },
                { token: "tableBlock", regex: /\|/ },
                { include: "text", noEscape: true }
            ],
            "innerTableBlock": [
                { token: "tableBlock", regex: /^\s*!={3,}\s*$/, next: "tableBlock" },
                { token: "tableBlock", regex: /^\s*|={3,}\s*$/, next: "dissallowDelimitedBlock" },
                { token: "tableBlock", regex: /!/ }
            ],
            "macros": [
                { token: "macro", regex: /{[\w\-$]+}/ },
                { token: ["text", "string", "text", "constant.character", "text"], regex: /({)([\w\-$]+)(:)?(.+)?(})/ },
                { token: ["text", "markup.list.macro", "keyword", "string"], regex: /(\w+)(footnote(?:ref)?::?)([^\s\[]+)?(\[.*?\])?/ },
                { token: ["markup.list.macro", "keyword", "string"], regex: /([a-zA-Z\-][\w\.\/\-]*::?)([^\s\[]+)(\[.*?\])?/ },
                { token: ["markup.list.macro", "keyword"], regex: /([a-zA-Z\-][\w\.\/\-]+::?)(\[.*?\])/ },
                { token: "keyword", regex: /^:.+?:(?= |$)/ }
            ],

            "quotes": [
                { token: "string.italic", regex: /__[^_\s].*?__/ },
                { token: "string.italic", regex: quoteRule("_") },

                { token: "keyword.bold", regex: /\*\*[^*\s].*?\*\*/ },
                { token: "keyword.bold", regex: quoteRule("\\*") },

                { token: "literal", regex: quoteRule("\\+") },
                { token: "literal", regex: /\+\+[^+\s].*?\+\+/ },
                { token: "literal", regex: /\$\$.+?\$\$/ },
                { token: "literal", regex: quoteRule("`") },

                { token: "keyword", regex: quoteRule("^") },
                { token: "keyword", regex: quoteRule("~") },
                { token: "keyword", regex: /##?/ },
                { token: "keyword", regex: /(?:\B|^)``|\b''/ }
            ]

        };

        function quoteRule(ch: string): string {
            const prefix = /\w/.test(ch) ? "\\b" : "(?:\\B|^)";
            return prefix + ch + "[^" + ch + "].*?" + ch + "(?![\\w*])";
        }

        // addQuoteBlock("text")

        const tokenMap = {
            macro: "constant.character",
            tableBlock: "doc.comment",
            titleUnderline: "markup.heading",
            singleLineTitle: "markup.heading",
            pageBreak: "string",
            option: "string.regexp",
            otherBlock: "markup.list",
            literal: "support.function",
            optionalTitle: "constant.numeric",
            escape: "constant.language.escape",
            link: "markup.underline.list"
        };

        for (const state in this.$rules) {
            if (this.$rules.hasOwnProperty(state)) {
                const stateRules = this.$rules[state];
                for (let i = stateRules.length; i--;) {
                    const rule = stateRules[i];
                    if (rule.include || typeof rule === "string") {
                        const stateName = (rule.include || rule) as string;
                        // TODO: What is going on here?
                        let args: (HighlighterRule | number)[] = [i, 1];
                        args = args.concat(this.$rules[stateName]);
                        if (rule.noEscape) {
                            args = args.filter(function (x) {
                                return !(x as HighlighterRule).next;
                            });
                        }
                        stateRules.splice.apply(stateRules, args);
                    }
                    else if (rule.token as string in tokenMap) {
                        rule.token = tokenMap[rule.token as string];
                    }
                }
            }
        }
    }
}


