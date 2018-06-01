/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 *
 */
export interface TextSpan<POSITION> {

    /**
     *
     */
    start: POSITION;

    /**
     *
     */
    length: number;
}

/**
 * Computes the end of the span as start + length.
 * This means that the end is the character after the last character.
 */
export function textSpanEnd(span: TextSpan<number>): number {
    return span.start + span.length;
}

