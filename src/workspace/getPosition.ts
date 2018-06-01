/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Position } from './Position';

export interface DocumentWithLines {
    getAllLines(): string[];
}

export function getPosition(doc: DocumentWithLines, chars: number): Position {
    const lines: string[] = doc.getAllLines();
    let count = 0;
    let row = 0;
    for (let i = 0, iLength = lines.length; i < iLength; i++) {
        let line = lines[i];
        if (chars < (count + (line.length + 1))) {
            return { column: chars - count, row: row };
        }
        count += line.length + 1;
        row += 1;
    }
    return { column: chars - count, row: row };
}

