/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Completer } from '../Completer';
import { Completion } from '../Completion';
import { Editor } from '../Editor';
import { EditSession } from '../EditSession';
import { Position } from '../Position';

export interface KeywordCompleterEditor extends Editor {
    getSession(): EditSession | undefined;
}

/**
 * Provides completions for a language mode.
 */
export class KeywordCompleter implements Completer {

    getCompletionsAtPosition(editor: KeywordCompleterEditor, position: Position, prefix: string): Promise<Completion[]> {

        const session = editor.getSession();

        return new Promise<Completion[]>(function (resolve, reject) {
            if (session) {
                const state = session.getState(position.row);
                const completions = session.modeOrThrow().getCompletions(state, session, position, prefix);
                resolve(completions);
            }
            else {
                console.warn("editor session is not available.");
                resolve([]);
            }
        });
    }

    getCompletions(editor: KeywordCompleterEditor, position: Position, prefix: string, callback: (err: any, completions?: Completion[]) => void) {
        return this.getCompletionsAtPosition(editor, position, prefix)
            .then(function (completions) {
                callback(void 0, completions);
            })
            .catch(function (err) {
                callback(err);
            });
    }
}

