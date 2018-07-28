/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { TextMode } from "./TextMode";
import { MatlabHighlightRules } from "./MatlabHighlightRules";
import { MatchingBraceOutdent } from "./MatchingBraceOutdent";

export class MatlabMode extends TextMode {
    $outdent: MatchingBraceOutdent;

    constructor(workerUrl: string, scriptImports: string[]) {
        super(workerUrl, scriptImports);
        this.$id = "MATLAB";
        this.lineCommentStart = "%";
        this.blockComment = { start: "%{", end: "%}" };
        this.HighlightRules = MatlabHighlightRules;
    }
}


export const Mode = MatlabMode;
