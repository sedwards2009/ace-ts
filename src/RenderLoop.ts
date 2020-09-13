/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */

const MINIMUM_INTERFRAME_TIME_MS = 16;

/**
 * Batches changes (that force something to be redrawn) in the background.
 */
export class RenderLoop {
    pending = false;
    private onRender: (changes: number) => void;
    private changes = 0;
    private _lastRender = 0;

    constructor(onRender: (changes: number) => void) {
        this.onRender = onRender;
        this._checkRender = this._checkRender.bind(this);
        this._renderChanges = this._renderChanges.bind(this);
    }

    schedule(change: number): void {
        this.changes = this.changes | change;
        if ( ! this.pending) {
            queueMicrotask(this._checkRender);
        }
    }

    private _checkRender(): void {
        const now = performance.now();
        const timeSinceLastRender = now - this._lastRender;
        if (timeSinceLastRender > MINIMUM_INTERFRAME_TIME_MS) {
            this._renderChanges();
        } else {
            setTimeout(this._renderChanges, Math.max(0, MINIMUM_INTERFRAME_TIME_MS - timeSinceLastRender + 1));
        }
    }

    private _renderChanges(): void {
        let changes: number;
        while (changes = this.changes) {
            this.changes = 0;
            this.onRender(changes);
        }
        this.pending = false;
    }
}
