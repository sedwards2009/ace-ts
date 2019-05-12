/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { EditSession } from '../EditSession';
import { LayerConfig } from './LayerConfig';

export interface GutterRenderer {
    getText(session: EditSession, row: number): string;
    getWidth(session: EditSession, row: number, config: LayerConfig): number;
}

