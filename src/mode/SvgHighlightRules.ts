/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { JavaScriptHighlightRules } from './JavaScriptHighlightRules';
import { XmlHighlightRules } from './XmlHighlightRules';

export class SvgHighlightRules extends XmlHighlightRules {
    constructor() {
        super();
        this.embedTagRules(JavaScriptHighlightRules, "js-", "script");
        this.normalizeRules();
    }
}

