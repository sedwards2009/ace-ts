/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { TextMode } from "./TextMode";
import { LatexHighlightRules } from './LatexHighlightRules';
import { LatexFoldMode } from './folding/LatexFoldMode';

/**
 *
 */
export class LatexMode extends TextMode {
    constructor(workerUrl: string, scriptImports: string[]) {
        super(workerUrl, scriptImports);
        // this.type = "text";
        this.lineCommentStart = "%";
        this.$id = "LaTeX";
        this.HighlightRules = LatexHighlightRules;
        this.foldingRules = new LatexFoldMode();
    }
}

export const Mode = LatexMode;
