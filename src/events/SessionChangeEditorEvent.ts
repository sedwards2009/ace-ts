/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Editor } from '../Editor';

/**
 * 'changeEditor' event emitted by a Session.
 */
export interface SessionChangeEditorEvent {

    /**
     *
     */
    oldEditor?: Editor;

    /**
     *
     */
    editor?: Editor;
}

