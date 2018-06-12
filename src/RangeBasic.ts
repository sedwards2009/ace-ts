/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Position, equalPositions } from './Position';

/**
 * 
 */
export interface RangeBasic {
    /**
     * The starting position of the range.
     */
    start: Position;
    /**
     * The ending position of the range.
     */
    end: Position;
}

export interface RangeWithCollapseChildren extends RangeBasic {
    collapseChildren: number;
}

export interface RangeWithMarkerId extends RangeBasic {
    markerId: number;
}

export interface OrientedRange extends RangeWithCollapseChildren {
    cursor: Position;
    desiredColumn: number | null;
    isBackwards: boolean;
}

export interface RangeSelectionMarker extends OrientedRange, RangeWithMarkerId {
}

/**
 * The range is empty if the start and end position coincide.
 */
export function isRangeEmpty(range: RangeBasic): boolean {
    return equalPositions(range.start, range.end);
}

