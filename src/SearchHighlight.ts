/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { getMatchOffsets } from "./lib/lang";
import { Marker, MarkerType } from "./Marker";
import { Range } from "./Range";
import { MarkerLayer } from "./layer/MarkerLayer";
import { MarkerConfig } from "./layer/MarkerConfig";
import { EditSession } from "./EditSession";
import { DeltaIgnorable } from "./DeltaIgnorable";

// needed to prevent long lines from freezing the browser
const MAX_RANGES = 500;

export class SearchHighlight implements Marker {
    private regExp: RegExp | null | undefined;
    public clazz: string;
    public type: MarkerType;
    private cache: Range[][];
    private _range: Range;

    constructor(regExp: RegExp | null, clazz: string, type: MarkerType) {
        this.setRegexp(regExp);
        this.clazz = clazz;
        this.type = type || "text";
    }

    /**
     * Set the regular expression to use to identify the text to highlight.
     * 
     * @param regExp the regular expression or null to turn off all highlighting.
     */
    setRegexp(regExp: RegExp | null): void {
        if (regExp == null) {
            this.regExp = null;
            this.cache = [];
            return;
        }

        if (this.regExp + "" === regExp + "") {
            return;
        }
        this.regExp = regExp;
        this.cache = [];
    }

    get range(): Range {
        return this._range;
    }

    set range(range: Range) {
        this._range = range;
    }
    
    onChange(delta: DeltaIgnorable): void {
        const row = delta.start.row;
        if (row == delta.end.row) {
            this.cache[row] = null;
        } else {
            this.cache.splice(row, this.cache.length);
        }
    }

    update(html: (number | string)[], markerLayer: MarkerLayer, session: EditSession, config: MarkerConfig): void {
        if (this.regExp == null) {
            return;
        }

        const start = config.firstRow;
        const end = config.lastRow;

        for (let i = start; i <= end; i++) {
            let ranges = this.cache[i];
            if (ranges == null) {
                let matches = getMatchOffsets(session.getLine(i), this.regExp);
                if (matches.length > MAX_RANGES) {
                    matches = matches.slice(0, MAX_RANGES);
                }
                ranges = matches.map(function (match) {
                    return new Range(i, match.offset, i, match.offset + match.length);
                });
                // TODO: The zero-length case was the empty string, but that does not pass the compiler.
                this.cache[i] = ranges.length ? ranges : [];
            }

            for (let j = ranges.length; j--;) {
                markerLayer.drawSingleLineMarker(html, session.documentToScreenRange(ranges[j]), this.clazz, config);
            }
        }
    }
}

