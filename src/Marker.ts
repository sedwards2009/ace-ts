/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { LayerConfig } from './layer/LayerConfig';
import { IMarkerLayer } from './layer/MarkerLayer';
import { MarkerRenderer } from './layer/MarkerRenderer';
import { EditSession } from './EditSession';
import { OrientedRange as Range } from './RangeBasic';

export type MarkerType = 'fullLine' | 'line' | 'text' | 'screenLine';

/**
 *
 */
export interface Marker {

    /**
     *
     */
    clazz: string;

    /**
     *
     */
    id?: number;

    /**
     *
     */
    inFront?: boolean;

    /**
     *
     */
    range?: Range;

    /**
     *
     */
    renderer?: MarkerRenderer | null;

    /**
     * One of "fullLine", "line", "text", or "screenLine".
     */
    type: MarkerType;

    /**
     * The MarkerLayer will call this method.
     */
    update?: (html: string[], markerLayer: IMarkerLayer, session: EditSession, config: LayerConfig) => void;
}

