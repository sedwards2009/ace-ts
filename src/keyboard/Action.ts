/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 * An action that is performed in the context of an <code>Editor</code>.
 */
export interface Action<TARGET> {
    (handler: TARGET, args?: any): void;
}

