/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 * Creates a document fragment that is owned by the same document as the specified element.
 */
export function createFragment(element: HTMLDivElement): DocumentFragment {
    const doc = element ? element.ownerDocument : document;
    return doc.createDocumentFragment();
}

