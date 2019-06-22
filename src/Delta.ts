/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Position } from "./Position";
import { HeavyString } from './HeavyString';


export interface Delta {
    action: 'insert' | 'remove';

    // This isn't really used in the case of 'insert'. It is the position
    // after the inserted text *after* the insertion is complete.
    end: Position;  

    lines: (string | HeavyString)[];
    
    start: Position;
}
