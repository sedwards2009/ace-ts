/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export interface Change {
    action: string;
    data: { start: { row: number; column: number }; end: { row: number; column: number } };
}

