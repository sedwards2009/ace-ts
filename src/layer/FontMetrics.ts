/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Disposable } from "../Disposable";
import { Event } from '../Event';


export interface FontMetrics {
    charHeightPx: number;
    charWidthPx: number;
    isBoldCompatible: boolean;
}

export interface FontMetricsMonitor extends Disposable {
    getFontMetrics(): FontMetrics;
    checkForSizeChanges(): void;
    startMonitoring(): number;
    onChange: Event<FontMetrics>;
}
