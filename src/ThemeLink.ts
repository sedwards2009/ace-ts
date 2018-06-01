/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 *
 */
export class ThemeLink {

    /**
     *
     */
    isDark: boolean;

    /**
     *
     */
    id: string;

    /**
     *
     */
    rel: string;

    /**
     *
     */
    type: string;

    /**
     *
     */
    href: string;

    /**
     *
     */
    padding: number;

    /**
     *
     */
    constructor(isDark: boolean, id: string, rel: string, type: string, href: string, padding: number) {
        if (typeof padding !== 'number') {
            throw new TypeError("padding must be a number");
        }
        this.isDark = isDark;
        this.id = id;
        this.rel = rel;
        this.type = type;
        this.href = href;
        this.padding = padding;
    }
}

