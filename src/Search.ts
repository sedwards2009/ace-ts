/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { escapeRegExp, getMatchOffsets } from "./lib/lang";
import { fillDefaults } from "./lib/oop";
import { LineFilter } from './LineFilter';
import { MatchHandler } from './MatchHandler';
import { MatchOffset } from './lib/MatchOffset';
import { Position } from './Position';
import { Range } from "./Range";
import { isEqual } from "./RangeHelpers";
import { RangeBasic } from "./RangeBasic";
import { SearchOptions } from "./SearchOptions";
import { Selection } from './Selection';

/**
 * The contract for the Search class.
 */
export interface EditSession {
    getAllLines(): string[];
    getLength(): number;
    getLine(row: number): string;
    getLines(firstRow: number, lastRow: number): string[];
    selection: Selection | undefined;
}

const defaultOptions: SearchOptions = {
    needle: null,
    range: null,
    start: null,
    backwards: false,
    $isMultiLine: false,
    re: null,
    preserveCase: false,
    caseSensitive: true,
    wholeWord: true,
    skipCurrent: true,
    wrap: false,
    preventScroll: false
};

/**
 * A class designed to handle all sorts of text searches within a Document.
 */
export class Search {

    /**
     * Searches for `options.needle`.
     * If found, this method returns the Range where the text first occurs.
     * If `options.backwards` is `true`, the search goes backwards in the session.
     *
     * @param session The session to search with.
     */
    find(session: EditSession, givenOptions: SearchOptions): Range {
        const options = fillDefaults(givenOptions, defaultOptions);

        /**
         * A boolean or an iterable object, with a forEach method.
         */
        const matches = $matchIterator(session, options);
        if (matches == null) {
            return null;
        }

        let firstRange: Range = null;
        // Note: row and startIndex in the callback go with the first callback argument being a MatchOffset.
        matches.forEach(function (range: MatchOffset | Range, row: number, startIndex: number): boolean {
            if (range instanceof Range) {
                firstRange = range;
            }
            else {
                const column = range.offset + (startIndex || 0);
                firstRange = new Range(row, column, row, column + range.length);
                if (!range.length && options.start && options.start.start && options.skipCurrent !== false && isEqual(firstRange, options.start)) {
                    firstRange = null;
                    return false;
                }
            }
            return true;
        });
        return firstRange;
    }

    /**
     * Searches for all occurances `options.needle`.
     * If found, this method returns an array of [[Range `Range`s]] where the text first occurs.
     * If `options.backwards` is `true`, the search goes backwards in the session.
     *
     * @param session The session to search with.
     */
    findAll(session: EditSession, givenOptions: SearchOptions): Range[] {
        const options = fillDefaults(givenOptions, defaultOptions);

        if (!options.needle) {
            // If we are not looking for anything, return an empty array of Range(s).
            return [];
        }

        options.re = assembleRegExp(options);

        const range = options.range;
        const lines: string[] = range ? session.getLines(range.start.row, range.end.row) : session.getAllLines();

        let ranges: Range[] = [];
        if (options.$isMultiLine) {
            // When multiLine, re is an array of RegExp.
            const re = <RegExp[]>options.re;
            const len = re.length;
            const maxRow = lines.length - len;
            let prevRange: Range | undefined;
            // TODO: What is this offset property?
            outer: for (let row = re['offset'] || 0; row <= maxRow; row++) {
                for (let j = 0; j < len; j++)
                    if (lines[row + j].search(re[j]) === -1)
                        continue outer;

                const startLine = lines[row];
                const line = lines[row + len - 1];
                const startIndex = startLine.length - (startLine.match(re[0]) as RegExpMatchArray)[0].length;
                const endIndex = (line.match(re[len - 1]) as RegExpMatchArray)[0].length;

                if (prevRange && prevRange.end.row === row && prevRange.end.column > startIndex) {
                    continue;
                }
                ranges.push(prevRange = new Range(
                    row, startIndex, row + len - 1, endIndex
                ));
                if (len > 2)
                    row = row + len - 2;
            }
        }
        else {
            // TODO: How did we eliminate the case when options.re is false (boolean)?
            const re = <RegExp>options.re;
            for (let i = 0; i < lines.length; i++) {
                const matches = getMatchOffsets(lines[i], re);
                for (let j = 0; j < matches.length; j++) {
                    const match = matches[j];
                    ranges.push(new Range(i, match.offset, i, match.offset + match.length));
                }
            }
        }

        if (range) {
            const startColumn = range.start.column;
            const endColumn = range.start.column;
            let i = 0;
            let j = ranges.length - 1;
            while (i < j && ranges[i].start.column < startColumn && ranges[i].start.row === range.start.row)
                i++;

            while (i < j && ranges[j].end.column > endColumn && ranges[j].end.row === range.end.row)
                j--;

            ranges = ranges.slice(i, j + 1);
            for (i = 0, j = ranges.length; i < j; i++) {
                ranges[i].start.row += range.start.row;
                ranges[i].end.row += range.start.row;
            }
        }

        return ranges;
    }

