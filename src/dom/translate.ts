/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export function translate(element: HTMLDivElement, tx: number, ty: number) {
    element.style.top = Math.round(ty) + "px";
    element.style.left = Math.round(tx) + "px";
}

