/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 * A function that examines a line and return yay or nay.
 */
export interface LineFilter {
    (line: string, row: number, column?: number): boolean;
}

