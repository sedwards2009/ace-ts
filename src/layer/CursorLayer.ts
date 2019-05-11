/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { addCssClass, createElement, removeCssClass, setCssClass } from "../lib/dom";
import { AbstractLayer } from './AbstractLayer';
import { CursorConfig } from './CursorConfig';
import { Disposable } from '../Disposable';
import { EditSession } from '../EditSession';
import { PixelPosition } from '../PixelPosition';
import { Position } from '../Position';
import { Interval } from '../Interval';

const PIXEL_POSITION_ZERO = { left: 0, top: 0 };

/**
 * This class is the HTML representation of the CursorLayer.
 */
export class CursorLayer extends AbstractLayer implements Disposable {
    private session: EditSession;
    private isVisible = false;
    isBlinking = true;
    private blinkInterval = 1000;
    private smoothBlinking = false;
    private readonly blinker = new Interval();
    private timeoutId: number;
    private cursors: HTMLDivElement[] = [];
    cursor: HTMLDivElement;
    private overwrite: boolean;
    private $updateCursors: (opacity: boolean) => void;
    config: CursorConfig;
    $pixelPos: PixelPosition;

    constructor(parent: HTMLElement) {
        super(parent, "ace_layer ace_cursor-layer");

        this.cursor = this.addCursor();
        addCssClass(this.element, "ace_hidden-cursors");
        this.$updateCursors = this.$updateOpacity;
    }

    dispose(): void {
        this.blinker.release();
        clearTimeout(this.timeoutId);
        super.dispose();
    }

    /**
     * A handler, which explains the need for the fat arrow.
     */
    private $updateVisibility = (visible: boolean): void => {
        const cursors = this.cursors;
        for (let i = cursors.length; i--;) {
            cursors[i].style.visibility = visible ? "" : "hidden";
        }
    }

    /**
     * A handler, which explains the need for the fat arrow.
     */
    private $updateOpacity = (opacity: boolean): void => {
        const cursors = this.cursors;
        for (let i = cursors.length; i--;) {
            cursors[i].style.opacity = opacity ? "" : "0";
        }
    }

    setSession(session: EditSession): void {
        this.session = session;
    }

    setBlinking(blinking: boolean) {
        if (blinking !== this.isBlinking) {
            this.isBlinking = blinking;
            this.restartTimer();
        }
    }

    setBlinkInterval(blinkInterval: number): void {
        if (blinkInterval !== this.blinkInterval) {
            this.blinkInterval = blinkInterval;
            this.restartTimer();
        }
    }

    setSmoothBlinking(smoothBlinking: boolean): void {
        if (smoothBlinking !== this.smoothBlinking) {
            this.smoothBlinking = smoothBlinking;
            setCssClass(this.element, "ace_smooth-blinking", smoothBlinking);
            this.$updateCursors(true);
            // TODO: Differs from ACE...
            this.$updateCursors = (smoothBlinking ? this.$updateOpacity : this.$updateVisibility).bind(this);
            this.restartTimer();
        }
    }

    private addCursor(): HTMLDivElement {
        const cursor: HTMLDivElement = <HTMLDivElement>createElement("div");
        cursor.className = "ace_cursor";
        this.element.appendChild(cursor);
        this.cursors.push(cursor);
        return cursor;
    }

    private removeCursor(): HTMLDivElement | undefined {
        if (this.cursors.length > 1) {
            const cursor = <HTMLDivElement>this.cursors.pop();
            (<Node>cursor.parentNode).removeChild(cursor);
            return cursor;
        }
        return undefined;
    }

    hideCursor(): void {
        this.isVisible = false;
        addCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    }

    showCursor(): void {
        this.isVisible = true;
        removeCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    }

    restartTimer(): void {
        const update = this.$updateCursors;

        this.blinker.off();

        clearTimeout(this.timeoutId);
        if (this.smoothBlinking) {
            removeCssClass(this.element, "ace_smooth-blinking");
        }

        update(true);

        if (!this.isBlinking || !this.blinkInterval || !this.isVisible)
            return;

        if (this.smoothBlinking) {
            setTimeout(() => {
                addCssClass(this.element, "ace_smooth-blinking");
            });
        }

        const blink = () => {
            this.timeoutId = window.setTimeout(() => {
                update(false);
            }, 0.6 * this.blinkInterval);
        };

        this.blinker.on(function () { update(true); blink(); }, this.blinkInterval);

        blink();
    }

    /**
     * Computes the pixel position relative to the top-left corner of the cursor layer.
     * If the position is not supplied, the cursor position of the selection is used.
     * The number of rows is multiplied by the line height.
     * The number of columns is multiplied by the character width.
     * The padding is added to the left property only.
     */
    getPixelPosition(position: Position | null, onScreen=false): PixelPosition {
        if ( ! this.config) {
            // This happens because of the gotoLine(0, 0) call that is made
            // in the editor component. Maybe that call is a bit too eager.
            // console.warn("getPixelPosition called without a config");
            return PIXEL_POSITION_ZERO;
        }

        if ( ! this.session) {
            console.warn("getPixelPosition called without a session");
            return PIXEL_POSITION_ZERO;
        }

        const firstRow = onScreen ? this.config.firstRowScreen : 0;

        if ( ! position) {
            const selection = this.session.getSelection();
            if (selection) {
                position = selection.getCursor();
                return this.getPixelPositionForRow(position, firstRow);
            } else {
                console.warn("getPixelPosition called without a selection");
                return PIXEL_POSITION_ZERO;
            }
        } else {
            return this.getPixelPositionForRow(position, firstRow);
        }
    }

    private getPixelPositionForRow(position: Position, firstRow: number): PixelPosition {
        const pos = this.session.documentToScreenPosition(position.row, position.column);
        const cursorLeft = pos.column * this.config.characterWidth;
        const cursorTop = (pos.row - firstRow) * this.config.lineHeight;

        return { left: cursorLeft, top: cursorTop };
    }

    update(config: CursorConfig): void {
        this.config = config;

        // Selection markers is a concept from multi selection.
        let selections: { cursor: Position | null }[] = this.session.$selectionMarkers;

        let cursorIndex = 0;

        if (selections === undefined || selections.length === 0) {
            selections = [{ cursor: null }];
        }

        let pixelPos: PixelPosition = { left: 0, top: 0 };

        const n = selections.length;
        for (let i = 0; i < n; i++) {
            pixelPos = this.getPixelPosition(selections[i].cursor, true);

            if ((pixelPos.top > config.height + config.offset ||
                pixelPos.top < 0) && i > 1) {
                continue;
            }

            const style = (this.cursors[cursorIndex++] || this.addCursor()).style;

            style.left = pixelPos.left + "px";
            style.top = pixelPos.top + "px";
            style.width = config.characterWidth + "px";
            style.height = config.lineHeight + "px";
        }

        while (this.cursors.length > cursorIndex) {
            this.removeCursor();
        }

        const overwrite = this.session.getOverwrite();
        this.$setOverwrite(overwrite);

        // cache for textarea and gutter highlight
        this.$pixelPos = pixelPos;
        this.restartTimer();
    }

    private $setOverwrite(overwrite: boolean) {
        if (overwrite !== this.overwrite) {
            this.overwrite = overwrite;
            if (overwrite) {
                addCssClass(this.element, "ace_overwrite-cursors");
            } else {
                removeCssClass(this.element, "ace_overwrite-cursors");
            }
        }
    }
}
