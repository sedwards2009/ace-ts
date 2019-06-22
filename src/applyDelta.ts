/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Delta } from './Delta';

export function applyDelta(docLines: string[], delta: Delta, doNotValidate?: boolean): void {

    // Disabled validation since it breaks autocompletion popup.
    /*
    if (!doNotValidate) {
        validateDelta(docLines, delta);
    }
    */

    const row = delta.start.row;
    const startColumn = delta.start.column;
    const line = docLines[row] || "";
    switch (delta.action) {
        case "insert":
            const lines: string[] = delta.lines.map(line => ((typeof line === "string") ? line : line.getString()));
            if (lines.length === 1) {
                docLines[row] = line.substring(0, startColumn) + lines[0] + line.substring(startColumn);
            } else {
                let args: any[] = [row, 1];
                args = args.concat(lines);
                docLines.splice.apply(docLines, args);
                docLines[row] = line.substring(0, startColumn) + docLines[row];
                docLines[row + lines.length - 1] += line.substring(startColumn);
            }
            break;
        case "remove":
            const endColumn = delta.end.column;
            const endRow = delta.end.row;
            if (row === endRow) {
                docLines[row] = line.substring(0, startColumn) + line.substring(endColumn);
            } else {
                docLines.splice(
                    row, endRow - row + 1,
                    line.substring(0, startColumn) + docLines[endRow].substring(endColumn)
                );
            }
            break;
        default: {
            // Do nothing.
        }
    }
}

