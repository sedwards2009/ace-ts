/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { LispHighlightRules } from './LispHighlightRules';
import { TextMode } from './TextMode';

export class LispMode extends TextMode {
    constructor(workerUrl: string, scriptImports: string[]) {
        super(workerUrl, scriptImports);
        this.HighlightRules = LispHighlightRules;
        this.lineCommentStart = ";";
        this.$id = 'LISP';
    }
}

