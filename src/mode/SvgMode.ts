/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */

import { XmlMode } from './XmlMode';
import { JavaScriptMode } from './JavaScriptMode';
import { SvgHighlightRules } from './SvgHighlightRules';
import { MixedFoldMode } from './folding/MixedFoldMode';
import { XmlFoldMode } from './folding/XmlFoldMode';
import { CstyleFoldMode } from './folding/CstyleFoldMode';

export class SvgMode extends XmlMode {
    constructor(workerUrl: string, scriptImports: string[]) {
        super(workerUrl, scriptImports);
        this.$id = "SVG";
        this.HighlightRules = SvgHighlightRules;

        this.createModeDelegates({
            "js-": JavaScriptMode
        });

        this.foldingRules = new MixedFoldMode(new XmlFoldMode(), {
            "js-": new CstyleFoldMode()
        });

    }
    getNextLineIndent(state: string, line: string, tab: string): string {
        return this.$getIndent(line);
    }
}

