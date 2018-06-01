/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { TextMode } from './TextMode';
import { XmlHighlightRules } from './XmlHighlightRules';
import { XmlBehaviour } from './behaviour/XmlBehaviour';
import { XmlFoldMode } from './folding/XmlFoldMode';
import { arrayToMap } from '../lib/lang';

const voidElements: string[] = [];

export interface VoidElementsMap {
    [name: string]: number;
}


export class XmlMode extends TextMode {

    protected voidElements: VoidElementsMap;

    constructor(workerUrl: string, scriptImports: string[]) {
        super(workerUrl, scriptImports);
        this.$id = "XML";
        this.HighlightRules = XmlHighlightRules;
        this.$behaviour = new XmlBehaviour();
        this.foldingRules = new XmlFoldMode();
        this.voidElements = arrayToMap(voidElements, 1) as VoidElementsMap;
        this.blockComment = { start: "<!--", end: "-->" };
    }
}

