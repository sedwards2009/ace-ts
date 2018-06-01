/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export function removeHTMLLinkElement(id: string, dom: Document): void {
    const element = dom.getElementById(id);
    if (element) {
        element.parentNode.removeChild(element);
    }
}

