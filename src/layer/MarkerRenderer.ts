/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { MarkerConfig } from './MarkerConfig';
import { RangeBasic } from '../RangeBasic';

export interface MarkerRenderer {
    (html: string[], range: RangeBasic, left: number, top: number, config: MarkerConfig): void;
}

