/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 *
 */
export function getDocumentHead(doc: Document): HTMLHeadElement {
    return <HTMLHeadElement>(doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement);
}