    /**
     * Searches for `options.needle` in `input`, and, if found, replaces it with `replacement`.
     *
     * @param input The text to search in
     * @param replacement The replacing text
     * + (String): If `options.regExp` is `true`, this function returns `input` with the replacement already made. Otherwise, this function just returns `replacement`.<br/>
     * If `options.needle` was not found, this function returns `null`.
     */
    replace(input: string, replacement: string, options?: SearchOptions): string | null | undefined {
        if (options == null) {
            options = defaultOptions;
        }

        const re = assembleRegExp(options);
        options.re = re;
        if (options.$isMultiLine) {
            // This eliminates the RegExp[]
            return replacement;
        }

        if (!re) {
            // Presumably, the boolean is always false?
            return undefined;
        }

        const match: RegExpExecArray | null = (<RegExp>re).exec(input);
        if (!match || match[0].length !== input.length) {
            return null;
        }

        replacement = input.replace(<RegExp>re, replacement);
        if (options.preserveCase) {
            const parts: string[] = replacement.split("");
            for (let i = Math.min(input.length, input.length); i--;) {
                const ch = input[i];
                if (ch && ch.toLowerCase() !== ch)
                    parts[i] = parts[i].toUpperCase();
                else
                    parts[i] = parts[i].toLowerCase();
            }
            replacement = parts.join("");
        }

        return replacement;
    }
}

function $matchIterator(session: EditSession, options: SearchOptions): { forEach: (callback: MatchHandler) => void } {
    options.re = assembleRegExp(options);
    const re = options.re;

    if (!re) {
        // This eliminates the case where re is a boolean.
        return null;
    }

    let callback: MatchHandler;
    const backwards = options.backwards;
    let lineFilter: LineFilter;
    if (options.$isMultiLine) {
        const len = (<RegExp[]>re).length;
        lineFilter = function (line: string, row: number, offset: number): boolean {
            const startIndex = line.search(re[0]);
            if (startIndex === -1)
                return false;
            for (let i = 1; i < len; i++) {
                line = session.getLine(row + i);
                if (line.search(re[i]) === -1)
                    return false;
            }

            const endIndex = (line.match(re[len - 1]) as RegExpMatchArray)[0].length;

            const range = new Range(row, startIndex, row + len - 1, endIndex);
            // FIXME: What's going on here?
            if ((<RegExp[]>re)['offset'] === 1) {
                range.start.row--;
                range.start.column = Number.MAX_VALUE;
            }
            else if (offset) {
                range.start.column += offset;
            }

            if (callback(range)) {
                return true;
            }
            return false;
        };
    }
    else if (backwards) {
        lineFilter = function (line: string, row: number, startIndex: number): boolean {
            const matches = getMatchOffsets(line, <RegExp>re);
            for (let i = matches.length - 1; i >= 0; i--) {
                if (callback(matches[i], row, startIndex)) {
                    return true;
                }
            }
            return false;
        };
    }
    else {
        lineFilter = function (line: string, row: number, startIndex: number): boolean {
            const matches = getMatchOffsets(line, <RegExp>re);
            for (let i = 0; i < matches.length; i++) {
                if (callback(matches[i], row, startIndex)) {
                    return true;
                }
            }
            return false;
        };
    }

    return {
        forEach: (_callback) => {
            callback = _callback;
            $lineIterator(session, options).forEach(lineFilter);
        }
    };
}

