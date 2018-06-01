/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 * A wrapper around a callback function that allows the function to be scheduled.
 * After the callback has been executed it may be scheduled again.
 */
export interface DelayedCall {
    // TODO: This multiple way of doing things just makes the implementation more tricky
    // and does not add to the API. A pure functional constructor of an object seems better.
    (timeout: number): void;
    delay(timeout: number): void;
    cancel(): void;
    isPending(): boolean;
    schedule(timeout?: number): void;
}

