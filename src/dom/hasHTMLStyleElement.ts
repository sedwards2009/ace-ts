/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export function hasHTMLStyleElement(id: string, doc: Document) {
    let index = 0;
    const styles = doc.getElementsByTagName('style');

    if (styles) {
        while (index < styles.length) {
            if (styles[index++].id === id) {
                return true;
            }
        }
    }
    return false;
}