function addWordBoundary(needle: string): string {
    function wordBoundary(c: string): string {
        if (/\w/.test(c)) return "\\b";
        if (/\W/.test(c)) return "\\B";
        return "";
    }
    return wordBoundary(needle[0]) + needle + wordBoundary(needle[needle.length - 1]);
}

export function assembleRegExp(options: SearchOptions, $disableFakeMultiline?: boolean): RegExp | RegExp[] {
    if (options.needle == null) {
        return null;
    }
    
    if (options.needle instanceof RegExp) {
        return <RegExp>options.needle;
    }
    
    if (typeof options.needle === 'string') {
        let needleString = <string>options.needle;

        if (options.wholeWord) {
            needleString = addWordBoundary(needleString);
        }

        const modifier: string = options.caseSensitive ? "gm" : "gmi";

        options.$isMultiLine = !$disableFakeMultiline && /[\n\r]/.test(needleString);
        if (options.$isMultiLine) {
            return $assembleMultilineRegExp(needleString, modifier);
        }

        try {
            return new RegExp(needleString, modifier);
        }
        catch (e) {
            return null;
        }
    } else {
        throw new Error(`typeof options.needle => ${typeof options.needle}`);
    }
}

function $assembleMultilineRegExp(needle: string, modifier: string): RegExp[] | undefined {
    const parts: string[] = needle.replace(/\r\n|\r|\n/g, "$\n^").split("\n");
    const re: RegExp[] = [];
    for (let i = 0; i < parts.length; i++) {
        try {
            re.push(new RegExp(parts[i], modifier));
        }
        catch (e) {
            return undefined;
        }
    }
    // FIXME: We're sneaking a property onto the array of RegExp.
    // Better to return a class with {offset: number; regExps: RegExp[]}
    if (parts[0] === "") {
        re.shift();
        re['offset'] = 1;
    }
    else {
        re['offset'] = 0;
    }
    return re;
}

function $lineIterator(session: EditSession, options: SearchOptions): { forEach: (lineFilter: LineFilter) => void } {
    const backwards = options.backwards;

    const startPos = getStartPosition(session, options);
    const range = options.range;
    let firstRow = range ? range.start.row : 0;
    let lastRow = range ? range.end.row : session.getLength() - 1;

    if (backwards) {
        return {
            forEach(lineFilter: LineFilter) {
                let row = startPos.row;

                const line = session.getLine(row).substring(0, startPos.column);
                if (lineFilter(line, row)) {
                    return;
                }

                for (row--; row >= firstRow; row--) {
                    if (lineFilter(session.getLine(row), row)) {
                        return;
                    }
                }

                if ( ! options.wrap) {
                    return;
                }

                for (row = lastRow, firstRow = startPos.row; row >= firstRow; row--) {
                    if (lineFilter(session.getLine(row), row)) {
                        return;
                    }
                }
            }
        };
    } else {
        return {
            forEach(callback: LineFilter) {
                let row = startPos.row;

                const line = session.getLine(row).substr(startPos.column);
                if (callback(line, row, startPos.column)) {
                    return;
                }

                for (row = row + 1; row <= lastRow; row++) {
                    if (callback(session.getLine(row), row)) {
                        return;
                    }
                }
                if ( ! options.wrap) {
                    return;
                }

                for (row = firstRow, lastRow = startPos.row; row <= lastRow; row++) {
                    if (callback(session.getLine(row), row)) {
                        return;
                    }
                }
            }
        };
    }
}

/**
 * Returns the appropriate property of the range (start or end) according to the
 * direction of the search and whether the currently selected range should be skipped.
 */
function getRangePosition(range: RangeBasic, options: SearchOptions): Position {
    const backwards = options.backwards;
    const skipCurrent = options.skipCurrent !== false;
    return skipCurrent !== backwards ? range.end : range.start;
}

function getStartPosition(session: EditSession, options: SearchOptions): Position {
    const backwards = options.backwards;
    if ( ! options.start) {
        if (options.range) {
            // TODO: Why doesn't options.range follow the same rules using skipCurrent?
            return backwards ? options.range.end : options.range.start;
        }
        else {
            if (session.selection) {
                return getRangePosition(session.selection.getRange(), options);
            }
            else {
                throw new Error("Unable to get a start position without a selection.");
            }
        }
    }
    else {
        return getRangePosition(options.start, options);
    }
}

