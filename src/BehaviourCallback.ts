/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Editor } from "./Editor";
import { EditSession } from "./EditSession";

export interface BehaviorCallbackThis {
    $getIndent: (line: string) => string;
    voidElements: { [name: string]: number };
}

/**
 *
 */
export interface BehaviourCallback {
    /**
     * Executing the callback function returns a polymorphic value.
     *
     * @param state
     * @param action
     * @param editor
     * @param editSession
     * @param data
     */
    (this: BehaviorCallbackThis, state: string, action: string, editor: Editor, session: EditSession, data: any): any;
}

