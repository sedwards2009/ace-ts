/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { RangeBasic as Range } from './RangeBasic';

/**
 *
 */
export interface SearchOptions {

    /**
     * The string or regular expression you're looking for.
     */
    needle?: string | RegExp;

    /**
     *  The Range to search within. Set this to null for the whole document.
     */
    range?: Range;

    /**
     * The starting Range or cursor position to begin the search.
     * The existing selection range.
     */
    start?: Range;

    /**
     * Whether to search backwards from where cursor currently is. Defaults to false.
     */
    backwards?: boolean;

    /**
     *
     */
    $isMultiLine?: boolean;

    /**
     * A multi-line search will have an array of regular expressions.
     */
    re?: RegExp | RegExp[];

    /**
     * TODO: Possible BUG duplicating caseSensitive property?
     */
    preserveCase?: boolean;

    /**
     * Whether the search ought to be case-sensitive. Defaults to false.
     */
    caseSensitive?: boolean;

    /**
     * Whether the search matches only on whole words. Defaults to false.
     */
    wholeWord?: boolean;

    /**
     * Whether or not to include the current line in the search. Default to false.
     */
    skipCurrent?: boolean;


    /**
     * Whether to wrap the search back to the beginning when it hits the end. Defaults to false.
     */
    wrap?: boolean;

    /**
     *
     */
    preventScroll?: boolean;
}

