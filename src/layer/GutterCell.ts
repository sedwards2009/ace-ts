/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 * A data structure used by the GutterLayer.
 */
export interface GutterCell {
    element: HTMLDivElement;
    textNode: Text;
    foldWidget: HTMLSpanElement | null;
}

