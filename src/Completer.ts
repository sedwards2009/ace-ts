/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Completion } from './Completion';
import { Position } from './Position';

export interface CompleterEditor {

}

/**
 *
 */
export interface Completer {

    /**
     *
     */
    identifierRegexps?: RegExp[];

    /**
     *
     */
    getCompletionsAtPosition(editor: CompleterEditor, position: Position, prefix: string): Promise<Completion[]>;

    /**
     *
     */
    // getCompletions(editor: CompleterEditor, position: Position, prefix: string, callback: (err: any, results: Completion[]) => any): void;

    /**
     * The completer may, optionally, define how it wants insertions to be performed.
     * TODO: But how does it know what the insertion is?
     */
    insertMatch?(editor: CompleterEditor): void;

    /**
     *
     */
    getDocTooltip?(completion: Completion): any;
}

