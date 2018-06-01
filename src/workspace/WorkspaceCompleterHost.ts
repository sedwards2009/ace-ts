/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { CompletionEntry } from './CompletionEntry';

export interface WorkspaceCompleterHost {
    /**
     * TODO: Parameterize position?
     */
    getCompletionsAtPosition(path: string, position: number, prefix: string): Promise<CompletionEntry[]>;
}

