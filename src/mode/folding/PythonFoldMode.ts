/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Range } from "../../Range";
import { FoldMode  as FoldModeBase } from "./FoldMode";
import { EditSession } from "../../EditSession";

export class PythonFoldMode extends FoldModeBase {
    foldingStartMarker: RegExp;
    constructor(markers: string) {
        super();
        this.foldingStartMarker = new RegExp("([\\[{])(?:\\s*)$|(" + markers + ")(?:\\s*)(?:#.*)?$");
    }
    getFoldWidgetRange(session: EditSession, foldStyle: string, row: number): Range | undefined {
        const line = session.getLine(row);
        const match = line.match(this.foldingStartMarker);
        if (match) {
            if (match[1]) {
                return this.openingBracketBlock(session, match[1], row, <number>match.index);
            }
            if (match[2]) {
                return this.indentationBlock(session, row, <number>match.index + match[2].length);
            }
            return this.indentationBlock(session, row);
        }
        return void 0;
    }
}

export const FoldMode = PythonFoldMode;
