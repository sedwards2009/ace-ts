/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Range } from "../Range";
import { EditSession } from "../EditSession";

export class MatchingParensOutdent {

    constructor() {
        // Do nothing.
    }

    checkOutdent(line: string, input: string): boolean {
        if (! /^\s+$/.test(line)) {
            return false;
        }
        return /^\s*\)/.test(input);
    }

    autoOutdent(session: EditSession, row: number): void {
        const line = session.getLine(row);
        const match = line.match(/^(\s*\))/);

        if (!match) return;

        const column = match[1].length;
        const openBracePos = session.findMatchingBracket({ row, column });

        if (!openBracePos || openBracePos.row === row) return;

        const indent = this.$getIndent(session.getLine(openBracePos.row));
        session.replace(new Range(row, 0, row, column - 1), indent);
    }

    $getIndent(line: string): string {
        const match = line.match(/^(\s+)/);
        if (match) {
            return match[1];
        }
        return "";
    }
}

