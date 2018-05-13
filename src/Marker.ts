import { MarkerConfig } from './layer/MarkerConfig';
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
    update?: (html: (number | string)[], markerLayer: IMarkerLayer, session: EditSession, config: MarkerConfig) => void;
}
