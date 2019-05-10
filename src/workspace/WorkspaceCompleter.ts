/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Completion } from '../Completion';
import { CompletionEntry } from './CompletionEntry';
import { Position } from "./Position";
import { WorkspaceCompleterHost } from './WorkspaceCompleterHost';
import { Completer } from '../Completer';
import { Editor } from '../Editor';

/**
 *
 */
export class WorkspaceCompleter implements Completer {

    private workspace: WorkspaceCompleterHost;
    private fileName: string;

    constructor(fileName: string, workspace: WorkspaceCompleterHost) {
        this.fileName = fileName;
        this.workspace = workspace;
    }

    /**
     *
     */
    getCompletionsAtPosition(editor: Editor, position: Position, prefix: string): Promise<Completion[]> {
        return new Promise<Completion[]>((resolve: (completions: Completion[]) => any, reject: (err: any) => any) => {
            const session = editor.getSession();
            if (session) {
                this.workspace.getCompletionsAtPosition(this.fileName, session.positionToIndex(position), prefix)
                    .then(function (entries: CompletionEntry[]) {
                        resolve(entries.map(function (entry) {
                            return {
                                caption: entry.name,
                                value: entry.name,
                                score: 0,
                                meta: entry.kind
                            };
                        }));
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                reject(new Error("session is missing"));
            }
        });
    }

    getCompletions(editor: Editor, position: Position, prefix: string, callback: (err: any, completions?: Completion[]) => void): void {
        this.getCompletionsAtPosition(editor, position, prefix)
            .then(function (completions) {
                callback(undefined, completions);
            })
            .catch(function (err) {
                callback(err);
            });
    }
}

