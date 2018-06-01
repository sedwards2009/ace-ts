/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
/**
 * 
 */
export enum DiagnosticCategory {
    Warning = 0,
    Error = 1,
    Message = 2
}

/**
 *
 */
export interface Diagnostic {

    /**
     *
     */
    message: string;

    /**
     *
     */
    start: number;

    /**
     *
     */
    length: number;

    /**
     * 
     */
    category: DiagnosticCategory;

    /**
     * number pertains when the diagnostic is a syntax or semantic error.
     * string pertains when the diagnostic is from linting. 
     */
    code: number | string;
}

