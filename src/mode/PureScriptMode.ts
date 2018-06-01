/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { TextMode } from "./TextMode";
import { PureScriptHighlightRules } from "./PureScriptHighlightRules";
import { CstyleFoldMode } from "./folding/CstyleFoldMode";

/**
 *
 */
export class PureScriptMode extends TextMode {
    constructor(workerUrl?: string, scriptImports?: string[]) {
        super(workerUrl, scriptImports);
        this.lineCommentStart = "--";
        this.blockComment = { start: "{-", end: "-}", nestable: true };
        this.$id = 'PureScript';
        this.HighlightRules = PureScriptHighlightRules;
        this.foldingRules = new CstyleFoldMode();
        this.$behaviour = this.$defaultBehaviour;
    }
}

