/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { getDocumentHead } from './getDocumentHead';
import { hasHTMLStyleElement } from './hasHTMLStyleElement';

/**
 *
 */
export function ensureHTMLStyleElement(cssText: string, id: string, doc: Document): void {
    // If style is already imported return immediately.
    if (id && hasHTMLStyleElement(id, doc)) {
        return;
    }
    else {
        const style = doc.createElement('style');
        style.appendChild(doc.createTextNode(cssText));
        if (id) {
            style.id = id;
        }
        getDocumentHead(doc).appendChild(style);
    }
}

