/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 * The annotation type determines the graphic used in the gutter.
 */
export type AnnotationType = 'info' | 'warning' | 'error';

/**
 * 
 */
export interface Annotation {

    /**
     *
     */
    className?: string;

    /**
     *
     */
    html?: string;

    /**
     *
     */
    row: number;

    /**
     *
     */
    column?: number;

    /**
     *
     */
    text: string;

    /**
     *
     */
    type: AnnotationType;
}

