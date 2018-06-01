/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
"use strict";

export const ENABLE_ASSERTS = true;

export class AssertionError implements Error {
    public name = 'AssertionError';
    public message;
    constructor(message, args) {
        this.message = message;
    }
}

function doAssertFailure(defaultMessage: string, defaultArgs, givenMessage: string, givenArgs) {
    let message = 'Assertion failed';
    let args: any;
    if (givenMessage) {
        message += ': ' + givenMessage;
        args = givenArgs;
    }
    else if (defaultMessage) {
        message += ': ' + defaultMessage;
        args = defaultArgs;
    }
    // The '' + works around an Opera 10 bug in the unit tests. Without it,
    // a stack trace is added to message above. With this, a stack trace is
    // not added until this line (it causes the extra garbage to be added after
    // the assertion message instead of in the middle of it).
    throw new AssertionError('' + message, args || []);
}

export function assert(condition, message?, args?) {
    if (ENABLE_ASSERTS && !condition) {
        doAssertFailure('', null, message, Array.prototype.slice.call(arguments, 2));
    }
    return condition;
}

