/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export interface EventBus<NAME, E, SOURCE> {
    on(eventName: NAME, callback: (event: E, source: SOURCE) => any, capturing?: boolean): void;
    off(eventName: NAME, callback: (event: E, source: SOURCE) => any): void;
}

