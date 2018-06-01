/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
// import { RuleToken } from './Rule';
/**
 * 
 */
export interface BasicToken {
    /**
     *
     */
    type: string;

    /**
     *
     */
    value: string;
}

export interface IndexStart {
    /**
     * The index of the token in the row from which it was taken.
     */
    index: number;

    /**
     * The start column.
     */
    start: number;
}

export interface TokenWithIndex extends BasicToken, IndexStart {
}

/**
 * This function is inherently type-unsafe so we co-locate it with the interfaces.
 */
export function mutateExtendToken(basicToken: BasicToken, index: number, start: number): TokenWithIndex {
    const token = <TokenWithIndex>basicToken;
    token.index = index;
    token.start = start;
    return token;
}

/**
 * The implementation of the EditSession.getTokenAt method mutates the tokens provided by the
 * background tokenizer and so we are forced to model the token as having the basic properties,
 * which are type and value, and optional properties, index and start.
 */
export interface Token extends BasicToken, Partial<IndexStart> {
}

