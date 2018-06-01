/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { MixedFoldMode } from "./MixedFoldMode";
import { XmlFoldMode } from "./XmlFoldMode";
import { CstyleFoldMode } from "./CstyleFoldMode";

export interface HtmlElementsMap {
    [name: string]: number;
}

/**
 *
 */
export class HtmlFoldMode extends MixedFoldMode {
    /**
     * @param voidElements
     * @param optionalTags
     */
    constructor(voidElements: HtmlElementsMap, optionalTags?: HtmlElementsMap) {
        super(new XmlFoldMode(voidElements, optionalTags), { "js-": new CstyleFoldMode(), "css-": new CstyleFoldMode() });
    }
}

