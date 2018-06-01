/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { getDocumentHead } from './getDocumentHead';

export function appendHTMLLinkElement(id: string, rel: string, type: string, href: string, doc: Document) {
    const link = doc.createElement('link');
    link.id = id;
    link.rel = rel;
    if (typeof type === 'string') {
        link.type = type;
    }
    link.href = href;
    getDocumentHead(doc).appendChild(link);
}

