/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Editor } from './Editor';
import { EditSession } from './EditSession';
import { Fold } from './Fold';

/**
 *
 */
export interface LineWidget {
    html?: string;
    row: number;
    rowCount?: number;
    coverLine?: boolean;
    coverGutter: boolean;
    session?: EditSession | null;
    editor?: Editor;
    h?: number;
    w?: number;
    el: HTMLDivElement;
    pixelHeight?: number;
    fixedWidth?: boolean;
    fullWidth?: boolean;
    screenWidth?: number;
    type?: 'errorMarker';
    hidden?: boolean;
    _inDocument?: boolean;
    $oldWidget?: LineWidget;
    $fold?: Fold | null;
    destroy?: () => any;
}

