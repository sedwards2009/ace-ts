/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { createElement } from "../lib/dom";
import { stringRepeat } from "../lib/lang";
import { Disposable } from "../Disposable";
import { Event } from '../Event';
import { EventEmitter } from "../EventEmitter";


export interface FontMetrics {
    charHeightPx: number;
    charWidthPx: number;
    isBoldCompatible: boolean;
}

let CHAR_COUNT = 0;

/**
 * FontMetricsMonitor sets up a timer that repeatedly checks for changes in font sizes.
 * It is used by the Renderer.
 */
export class FontMetricsMonitor implements Disposable {
    private el: HTMLDivElement;
    private $main: HTMLDivElement;
    private $measureNode: HTMLDivElement;

    private _fontMetrics: FontMetrics = { charWidthPx: 8, charHeightPx: 8, isBoldCompatible: false };

    private $pollSizeChangesTimer: number;

    private _onChangeEventEmitter = new EventEmitter<FontMetrics>();
    onChange: Event<FontMetrics>;

    // FIXME: The interval should be being used to configure the polling interval (normally 500ms)
    constructor(parent: HTMLElement, pollingInterval: number) {
        this.onChange = this._onChangeEventEmitter.event;

        this.el = <HTMLDivElement>createElement("div");
        this.$setMeasureNodeStyles(this.el.style, true);

        this.$main = <HTMLDivElement>createElement("div");
        this.$setMeasureNodeStyles(this.$main.style);

        this.$measureNode = <HTMLDivElement>createElement("div");
        this.$setMeasureNodeStyles(this.$measureNode.style);

        this.el.appendChild(this.$main);
        this.el.appendChild(this.$measureNode);
        parent.appendChild(this.el);

        if (!CHAR_COUNT) {
            this.$testFractionalRect();
        }
        this.$measureNode.innerHTML = stringRepeat("X", CHAR_COUNT);

        this.checkForSizeChanges();
    }

    dispose(): void {
        clearInterval(this.$pollSizeChangesTimer);
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }

    getFontMetrics(): FontMetrics {
        return this._fontMetrics;
    }

    private $testFractionalRect(): void {
        const el = <HTMLDivElement>createElement("div");
        this.$setMeasureNodeStyles(el.style);
        el.style.width = "0.2px";
        document.documentElement.appendChild(el);
        const w = el.getBoundingClientRect().width;
        CHAR_COUNT = (w > 0 && w < 1) ? 50 : 100;
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    private $setMeasureNodeStyles(style: CSSStyleDeclaration, isRoot?: boolean): void {
        style.width = style.height = "auto";
        style.left = style.top = "0px";
        style.visibility = "hidden";
        style.position = "absolute";
        style.whiteSpace = "pre";
        style.font = "inherit";
        style.overflow = isRoot ? "hidden" : "visible";
    }

    checkForSizeChanges(): void {
        const newRawFontMetrics = this.$measureFontDimensions();
        if (newRawFontMetrics != null &&
                (this._fontMetrics.charWidthPx !== newRawFontMetrics.charWidthPx ||
                    this._fontMetrics.charHeightPx !== newRawFontMetrics.charHeightPx)) {
            this.$measureNode.style.fontWeight = "bold";
            let isBoldCompatible = false;
            try {
                const boldFontMetrics = this.$measureFontDimensions();
                if (boldFontMetrics != null) {
                    isBoldCompatible = boldFontMetrics.charWidthPx === newRawFontMetrics.charWidthPx &&
                                        boldFontMetrics.charHeightPx === newRawFontMetrics.charHeightPx;
                } else {
                    isBoldCompatible = false;
                }
            }
            finally {
                this.$measureNode.style.fontWeight = "";
            }
            this._fontMetrics = { ...newRawFontMetrics, isBoldCompatible };
            this._onChangeEventEmitter.fire(this._fontMetrics);
        }
    }

    startPolling(): number {
        if (this.$pollSizeChangesTimer) {
            return this.$pollSizeChangesTimer;
        }
        return this.$pollSizeChangesTimer = window.setInterval(() => {
            this.checkForSizeChanges();
        }, 500);
    }

    setPolling(val: boolean): void {
        if (val) {
            this.startPolling();
        }
        else {
            if (this.$pollSizeChangesTimer) {
                clearInterval(this.$pollSizeChangesTimer);
                this.$pollSizeChangesTimer = 0;
            }
        }
    }

    private $measureFontDimensions(): { charWidthPx: number, charHeightPx: number } {
        let fontMetrics: { charWidthPx: number, charHeightPx: number };
        if (CHAR_COUNT === 50) {
            let rect: ClientRect;
            try {
                rect = this.$measureNode.getBoundingClientRect();
            }
            catch (e) {
                rect = { width: 0, height: 0, left: 0, right: 0, top: 0, bottom: 0 };
            }
            fontMetrics = {
                charHeightPx: rect.height,
                charWidthPx: rect.width / CHAR_COUNT
            };
        } else {
            fontMetrics = {
                charHeightPx: this.$measureNode.clientHeight,
                charWidthPx: this.$measureNode.clientWidth / CHAR_COUNT
            };
        }
        // width and height can be null if the editor is not visible or detached from the document.
        if (fontMetrics.charWidthPx === 0 || fontMetrics.charHeightPx === 0) {
            return null;
        }
        return fontMetrics;
    }
}

