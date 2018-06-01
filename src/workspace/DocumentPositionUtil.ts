/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Document } from '../Document';
import { Position } from '../Position';

export function getLinesChars(lines: string[]): number {
    let count = 0;
    lines.forEach(function (line) {
        count += line.length + 1;
        return;
    });
    return count;
}

export function getChars(doc: Document, pos: Position): number {
    return getLinesChars(doc.getLines(0, pos.row - 1)) + pos.column;
}

