/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { addCssClass, createElement, createHTMLDivElement, removeCssClass, setCssClass } from "./lib/dom";
import { appendHTMLLinkElement } from './dom/appendHTMLLinkElement';
import { removeHTMLLinkElement } from './dom/removeHTMLLinkElement';
import { Disposable } from './Disposable';
import { ensureHTMLStyleElement } from './dom/ensureHTMLStyleElement';
import { hasHTMLLinkElement } from './dom/hasHTMLLinkElement';
import { Annotation } from './Annotation';

import { CursorLayer } from "./layer/CursorLayer";
import { FontMetricsMonitor } from "./layer/FontMetrics";
import { GutterLayer } from "./layer/GutterLayer";
import { MarkerLayer } from "./layer/MarkerLayer";
import { TextLayer } from "./layer/TextLayer";

import { VScrollBar } from "./VScrollBar";
import { HScrollBar } from "./HScrollBar";

import { RenderLoop } from "./RenderLoop";
import { EventBusImpl } from "./lib/EventBusImpl";
import { EditSession } from './EditSession';
import { EventBus } from './EventBus';
import { OptionsProvider } from "./OptionsProvider";
import { PixelPosition } from './PixelPosition';
import { Position } from './Position';
import { ScreenCoordinates } from './ScreenCoordinates';
import { ScrollBarEvent } from './events/ScrollBarEvent';
import { EditorRenderer } from './EditorRenderer';
import { refChange } from './refChange';
import { LayerConfig } from "./layer/LayerConfig";
import { ViewPortSize } from "./ViewPortSize";
import { DOMTextLayer } from "./layer/DOMTextLayer";
import { DOMFontMetricsMonitor } from "./layer/DOMFontMetricsMonitor";


export const changeCharacterSize = 'changeCharacterSize';


let editorCss: string = null;

const CHANGE_CURSOR = 1;
const CHANGE_MARKER = 2;
const CHANGE_GUTTER = 4;
const CHANGE_SCROLL = 8;
const CHANGE_LINES = 16;
const CHANGE_TEXT = 32;
const CHANGE_SIZE = 64;
const CHANGE_MARKER_BACK = 128;
const CHANGE_MARKER_FRONT = 256;
const CHANGE_FULL = 512;
const CHANGE_H_SCROLL = 1024;

// Useful for debugging...
/*
function changesToString(changes: number): string {
    let a = "";
    if (changes & CHANGE_CURSOR) a += " cursor";
    if (changes & CHANGE_MARKER) a += " marker";
    if (changes & CHANGE_GUTTER) a += " gutter";
    if (changes & CHANGE_SCROLL) a += " scroll";
    if (changes & CHANGE_LINES) a += " lines";
    if (changes & CHANGE_TEXT) a += " text";
    if (changes & CHANGE_SIZE) a += " size";
    if (changes & CHANGE_MARKER_BACK) a += " marker_back";
    if (changes & CHANGE_MARKER_FRONT) a += " marker_front";
    if (changes & CHANGE_FULL) a += " full";
    if (changes & CHANGE_H_SCROLL) a += " h_scroll";
    return a.trim();
}
*/

export type TextDirection = 'ltr' | 'rtl' | 'auto';

/**
 * Computes steps for animation purposes.
 * The number of steps is hard-coded to 8.
 */
function calcSteps(fromValue: number, toValue: number): number[] {
    const delta = toValue - fromValue;
    const N = 8;
    const steps: number[] = [];

    /**
     * The interpolation function.
     */
    const func = function (t: number, x_min: number, dx: number): number {
        return dx * (Math.pow(t - 1, 3) + 1) + x_min;
    };

    for (let i = 0; i < N; ++i) {
        steps.push(func(i / N, fromValue, delta));
    }

    return steps;
}

export type RendererEventName = 'afterRender'
    | 'beforeRender'
    | 'changeCharacterSize'
    | 'resize'
    | 'scrollbarVisibilityChanged'
    | 'themeLoaded';

export interface RendererOptions {
    injectCss?: boolean;
    fontSize?: string;
}

export enum HScrollTracking {
    WHOLE_DOCUMENT, // Horizontal scrollbar should track when anything in the document needs scrolling.
    VISIBLE         // Horizontal scrollbar should only track any visible lines which need scrolling.
};

/**
 * The class that is responsible for drawing everything you see on the screen!
 */
export class Renderer implements Disposable, EventBus<RendererEventName, any, Renderer>, EditorRenderer, OptionsProvider {

    private readonly uuid = `${Math.random()}`;

    textareaElement: HTMLTextAreaElement;
    containerElement: HTMLElement;
    scrollLeftPx = 0;
    scrollTopPx = 0;
    layerConfig: LayerConfig = {
        docWidthPx: 1,
        visibleWidthPx: 1,
        firstRow: 0,
        firstRowScreen: 0,
        lastRow: 0,
        charHeightPx: 0,
        charWidthPx: 0,
        minHeightPx: 1,
        maxHeightPx: 1,
        verticalOffsetPx: 0,
        docHeightPx: 1,
        gutterOffsetRows: 1
    };

    private $maxLines: number;
    private $minLines: number;

    /**
     * FIXME: Leaky. ListViewPopup and showErrorMarker use this property.
     */
    cursorLayer: CursorLayer;
    $gutterLayer: GutterLayer;
    private $markerFront: MarkerLayer;
    private $markerBack: MarkerLayer;

    /**
     * FIXME: Leaky. ListViewPopup uses this property.
     */
    textLayer: TextLayer;

    private $frozen = false;

    /**
     * The identifier of the theme and the class e.g. 'ace-themename'
     */
    private themeId: string;

    /**
     * The loaded theme object. This allows us to remove a theme.
     */
    private theme: { cssClass: string };

    /**
     * $timer is used for animated scrolling.
     */
    private $timer: number;

    $keepTextAreaAtCursor: boolean = true;
    $gutterElement: HTMLDivElement;
    scrollerElement: HTMLDivElement;
    contentElement: HTMLDivElement;

    private _canHorizontalScroll: boolean;
    private _canVerticalScroll: boolean;
    scrollBarH: HScrollBar;
    scrollBarV: VScrollBar;
    private scrollBarHscrollUnhook: () => void;
    private scrollBarVscrollUnhook: () => void;

    $scrollAnimation: { from: number; to: number; steps: number[] } | null;
    
    $scrollbarWidthPx: number;
    private session: EditSession;
    private eventBus: EventBusImpl<RendererEventName, any, Renderer>;

    private scrollMargin = {
        leftPx: 0,
        rightPx: 0,
        topPx: 0,
        bottomPx: 0,
        vPx: 0,
        hPx: 0
    };

    private _fontMetricsMonitor: FontMetricsMonitor;

    /**
     * A function that removes the changeCharacterSize handler.
     */
    private removeChangeCharacterSizeHandler: (() => void);

    private $allowBoldFonts: boolean;

    /**
     * A cache of various sizes TBA.
     */
    $viewPortSize: ViewPortSize;
    private _viewPortDirty: boolean;

    private $loop: RenderLoop;
    private $changedLines: { firstRow: number; lastRow: number; } | null;
    private $changes = 0;
    private resizing: number;
    private $gutterLineHighlight: HTMLDivElement;

    gutterWidthPx: number;

    /**
     * TODO: Create a PrintMarginLayer class in the layer folder.
     */
    private $printMarginElement: HTMLDivElement;
    private $printMarginColumn = 80;
    private $showPrintMargin: boolean;

    charWidthPx: number;
    charHeightPx: number;

    private $composition: { keepTextAreaAtCursor: boolean | null; cssText: string } | null;
    private $hScrollBarAlwaysVisible = false;
    private $vScrollBarAlwaysVisible = false;
    private $showGutter = true;
    private showInvisibles = false;
    private animatedScroll = false;
    private fadeFoldWidgets = false;
    private $scrollPastEnd: number; // FIXME is this ever set?
    private $highlightGutterLine: boolean;
    private desiredHeight: number;
    private _scrollHTracking = HScrollTracking.WHOLE_DOCUMENT;

    /**
     * Constructs a new `Renderer` within the `container` specified.
     */
    constructor(containerElement: HTMLElement, options: RendererOptions={}) {
        refChange('start');
        refChange(this.uuid, 'Renderer', +1);

        this.containerElement = containerElement || <HTMLDivElement>createElement("div");
        this.containerElement.dir = 'ltr';

        if (options.injectCss !== false) {
            // Imports CSS once per DOM document ('ace_editor' serves as an identifier).
            if (editorCss == null) {
                editorCss = require("./css/editor.css");
            }
            ensureHTMLStyleElement(editorCss, "ace_editor", this.containerElement.ownerDocument);
        }
        addCssClass(this.containerElement, "ace_editor");
        
        this.setFontSize(options.fontSize === undefined ? "16px" : options.fontSize);
    }

    init(): void {
        this.eventBus = new EventBusImpl<RendererEventName, any, Renderer>(this);


        this.$gutterElement = createElement("div") as HTMLDivElement;
        this.$gutterElement.className = "ace_gutter";
        this.containerElement.appendChild(this.$gutterElement);
        // Hide gutter from screen-readers. 
        this.$gutterElement.setAttribute("aria-hidden", "true");

        this.scrollerElement = createElement("div") as HTMLDivElement;
        this.scrollerElement.className = "ace_scroller";
        this.containerElement.appendChild(this.scrollerElement);

        this.contentElement = createElement("div") as HTMLDivElement;
        this.contentElement.className = "ace_content";
        this.scrollerElement.appendChild(this.contentElement);

        this.$gutterLayer = new GutterLayer(this.$gutterElement);
        this.$gutterLayer.onWidthChange(this.onGutterResize.bind(this));

        this.$markerBack = new MarkerLayer(this.contentElement);
        this.textLayer = this.createTextLayer(this.contentElement);
        this.$markerFront = new MarkerLayer(this.contentElement);
        this.cursorLayer = new CursorLayer(this.contentElement);

        // Indicates whether the horizontal scrollbar is visible
        this._canHorizontalScroll = false;
        this._canVerticalScroll = false;

        this.scrollBarV = this.createVScrollBar(this.containerElement)
        this.scrollBarVscrollUnhook = this.scrollBarV.on("scroll", (event: ScrollBarEvent, scrollBar: VScrollBar) => {
            if (!this.$scrollAnimation && this.session) {
                this.setScrollTopPx(event.data - this.scrollMargin.topPx);
            }
        });

        this.scrollBarH = this.createHScrollBar(this.containerElement);
        this.scrollBarHscrollUnhook = this.scrollBarH.on("scroll", (event: ScrollBarEvent, scrollBar: HScrollBar) => {
            if (!this.$scrollAnimation && this.session) {
                this.session.setScrollLeftPx(event.data - this.scrollMargin.leftPx);
            }
        });

        this._fontMetricsMonitor = this.createFontMetricsMonitor();
        this._fontMetricsMonitor.onChange( () => {
            this.updateCharacterSize();
            this.onResize(true, this.gutterWidthPx, this.$viewPortSize.widthPx, this.$viewPortSize.heightPx);
            this.eventBus._signal(changeCharacterSize, event);
        });

        this.$viewPortSize = {
            widthPx: 0,
            heightPx: 0,
            scrollerHeightPx: 0,
            scrollerWidthPx: 0,
        };
        this._viewPortDirty = true;

        this.$loop = new RenderLoop(changes => this.$renderChanges(changes, false),
                                    this.containerElement.ownerDocument.defaultView);
        this.$loop.schedule(CHANGE_FULL);

        this.setShowFoldWidgets(true);
        this.updateCharacterSize();

        this._fontMetricsMonitor.startMonitoring();
    }

    protected createTextLayer(contentDiv: HTMLDivElement): TextLayer {
        return new DOMTextLayer(contentDiv);
    }

    protected createVScrollBar(container: HTMLElement): VScrollBar {
        return new VScrollBar(container, this);
    }

    protected createHScrollBar(container: HTMLElement): HScrollBar {
        return new HScrollBar(container, this);
    }

    protected createFontMetricsMonitor(): FontMetricsMonitor {
        return new DOMFontMetricsMonitor(this.containerElement, 500);
    }

    /**
     * Destroys the font metrics, text, and cursor layers for this renderer.
     */
    dispose(): void {
        if (this.removeChangeCharacterSizeHandler) {
            this.removeChangeCharacterSizeHandler();
            this.removeChangeCharacterSizeHandler = undefined;
        }

        this._fontMetricsMonitor.dispose();

        this.scrollBarHscrollUnhook();
        this.scrollBarH.dispose();

        this.scrollBarVscrollUnhook();
        this.scrollBarV.dispose();

        this.cursorLayer.dispose();
        this.$markerFront.dispose();
        this.textLayer.dispose();
        this.$markerBack.dispose();
        this.$gutterLayer.dispose();

        this.scrollerElement.removeChild(this.contentElement);
        this.containerElement.removeChild(this.scrollerElement);
        this.containerElement.removeChild(this.$gutterElement);

        refChange(this.uuid, 'Renderer', -1);
        refChange('stop');
    }

    /**
     * Returns a function that may be used to remove the callback.
     */
    on(eventName: RendererEventName, callback: (event: any, source: Renderer) => any): () => void {
        this.eventBus.on(eventName, callback, false);
        return () => {
            this.eventBus.off(eventName, callback);
        };
    }

    off(eventName: RendererEventName, callback: (event: any, source: Renderer) => any): void {
        this.eventBus.off(eventName, callback);
    }

    get maxLines(): number {
        return this.$maxLines;
    }

    set maxLines(maxLines: number) {
        this.$maxLines = maxLines;
    }

    get minLines(): number {
        return this.$minLines;
    }

    set minLines(minLines: number) {
        this.$minLines = minLines;
    }

    set keepTextAreaAtCursor(keepTextAreaAtCursor: boolean) {
        this.$keepTextAreaAtCursor = keepTextAreaAtCursor;
    }

    /**
     * Sets the <code>style</code> property of the content to "default".
     */
    setDefaultCursorStyle(): void {
        this.contentElement.style.cursor = "default";
    }

    setHScrollTracking(tracking: HScrollTracking): void {
        this._scrollHTracking = tracking;
    }

    getHScrollTracking(): HScrollTracking {
        return this._scrollHTracking;
    }

    updateCharacterSize(): void {
        const newFontMetrics =  this._fontMetricsMonitor.getFontMetrics();
        if (newFontMetrics.isBoldCompatible !== this.$allowBoldFonts) {
            this.$allowBoldFonts = newFontMetrics.isBoldCompatible;
            this.setStyle("ace_nobold", !this.$allowBoldFonts);
        }

        this.layerConfig.charWidthPx = this.charWidthPx = newFontMetrics.charWidthPx;
        this.layerConfig.charHeightPx = this.charHeightPx = newFontMetrics.charHeightPx;
        this.$updatePrintMargin();
    }

    /**
     * Associates the renderer with a different EditSession.
     */
    setSession(session: EditSession): void {
        if (this.session) {
            if (this.session.doc) {
                this.session.doc.removeChangeNewLineModeListener(this.onChangeNewLineMode);
            }
            // TODO: Why aren't we cleaning up the layers too?
        }

        this.session = session;
        if (session) {
            const scrollTop = session.getScrollTopPx();
            if (typeof scrollTop === 'number') {
                if (this.scrollMargin.topPx && scrollTop <= 0) {
                    this.setScrollTopPx(-this.scrollMargin.topPx);
                }
            }

            this.cursorLayer.setSession(session);
            this.$markerBack.setSession(session);
            this.$markerFront.setSession(session);
            this.$gutterLayer.setSession(session);
            this.textLayer.setSession(session);
            if (!session) {
                return;
            }

            this.$loop.schedule(CHANGE_FULL);
            // this.session.$setFontMetrics(this.fontMetrics);
            // this.scrollBarH.scrollLeft = this.scrollBarV.scrollTop = null;

            this.onChangeNewLineMode();
            if (session.doc) {
                session.doc.addChangeNewLineModeListener(this.onChangeNewLineMode);
            }
        }
    }

    /**
     * Triggers a partial update of the text, from the range given by the two parameters.
     *
     * @param firstRow The first row to update.
     * @param lastRow The last row to update.
     * @param force
     */
    updateLines(firstRow: number, lastRow: number, force?: boolean): void {
        if (lastRow === undefined) {
            lastRow = Infinity;
        }

        if (!this.$changedLines) {
            this.$changedLines = { firstRow: firstRow, lastRow: lastRow };
        } else {
            if (this.$changedLines.firstRow > firstRow) {
                this.$changedLines.firstRow = firstRow;
            }

            if (this.$changedLines.lastRow < lastRow) {
                this.$changedLines.lastRow = lastRow;
            }
        }

        // If the change happened offscreen above us then it's possible
        // that a new line wrap will affect the position of the lines on our
        // screen so they need redrawn.
        // TODO: better solution is to not change scroll position when text is changed outside of visible area
        if (this.$changedLines.lastRow < this.layerConfig.firstRow) {
            if (force) {
                this.$changedLines.lastRow = this.layerConfig.lastRow;
            } else {
                return;
            }
        }

        if (this.$changedLines.firstRow > this.layerConfig.lastRow) {
            return;
        }
        this.$loop.schedule(CHANGE_LINES);
    }

    /**
     * We use this as a callback, so we use a fat-arrow to bind this.
     * In other words, you don't have to worry about binding it anymore.
     */
    private onChangeNewLineMode = (): void => {
        this.$loop.schedule(CHANGE_TEXT);
        this.textLayer.setEolChar(this.sessionOrThrow().getDocument().getNewLineCharacter());
    }

    onChangeTabSize(): void {
        if (this.$loop) {
            if (this.$loop.schedule) {
                this.$loop.schedule(CHANGE_TEXT | CHANGE_MARKER);
            }
        }
        if (this.textLayer) {
            if (this.textLayer.onChangeTabSize) {
                this.textLayer.onChangeTabSize();
            }
        }
    }

    /**
     * Triggers a full update of the text, for all the rows.
     */
    updateText(): void {
        this.$loop.schedule(CHANGE_TEXT);
    }

    /**
     * Triggers a full update of all the layers, for all the rows.
     *
     * @param force If `true`, forces the changes through.
     */
    updateFull(force?: boolean): void {
        if (force) {
            this.$renderChanges(CHANGE_FULL, true);
        } else {
            this.$loop.schedule(CHANGE_FULL);
        }
    }

    private $updateSizeAsync(): void {
        if (this.$loop.pending) {
            this._viewPortDirty = true;
        } else {
            this.onResize();
        }
    }

    /**
     * Triggers a resize of the renderer.
     *
     * @param force If `true`, recomputes the size, even if the height and width haven't changed
     * @param gutterWidthPx The width of the gutter in pixels
     * @param widthPx The width of the editor in pixels
     * @param heightPx The height of the editor, in pixels
     * @return true if the resize changed anything.
     */
    onResize(force?: boolean, gutterWidthPx?: number, widthPx?: number, heightPx?: number): boolean {
        if (this.resizing > 2) {
            return false;
        } else if (this.resizing > 0) {
            this.resizing++;
        } else {
            this.resizing = force ? 1 : 0;
        }

        const containerElement = this.containerElement;
        if (heightPx === undefined || heightPx === null) {
            const rect = containerElement.getBoundingClientRect();
            heightPx = rect.height;
        }

        if (widthPx === undefined || widthPx === null) {
            widthPx = containerElement.clientWidth;
        }
        const changes = this.$updateCachedSize(force, gutterWidthPx, widthPx, heightPx);

        if (!this.$viewPortSize.scrollerHeightPx || (!widthPx && !heightPx)) {
            this.resizing = 0
            return false;
        }

        if (force) {
            this.$gutterLayer.$padding = null;
            this.$renderChanges(changes | this.$changes, true);
        } else {
            if (changes !== 0) {
                this.$loop.schedule(changes | this.$changes);
            }
        }

        if (this.resizing) {
            this.resizing = 0;
        }

        return changes !== 0;
    }

    private $updateCachedSize(force: boolean, gutterWidthPx?: number, widthPx?: number, heightPx?: number): number {
        let changes = 0;
        const viewPortSize = this.$viewPortSize;
        const oldViewPortSize = this.$viewPortSize;
        
        let newWidthPx = viewPortSize.widthPx;
        let newHeightPx = viewPortSize.heightPx;
        let newScrollerHeightPx = viewPortSize.scrollerHeightPx;
        let newScrollerWidthPx = viewPortSize.scrollerWidthPx;

        if (heightPx && (force || viewPortSize.heightPx !== heightPx)) {
            newHeightPx = heightPx;
            changes |= CHANGE_SIZE;

            newScrollerHeightPx = heightPx;
            if (this._canHorizontalScroll) {
                newScrollerHeightPx -= this.scrollBarH.height;
            }

            this.scrollBarV.element.style.bottom = pixelStyle(this.scrollBarH.height);

            changes |= CHANGE_SCROLL;
        }

        if (widthPx && (force || viewPortSize.widthPx !== widthPx)) {
            changes |= CHANGE_SIZE;
            newWidthPx = widthPx;

            if (gutterWidthPx == null) {
                gutterWidthPx = this.$showGutter ? this.$gutterElement.offsetWidth : 0;
            }

            this.gutterWidthPx = gutterWidthPx;

            this.scrollBarH.element.style.left = this.scrollerElement.style.left = pixelStyle(gutterWidthPx);
            newScrollerWidthPx = Math.max(0, widthPx - gutterWidthPx - this.scrollBarV.width);

            this.scrollBarH.element.style.right = this.scrollerElement.style.right = pixelStyle(this.scrollBarV.width);
            this.scrollerElement.style.bottom = pixelStyle(this.scrollBarH.height);

            if (this.session && this.session.getUseWrapMode() && this.adjustWrapLimit() || force) {
                changes |= CHANGE_FULL;
            }
        }

        this._viewPortDirty = !widthPx || !heightPx;

        this.$viewPortSize = {
            widthPx: newWidthPx,
            heightPx: newHeightPx,
            scrollerHeightPx: newScrollerHeightPx,
            scrollerWidthPx: newScrollerWidthPx,
        };

        if (changes) {
            this.eventBus._signal("resize", oldViewPortSize);
        }

        return changes;
    }

    private onGutterResize(): void {
        const gutterWidthPx = this.$showGutter ? this.$gutterElement.offsetWidth : 0;
        if (gutterWidthPx !== this.gutterWidthPx) {
            this.$changes |= this.$updateCachedSize(true, gutterWidthPx, this.$viewPortSize.widthPx, this.$viewPortSize.heightPx);
        }

        if (this.session && this.session.getUseWrapMode() && this.adjustWrapLimit()) {
            this.$loop.schedule(CHANGE_FULL);
        } else if (this._viewPortDirty) {
            this.$loop.schedule(CHANGE_FULL);
        } else {
            this.$computeLayerConfig();
            this.$loop.schedule(CHANGE_MARKER);
        }
    }

    private sessionOrThrow(): EditSession {
        if (this.session) {
            return this.session;
        }
        else {
            throw new Error("session must be available");
        }
    }

    /**
     * Adjusts the wrap limit, which is the number of characters that can fit within the width of the edit area on screen.
     */
    adjustWrapLimit(): boolean {
        const availableWidth = this.$viewPortSize.scrollerWidthPx;
        const limit = Math.floor(availableWidth / this.charWidthPx);
        if (this.$showPrintMargin) {
            return this.sessionOrThrow().adjustWrapLimit(limit, this.$printMarginColumn);
        }
        else {
            return this.sessionOrThrow().adjustWrapLimit(limit, 0);
        }
    }

    /**
     * Identifies whether you want to have an animated scroll or not.
     *
     * @param animatedScroll Set to `true` to show animated scrolls.
     */
    setAnimatedScroll(animatedScroll: boolean): void {
        this.animatedScroll = animatedScroll;
    }

    /**
     * Returns whether an animated scroll happens or not.
     */
    getAnimatedScroll(): boolean {
        return this.animatedScroll;
    }

    setTextDirection(value: TextDirection): void {
        if (value === 'ltr' || value === 'rtl') {
            this.containerElement.dir = value;
        }
        else if (value === 'auto') {
            this.containerElement.dir = value;
        }
    }

    getTextDirection(): TextDirection {
        const dir = this.containerElement.dir;
        switch (dir) {
            case 'ltr': return dir;
            case 'rtl': return dir;
            case 'auto': return dir;
            default: {
                throw new Error(`dir must be a TextDirection`);
            }
        }
    }

    /**
     * Identifies whether you want to show invisible characters or not.
     * This method requires the session to be in effect.
     *
     * @param showInvisibles Set to `true` to show invisibles
     */
    setShowInvisibles(showInvisibles: boolean): void {
        if (this.textLayer.setShowInvisibles(showInvisibles)) {
            this.$loop.schedule(CHANGE_TEXT);
        }
    }

    /**
     * Returns whether invisible characters are being shown or not.
     */
    getShowInvisibles(): boolean {
        return this.textLayer.getShowInvisibles();
    }

    getDisplayIndentGuides(): boolean {
        return this.textLayer.getDisplayIndentGuides();
    }

    /**
     * This method requires the session to be in effect.
     */
    setDisplayIndentGuides(displayIndentGuides: boolean): void {
        if (this.textLayer.setDisplayIndentGuides(displayIndentGuides)) {
            this.$loop.schedule(CHANGE_TEXT);
        }
    }

    /**
     * Identifies whether you want to show the print margin or not.
     *
     * @param showPrintMargin Set to `true` to show the print margin.
     */
    setShowPrintMargin(showPrintMargin: boolean): void {
        this.$showPrintMargin = showPrintMargin;
        this.$updatePrintMargin();
    }

    /**
     * Returns whether the print margin is being shown or not.
     */
    getShowPrintMargin(): boolean {
        return this.$showPrintMargin;
    }

    /**
     * Sets the column defining where the print margin should be.
     *
     * @param printMarginColumn Specifies the new print margin.
     */
    setPrintMarginColumn(printMarginColumn: number): void {
        this.$printMarginColumn = printMarginColumn;
        this.$updatePrintMargin();
    }

    /**
     * Returns the column number of where the print margin is.
     */
    getPrintMarginColumn(): number {
        return this.$printMarginColumn;
    }

    /**
     * Returns `true` if the gutter is being shown.
     */
    getShowGutter(): boolean {
        return this.$showGutter;
    }

    /**
     * Identifies whether you want to show the gutter or not.
     *
     * @param showGutter Set to `true` to show the gutter.
     */
    setShowGutter(showGutter: boolean): void {
        this.$showGutter = showGutter;
        this.$gutterElement.style.display = showGutter ? "block" : "none";
        this.$loop.schedule(CHANGE_FULL);
        this.onGutterResize();
    }

    getFadeFoldWidgets(): boolean {
        return this.fadeFoldWidgets;
    }

    setFadeFoldWidgets(fadeFoldWidgets: boolean): void {
        setCssClass(this.$gutterElement, "ace_fade-fold-widgets", fadeFoldWidgets);
    }

    getFontSize(): string | null {
        return this.containerElement.style.fontSize;
    }

    setFontSize(fontSize: string | null): void {
        if (fontSize != null) {
            this.containerElement.style.fontSize = fontSize;
            this.updateFontSize();
        }
    }

    updateFontSize(): void {

    }
    
    setHighlightGutterLine(highlightGutterLine: boolean): void {
        this.$highlightGutterLine = highlightGutterLine;
        if (!this.$gutterLineHighlight) {
            this.$gutterLineHighlight = createHTMLDivElement();
            this.$gutterLineHighlight.className = "ace_gutter-active-line";
            this.$gutterElement.appendChild(this.$gutterLineHighlight);
            return;
        }

        this.$gutterLineHighlight.style.display = highlightGutterLine ? "" : "none";
        // if cursorlayer have never been updated there's nothing on screen to update
        if (this.cursorLayer.$pixelPos) {
            this.$updateGutterLineHighlight();
        }
    }

    getHighlightGutterLine(): boolean {
        return this.$highlightGutterLine;
    }

    getPixelPosition(position: Position, onScreen=false): PixelPosition {
        return this.cursorLayer.getPixelPosition(position, onScreen);
    }

    private $updateGutterLineHighlight(): void {
        const session = this.sessionOrThrow();
        let pos = this.cursorLayer.$pixelPos;
        let height = this.layerConfig.charHeightPx;
        if (session.getUseWrapMode()) {
            const selection = session.selection;
            if (selection) {
                const cursor = selection.getCursor();
                cursor.column = 0;
                pos = this.getPixelPosition(cursor, true);
                height *= session.getRowLength(cursor.row);
            }
        }
        this.$gutterLineHighlight.style.top = pixelStyle(pos.top - this.layerConfig.verticalOffsetPx);
        this.$gutterLineHighlight.style.height = pixelStyle(height);
    }

    private $updatePrintMargin(): void {
        if (!this.$showPrintMargin && !this.$printMarginElement)
            return;

        if (!this.$printMarginElement) {
            const containerEl: HTMLDivElement = <HTMLDivElement>createElement("div");
            containerEl.className = "ace_layer ace_print-margin-layer";
            this.$printMarginElement = <HTMLDivElement>createElement("div");
            this.$printMarginElement.className = "ace_print-margin";
            containerEl.appendChild(this.$printMarginElement);
            this.contentElement.insertBefore(containerEl, this.contentElement.firstChild);
        }

        const style = this.$printMarginElement.style;
        style.left = pixelStyle((this.charWidthPx * this.$printMarginColumn));
        style.visibility = this.$showPrintMargin ? "visible" : "hidden";

        // FIXME: Should this be $useWrapMode?
        if (this.session && this.session['$wrap'] === -1)
            this.adjustWrapLimit();
    }

    /**
     * Returns the root element containing this renderer.
     */
    getContainerElement(): HTMLElement {
        return this.containerElement;
    }

    /**
     * Returns the element that the mouse events are attached to.
     */
    getMouseEventTarget(): HTMLDivElement {
        return this.contentElement;
    }

    /**
     * Returns the element to which the hidden text area is added.
     */
    getTextAreaContainer(): HTMLElement {
        return this.containerElement;
    }

    /**
     * Move text input over the cursor.
     * Required for iOS and IME.
     *
     * @private
     */
    $moveTextAreaToCursor(): void {
        if (!this.$keepTextAreaAtCursor) {
            return;
        }
        const config = this.layerConfig;

        if (!this.cursorLayer.$pixelPos) {
            console.warn("moveTextAreaToCursor bypassed because cursor layer is not working.");
            return;
        }

        const session = this.sessionOrThrow();

        let posTop = this.cursorLayer.$pixelPos.top;
        let posLeft = this.cursorLayer.$pixelPos.left;
        posTop -= config.verticalOffsetPx;

        let h = this.charHeightPx;
        if (posTop < 0 || posTop > config.docHeightPx - h) {
            return;
        }

        let w = this.charWidthPx;
        if (this.$composition) {
            const val = this.textareaElement.value.replace(/^\x01+/, "");
            w *= session.getStringScreenWidth(val)[0];
        }

        posLeft -= this.scrollLeftPx;
        if (posLeft > this.$viewPortSize.scrollerWidthPx - w) {
            posLeft = this.$viewPortSize.scrollerWidthPx - w;
        }
        posLeft -= this.scrollBarV.width;

        this.textareaElement.style.height = pixelStyle(h);
        this.textareaElement.style.width = pixelStyle(w);
        this.textareaElement.style.right = pixelStyle(Math.max(0, this.$viewPortSize.scrollerWidthPx - posLeft - w));
        this.textareaElement.style.bottom = pixelStyle(Math.max(0, this.$viewPortSize.heightPx - posTop - h));
    }

    /**
     * Returns the index of the first visible row.
     */
    getFirstVisibleRow(): number {
        return this.layerConfig.firstRow;
    }

    /**
     * Returns the index of the first fully visible row.
     * "Fully" here means that the characters in the row are not truncated; that the top and the bottom of the row are on the screen.
     */
    getFirstFullyVisibleRow(): number {
        return this.layerConfig.firstRow + (this.layerConfig.verticalOffsetPx === 0 ? 0 : 1);
    }

    /**
     * Returns the index of the last fully visible row.
     * "Fully" here means that the characters in the row are not truncated; that the top and the bottom of the row are on the screen.
     */
    getLastFullyVisibleRow(): number {
        const flint = Math.floor((this.layerConfig.docHeightPx + this.layerConfig.verticalOffsetPx) / this.layerConfig.charHeightPx);
        return this.layerConfig.firstRow - 1 + flint;
    }

    /**
     * Returns the index of the last visible row.
     */
    getLastVisibleRow(): number {
        return this.layerConfig.lastRow;
    }

    setScrollMarginPx(topPx: number, bottomPx: number, leftPx: number, rightPx: number): void {
        const sm = this.scrollMargin;
        sm.topPx = topPx | 0;
        sm.bottomPx = bottomPx | 0;
        sm.rightPx = rightPx | 0;
        sm.leftPx = leftPx | 0;
        sm.vPx = sm.topPx + sm.bottomPx;
        sm.hPx = sm.leftPx + sm.rightPx;
        if (sm.topPx && this.scrollTopPx <= 0 && this.session)
            this.setScrollTopPx(-sm.topPx);
        this.updateFull();
    }

    /**
     * Returns whether the horizontal scrollbar is set to be always visible.
     */
    getHScrollBarAlwaysVisible(): boolean {
        return this.$hScrollBarAlwaysVisible;
    }

    /**
     * Identifies whether you want to show the horizontal scrollbar or not.
     *
     * @param hScrollBarAlwaysVisible Set to `true` to make the horizontal scroll bar visible.
     */
    setHScrollBarAlwaysVisible(hScrollBarAlwaysVisible: boolean) {
        this.$hScrollBarAlwaysVisible = hScrollBarAlwaysVisible;
        if (!this.$hScrollBarAlwaysVisible || !this._canHorizontalScroll) {
            this.$loop.schedule(CHANGE_SCROLL);
        }
    }

    /**
     * Returns whether the vertical scrollbar is set to be always visible.
     */
    getVScrollBarAlwaysVisible(): boolean {
        return this.$vScrollBarAlwaysVisible;
    }

    /**
     * Identifies whether you want to show the vertical scrollbar or not.
     * @param alwaysVisible Set to `true` to make the vertical scroll bar visible
     */
    setVScrollBarAlwaysVisible(alwaysVisible: boolean): void {
        this.$vScrollBarAlwaysVisible = alwaysVisible;
        if (!this.$vScrollBarAlwaysVisible || !this._canVerticalScroll) {
            this.$loop.schedule(CHANGE_SCROLL);
        }
    }

    getShowLineNumbers(): boolean {
        return this.$gutterLayer.getShowLineNumbers();
    }

    setShowLineNumbers(showLineNumbers: boolean): void {
        this.$gutterLayer.setShowLineNumbers(showLineNumbers);
        this.$loop.schedule(CHANGE_GUTTER);
    }


    private $updateScrollBarV(): void {
        let scrollHeightPx = this.layerConfig.maxHeightPx;
        const scrollerHeightPx = this.$viewPortSize.scrollerHeightPx;
        if (!this.$maxLines && this.$scrollPastEnd) {
            scrollHeightPx -= (scrollerHeightPx - this.charHeightPx) * this.$scrollPastEnd;
            if (this.scrollTopPx > scrollHeightPx - scrollerHeightPx) {
                scrollHeightPx = this.scrollTopPx + scrollerHeightPx;
                // FIXME: This is hacky.
                // The idea seems to be to force the scrollbar to change.
                this.scrollBarV.scrollTop = null;
            }
        }
        this.scrollBarV
            .setScrollHeight(scrollHeightPx + this.scrollMargin.vPx)
            .setScrollTop(this.scrollTopPx + this.scrollMargin.topPx);
    }

    private $updateScrollBarH(): void {
        const layerWidth = this._scrollHTracking === HScrollTracking.WHOLE_DOCUMENT
                                ? this.layerConfig.docWidthPx
                                : this.layerConfig.visibleWidthPx;
        const scrollWidth = layerWidth + this.scrollMargin.hPx;
        this.scrollBarH
            .setScrollWidth(scrollWidth)
            .setScrollLeft(this.scrollLeftPx + this.scrollMargin.leftPx);
    }

    freeze(): void {
        this.$frozen = true;
    }

    unfreeze(): void {
        this.$frozen = false;
    }

    private $renderChanges(changes: number, forceChanges: boolean): void {
        if (this.$changes) {
            changes |= this.$changes;
            this.$changes = 0;
        }
        if ((!this.session || !this.containerElement.offsetWidth || this.$frozen) || (!changes && !forceChanges)) {
            this.$changes |= changes;
            return;
        }
        if (this._viewPortDirty) {
            this.$changes |= changes;
            this.onResize(true);
            return;
        }

        this.eventBus._signal("beforeRender");

        let config = this.layerConfig;
        if (this._scrollHTracking === HScrollTracking.VISIBLE) {
            changes |= CHANGE_H_SCROLL;
        }

        // text, scrolling and resize changes can cause the view port size to change
        if (changes & CHANGE_FULL ||
            changes & CHANGE_SIZE ||
            changes & CHANGE_TEXT ||
            changes & CHANGE_LINES ||
            changes & CHANGE_SCROLL ||
            changes & CHANGE_H_SCROLL
        ) {
            changes |= this.$computeLayerConfig();
            // If a change is made offscreen and wrapMode is on, then the onscreen
            // lines may have been pushed down. If so, the first screen row will not
            // have changed, but the first actual row will. In that case, adjust 
            // scrollTop so that the cursor and onscreen content stays in the same place.
            if (config.firstRow !== this.layerConfig.firstRow && config.firstRowScreen === this.layerConfig.firstRowScreen) {
                this.scrollTopPx = this.scrollTopPx + (config.firstRow - this.layerConfig.firstRow) * this.charHeightPx;
                changes = changes | CHANGE_SCROLL;
                changes |= this.$computeLayerConfig();
            }
            config = this.layerConfig;
            // update scrollbar first to not lose scroll position when gutter calls resize
            this.$updateScrollBarV();
            if (changes & CHANGE_H_SCROLL) {
                this.$updateScrollBarH();
            }
            this.$gutterLayer.element.style.marginTop = pixelStyle(-config.verticalOffsetPx);
            this.contentElement.style.marginTop = pixelStyle(-config.verticalOffsetPx);
            this.contentElement.style.width = pixelStyle(config.docWidthPx);
            this.contentElement.style.height = pixelStyle(config.minHeightPx);
        }

        if (changes & CHANGE_H_SCROLL) {
            this.contentElement.style.marginLeft = pixelStyle(-this.scrollLeftPx);
            this.scrollerElement.className = this.scrollLeftPx <= 0 ? "ace_scroller" : "ace_scroller ace_scroll-left";
        }

        if (changes & CHANGE_FULL) {
            this.textLayer.update(config, this.$viewPortSize);
            if (this.$showGutter) {
                this.$gutterLayer.update(config, this.$viewPortSize);
            }
            this.$markerBack.update(config);
            this.$markerFront.update(config);
            this.cursorLayer.update(config, this.$viewPortSize);
            this.$moveTextAreaToCursor();
            if (this.$highlightGutterLine) {
                this.$updateGutterLineHighlight();
            }

            this.eventBus._signal("afterRender");
            return;
        }

        if (changes & CHANGE_SCROLL) {
            if (changes & CHANGE_TEXT || changes & CHANGE_LINES) {
                this.textLayer.update(config, this.$viewPortSize);
            } else {
                this.textLayer.scrollRows(config, this.$viewPortSize);
            }
            if (this.$showGutter) {
                this.$gutterLayer.update(config, this.$viewPortSize);
            }
            this.$markerBack.update(config);
            this.$markerFront.update(config);
            this.cursorLayer.update(config, this.$viewPortSize);
            if (this.$highlightGutterLine) {
                this.$updateGutterLineHighlight();
            }
            this.$moveTextAreaToCursor();
            this.eventBus._signal("afterRender");
            return;
        }

        if (changes & CHANGE_TEXT) {
            this.textLayer.update(config, this.$viewPortSize);
            if (this.$showGutter) {
                this.$gutterLayer.update(config, this.$viewPortSize);
            }
        } else if (changes & CHANGE_LINES) {
            if (this.$updateLines() || (changes & CHANGE_GUTTER) && this.$showGutter) {
                this.$gutterLayer.update(config, this.$viewPortSize);
            }
        } else if (changes & CHANGE_GUTTER) {
            if (this.$showGutter) {
                this.$gutterLayer.update(config, this.$viewPortSize);
            }
        }

        if (changes & CHANGE_CURSOR) {
            this.cursorLayer.update(config, this.$viewPortSize);
            this.$moveTextAreaToCursor();
            if (this.$highlightGutterLine) {
                this.$updateGutterLineHighlight();
            }
        }

        if (changes & CHANGE_LINES || changes & (CHANGE_MARKER | CHANGE_MARKER_FRONT)) {
            this.$markerFront.update(config);
        }

        if (changes & CHANGE_LINES || changes & (CHANGE_MARKER | CHANGE_MARKER_BACK)) {
            this.$markerBack.update(config);
        }

        this.eventBus._signal("afterRender");
        return;
    }

    private $autosize(): void {
        const session = this.sessionOrThrow();
        const height = session.getScreenLength() * this.charHeightPx;
        const maxHeight = this.$maxLines * this.charHeightPx;
        const desiredHeight = Math.max(
            (this.$minLines || 1) * this.charHeightPx,
            Math.min(maxHeight, height)) + this.scrollMargin.vPx;
        const vScroll = height > maxHeight;

        if (desiredHeight !== this.desiredHeight ||
            this.$viewPortSize.heightPx !== this.desiredHeight || vScroll !== this._canVerticalScroll) {
            if (vScroll !== this._canVerticalScroll) {
                this._canVerticalScroll = vScroll;
                this.scrollBarV.setVisible(vScroll);
            }

            const w = this.containerElement.clientWidth;
            this.containerElement.style.height = pixelStyle(desiredHeight);
            this.$updateCachedSize(true, this.gutterWidthPx, w, desiredHeight);
            // this.$loop.changes = 0;
            this.desiredHeight = desiredHeight;
        }
    }

    private $computeLayerConfig(): number {

        if (this.$maxLines && this.charHeightPx > 1) {
            this.$autosize();
        }

        const session = this.sessionOrThrow();
        const size = this.$viewPortSize;

        const hideScrollbars = size.heightPx <= 2 * this.charHeightPx;
        const screenLines = session.getScreenLength();
        let maxHeight = screenLines * this.charHeightPx;

        let verticalOffsetPx = this.scrollTopPx % this.charHeightPx;
        let minHeight = size.scrollerHeightPx + this.charHeightPx;

        let longestLinePx = this._getLongestLinePx();
        let longestVisibleLinePx = this._getLongestVisibleLinePx();
        if (this._scrollHTracking === HScrollTracking.VISIBLE) {
            longestLinePx = longestVisibleLinePx;
        }

        const horizScroll = !hideScrollbars && (this.$hScrollBarAlwaysVisible || size.scrollerWidthPx - longestLinePx < 0);

        const hScrollChanged = this._canHorizontalScroll !== horizScroll;
        if (hScrollChanged) {
            this._canHorizontalScroll = horizScroll;
            this.scrollBarH.setVisible(horizScroll);
        }

        if (!this.$maxLines && this.$scrollPastEnd) {
            maxHeight += (size.scrollerHeightPx - this.charHeightPx) * this.$scrollPastEnd;
        }

        const vScroll = !hideScrollbars && (this.$vScrollBarAlwaysVisible || size.scrollerHeightPx - maxHeight < 0);
        const vScrollChanged = this._canVerticalScroll !== vScroll;
        if (vScrollChanged) {
            this._canVerticalScroll = vScroll;
            this.scrollBarV.setVisible(vScroll);
        }

        this.setScrollTopPx(Math.max(-this.scrollMargin.topPx, Math.min(this.scrollTopPx, maxHeight - size.scrollerHeightPx + this.scrollMargin.bottomPx)));

        session.setScrollLeftPx(Math.max(-this.scrollMargin.leftPx, Math.min(this.scrollLeftPx, longestLinePx - size.scrollerWidthPx + this.scrollMargin.rightPx)));

        let firstRow = Math.max(0, Math.round((this.scrollTopPx - verticalOffsetPx) / this.charHeightPx));
        const lineCount = Math.ceil(minHeight / this.charHeightPx);
        let lastRow = firstRow + lineCount -1;

        // Map lines on the screen to lines in the document.
        const charHeightPx = this.charHeightPx;
        firstRow = session.screenPositionToDocumentRow(firstRow, 0);

        // Check if firstRow is inside of a foldLine. If true, then use the first
        // row of the foldLine.
        const foldLine = session.getFoldLine(firstRow);
        if (foldLine) {
            firstRow = foldLine.start.row;
        }

        const firstRowScreen = session.documentPositionToScreenRow(firstRow, 0);
        const firstRowHeight = session.getRowLength(firstRow) * charHeightPx;

        lastRow = Math.min(session.screenPositionToDocumentRow(lastRow, 0), session.getLength() - 1);
        minHeight = size.scrollerHeightPx + session.getRowLength(lastRow) * charHeightPx + firstRowHeight;

        verticalOffsetPx = this.scrollTopPx - firstRowScreen * charHeightPx;

        let changes = 0;
        if (this.layerConfig.docWidthPx !== longestLinePx)
            changes = CHANGE_H_SCROLL;
        // Horizontal scrollbar visibility may have changed, which changes
        // the client height of the scroller
        if (hScrollChanged || vScrollChanged) {
            changes = this.$updateCachedSize(true, this.gutterWidthPx, size.widthPx, size.heightPx);
            this.eventBus._signal("scrollbarVisibilityChanged");
            if (vScrollChanged) {
                longestLinePx = this._getLongestLinePx();
            }
        }

        this.layerConfig = {
            docWidthPx: longestLinePx,
            visibleWidthPx: longestVisibleLinePx,
            firstRow: firstRow,
            firstRowScreen: firstRowScreen,
            lastRow: lastRow,
            charHeightPx: charHeightPx,
            charWidthPx: this.charWidthPx,
            minHeightPx: minHeight,
            maxHeightPx: maxHeight,
            verticalOffsetPx: verticalOffsetPx,
            gutterOffsetRows: Math.max(0, Math.ceil((verticalOffsetPx + size.heightPx - size.scrollerHeightPx) / charHeightPx)),
            docHeightPx: this.$viewPortSize.scrollerHeightPx
        };

        return changes;
    }

    private $updateLines(): boolean {
        if (this.$changedLines) {
            const firstRow = this.$changedLines.firstRow;
            const lastRow = this.$changedLines.lastRow;
            this.$changedLines = null;
            const layerConfig = this.layerConfig;

            if (firstRow > layerConfig.lastRow) {
                return false;
            }
            if (lastRow < layerConfig.firstRow) {
                return false;
            }
  
            // if the last row is unknown -> redraw everything
            if (lastRow === Infinity) {
                if (this.$showGutter) {
                    this.$gutterLayer.update(layerConfig, this.$viewPortSize);
                }
                this.textLayer.update(layerConfig, this.$viewPortSize);
                return false;
            }

            // else update only the changed rows
            this.textLayer.updateRows(layerConfig, this.$viewPortSize, firstRow, lastRow);
            return true;
        }
        return false;
    }

    private _getLongestLinePx(): number {
        const session = this.sessionOrThrow();
        const charCount = session.getScreenWidthChars() + ((this.showInvisibles && !session.$useWrapMode) ? 1 : 0);
        return Math.max(this.$viewPortSize.scrollerWidthPx, Math.floor(charCount * this.charWidthPx));
    }

    private _getLongestVisibleLinePx(): number {
        const session = this.sessionOrThrow();
        const doc = this.session.getDocument();
        const docLength = doc.getLength();
        const widthInRange = session.getWidthInRange(this.getFirstVisibleRow(), Math.min(docLength, this.getLastVisibleRow() + 1));
        const charCount = widthInRange + ((this.showInvisibles && !session.$useWrapMode) ? 1 : 0);
        return Math.max(this.$viewPortSize.scrollerWidthPx, Math.floor(charCount * this.charWidthPx));
    }

    /**
     * Schedules an update to all the front markers in the document.
     * TODO: Could this return a promise?
     */
    updateFrontMarkers(): void {
        const session = this.sessionOrThrow();
        this.$markerFront.setMarkers(session.getMarkers(true));
        this.$loop.schedule(CHANGE_MARKER_FRONT);
    }

    /**
     * Schedules an update to all the back markers in the document.
     */
    updateBackMarkers(): void {
        const session = this.sessionOrThrow();
        this.$markerBack.setMarkers(session.getMarkers(false));
        this.$loop.schedule(CHANGE_MARKER_BACK);
    }

    /**
     * Redraw breakpoints.
     */
    updateBreakpoints(): void {
        this.$loop.schedule(CHANGE_GUTTER);
    }

    /**
     * Sets annotations for the gutter.
     *
     * @param annotations An array containing annotations.
     */
    setAnnotations(annotations: Annotation[]): void {
        this.$gutterLayer.setAnnotations(annotations);
        this.$loop.schedule(CHANGE_GUTTER);
    }

    /**
     * Updates the cursor icon.
     */
    updateCursor(): void {
        this.$loop.schedule(CHANGE_CURSOR);
    }

    /**
     * Hides the cursor icon.
     */
    hideCursor(): void {
        this.cursorLayer.hideCursor();
    }

    /**
     * Shows the cursor icon.
     */
    showCursor(): void {
        this.cursorLayer.showCursor();
    }

    scrollSelectionIntoView(anchor: Position, lead: Position, offset?: number): void {
        // first scroll anchor into view then scroll lead into view
        this.scrollCursorIntoView(anchor, offset);
        this.scrollCursorIntoView(lead, offset);
    }

    /**
     * Scrolls the cursor into the first visible area of the editor.
     */
    scrollCursorIntoView(cursor?: Position | null, offset?: number, viewMargin?: { top?: number; bottom?: number }): void {
        // the editor is not visible
        if (this.$viewPortSize.scrollerHeightPx === 0) {
            return;
        }

        const session = this.sessionOrThrow();

        const pos = this.getPixelPosition(cursor, false);

        let leftPx = pos.left;
        let topPx = pos.top;

        const topMargin = viewMargin && viewMargin.top || 0;
        const bottomMargin = viewMargin && viewMargin.bottom || 0;

        const scrollTop = this.$scrollAnimation ? session.getScrollTopPx() : this.scrollTopPx;

        if (scrollTop + topMargin > topPx) {
            if (offset) {
                topPx -= offset * this.$viewPortSize.scrollerHeightPx;
            }
            if (topPx === 0) {
                topPx = -this.scrollMargin.topPx;
            }
            this.setScrollTopPx(topPx);
        } else if (scrollTop + this.$viewPortSize.scrollerHeightPx - bottomMargin < topPx + this.charHeightPx) {
            if (offset) {
                topPx += offset * this.$viewPortSize.scrollerHeightPx;
            }
            this.setScrollTopPx(topPx + this.charHeightPx - this.$viewPortSize.scrollerHeightPx);
        }

        const scrollLeft = this.scrollLeftPx;

        if (scrollLeft > leftPx) {
            if (leftPx < 2 * this.layerConfig.charWidthPx) {
                leftPx = -this.scrollMargin.leftPx;
            }
            session.setScrollLeftPx(leftPx);
        } else if (scrollLeft + this.$viewPortSize.scrollerWidthPx < leftPx + this.charWidthPx) {
            session.setScrollLeftPx(Math.round(leftPx + this.charWidthPx - this.$viewPortSize.scrollerWidthPx));
        } else if (scrollLeft <= 0 && leftPx - scrollLeft < this.charWidthPx) {
            session.setScrollLeftPx(0);
        }
    }

    getScrollTopPx(): number {
        return this.sessionOrThrow().getScrollTopPx();
    }

    getScrollLeftPx(): number {
        return this.sessionOrThrow().getScrollLeftPx();
    }

    /**
     * Returns the first visible row, regardless of whether it's fully visible or not.
     */
    getScrollTopRow(): number {
        return this.scrollTopPx / this.charHeightPx;
    }

    /**
     * Returns the last visible row, regardless of whether it's fully visible or not.
     *
     */
    getScrollBottomRow(): number {
        return Math.max(0, Math.floor((this.scrollTopPx + this.$viewPortSize.scrollerHeightPx) / this.charHeightPx) - 1);
    }

    /**
     * Gracefully scrolls from the top of the editor to the row indicated.
     *
     * @param row A row id.
     */
    scrollToRow(row: number): void {
        this.setScrollTopPx(row * this.charHeightPx);
    }

    setScrollTopPx(topPx: number): void {
        const session = this.sessionOrThrow();
        const screenRows = session.getScreenLength();
        let maxHeightPx = screenRows * this.charHeightPx;
        const maxTopPx = Math.max(-this.scrollMargin.topPx, Math.min(this.scrollTopPx, maxHeightPx - this.$viewPortSize.scrollerHeightPx + this.scrollMargin.bottomPx));

        const newTopPx = Math.min(topPx, maxTopPx);
        session.setScrollTopPx(newTopPx);
    }

    alignCursor(cursor: number | Position, alignment: number): number {
        if (typeof cursor === "number") {
            cursor = { row: cursor, column: 0 };
        }

        const pos = this.getPixelPosition(cursor, false);
        const h = this.$viewPortSize.scrollerHeightPx - this.charHeightPx;
        const offset = pos.top - h * (alignment || 0);

        this.setScrollTopPx(offset);
        return offset;
    }

    /**
     * Gracefully scrolls the editor to the row indicated.
     * 
     * @param line A line number
     * @param center If `true`, centers the editor the to indicated line
     * @param animate If `true` animates scrolling
     * @param callback Function to be called after the animation has finished
     */
    scrollToLine(line: number, center: boolean, animate?: boolean, callback?: () => any): void {
        const pos = this.getPixelPosition({ row: line, column: 0 }, false);
        let offset = pos.top;
        if (center) {
            offset -= this.$viewPortSize.scrollerHeightPx / 2;
        }

        const initialScroll = this.scrollTopPx;
        this.setScrollTopPx(offset);
        if (animate) {
            this.animateScrolling(initialScroll, callback);
        }
    }

    /**
     * fromValue is a scroll value.
     */
    animateScrolling(fromValue: number, callback?: () => any): void {
        const session = this.sessionOrThrow();
        const toValue = this.scrollTopPx;
        if (!this.animatedScroll) {
            return;
        }

        if (fromValue === toValue) {
            return;
        }

        if (this.$scrollAnimation) {
            const oldSteps = this.$scrollAnimation.steps;
            if (oldSteps.length) {
                fromValue = oldSteps[0];
                if (fromValue === toValue)
                    return;
            }
        }

        const steps = calcSteps(fromValue, toValue);
        this.$scrollAnimation = { from: fromValue, to: toValue, steps };

        if (typeof this.$timer === 'number') {
            window.clearInterval(this.$timer);
            this.$timer = undefined;
        }

        this.setScrollTopPx(<number>steps.shift());
        // trick session to think it's already scrolled to not loose toValue
        session.$scrollTopPx = toValue;
        // Every 10 milliseconds, animate the scrolling.
        let doneFinalTweak = false;
        this.$timer = window.setInterval(() => {
            if (steps.length > 0) {
                this.setScrollTopPx(<number>steps.shift());
                session.$scrollTopPx = toValue;
            }
            else if (!doneFinalTweak) {
                session.$scrollTopPx = -1;
                this.setScrollTopPx(toValue);
                doneFinalTweak = true;
            }
            else {
                // do this on separate step to not get spurious scroll event from scrollbar
                if (typeof this.$timer === 'number') {
                    window.clearInterval(this.$timer);
                    this.$timer = undefined;
                }
                this.$scrollAnimation = null;
                if (callback) {
                    callback();
                }
            }
        }, 10);
    }

    /**
     * Scrolls the editor to the y pixel indicated.
     * 
     * @param scrollTopPx The position to scroll to
     */
    scrollToYPx(scrollTopPx: number): void {
        // after calling scrollBar.setScrollTop
        // scrollbar sends us event with same scrollTop. ignore it
        if (this.scrollTopPx !== scrollTopPx) {
            this.scrollTopPx = scrollTopPx;
            this.$loop.schedule(CHANGE_SCROLL);
        }
    }

    /**
     * Scrolls the editor across the x-axis to the pixel indicated.
     *
     * @param scrollLeftPx The position to scroll to.
     */
    scrollToXPx(scrollLeftPx: number): void {
        if (this.scrollLeftPx !== scrollLeftPx) {
            this.scrollLeftPx = scrollLeftPx;
            this.$loop.schedule(CHANGE_H_SCROLL);
        }
    }

    /**
     * Scrolls the editor across axes to an absolute point (scrollLeft, scrollTop).
     */
    scrollToPx(scrollLeftPx: number, scrollTopPx: number): void {
        const session = this.sessionOrThrow();
        session.setScrollLeftPx(scrollLeftPx);
        this.setScrollTopPx(scrollTopPx);
    }

    /**
     * Scrolls the editor across both axes by a displacement.
     */
    scrollByPx(deltaXPx: number, deltaYPx: number): void {
        const session = this.sessionOrThrow();
        if (deltaYPx) {
            this.setScrollTopPx(session.getScrollTopPx() + deltaYPx);
        }
        if (deltaXPx) {
            session.setScrollLeftPx(session.getScrollLeftPx() + deltaXPx);
        }
    }

    /**
     * Returns `true` if you can still scroll by either parameter; in other words, you haven't reached the end of the file or line.
     */
    isScrollableByPx(deltaXPx: number, deltaYPx: number): boolean {
        const session = this.sessionOrThrow();
        if (deltaYPx < 0 && session.getScrollTopPx() >= 1 - this.scrollMargin.topPx) {
            return true;
        }
        if (deltaYPx > 0 && session.getScrollTopPx() + this.$viewPortSize.scrollerHeightPx - this.layerConfig.maxHeightPx < -1 + this.scrollMargin.bottomPx) {
            return true;
        }
        if (deltaXPx < 0 && session.getScrollLeftPx() >= 1 - this.scrollMargin.leftPx) {
            return true;
        }
        if (deltaXPx > 0 && session.getScrollLeftPx() + this.$viewPortSize.scrollerWidthPx - this.layerConfig.docWidthPx < -1 + this.scrollMargin.rightPx) {
            return true;
        }
        return false;
    }

    pixelToScreenCoordinates(x: number, y: number) {
        const canvasPos = this.scrollerElement.getBoundingClientRect();

        const offset = (x + this.scrollLeftPx - canvasPos.left) / this.charWidthPx;
        const row = Math.floor((y + this.scrollTopPx - canvasPos.top) / this.charHeightPx);
        const col = Math.round(offset);

        return { row: row, column: col }; //, side: offset - col > 0 ? 1 : -1 };
    }

    screenToTextCoordinates(clientX: number, clientY: number): Position {
        const session = this.sessionOrThrow();
        const canvasPos = this.scrollerElement.getBoundingClientRect();

        const column = Math.round((clientX + this.scrollLeftPx - canvasPos.left) / this.charWidthPx);

        const row = (clientY + this.scrollTopPx - canvasPos.top) / this.charHeightPx;

        return session.screenPositionToDocumentPosition(row, Math.max(column, 0));
    }

    /**
     * Returns an object containing the screen coordinates of the document position.
     */
    textToScreenCoordinates(row: number, column: number): ScreenCoordinates {
        const session = this.sessionOrThrow();
        const canvasPos: ClientRect = this.scrollerElement.getBoundingClientRect();
        const pos: Position = session.documentPositionToScreenPosition(row, column);

        const x = Math.round(pos.column * this.charWidthPx);
        const y = pos.row * this.charHeightPx;

        return {
            pageX: canvasPos.left + x - this.scrollLeftPx,
            pageY: canvasPos.top + y - this.scrollTopPx
        };
    }

    /**
     * Focuses the current container.
     */
    visualizeFocus(): void {
        addCssClass(this.containerElement, "ace_focus");
    }

    /**
     * Blurs the current container.
     */
    visualizeBlur(): void {
        removeCssClass(this.containerElement, "ace_focus");
    }

    showComposition(position: Position): void {
        if (!this.$composition)
            this.$composition = {
                keepTextAreaAtCursor: this.$keepTextAreaAtCursor,
                cssText: this.textareaElement.style.cssText
            };

        this.$keepTextAreaAtCursor = true;
        addCssClass(this.textareaElement, "ace_composition");
        this.textareaElement.style.cssText = "";
        this.$moveTextAreaToCursor();
    }

    /**
     * Sets the inner text of the current composition to `text`.
     */
    setCompositionText(text?: string): void {
        // TODO: Why is the parameter not used?
        this.$moveTextAreaToCursor();
    }

    /**
     * Hides the current composition.
     */
    hideComposition(): void {
        if (!this.$composition) {
            return;
        }

        removeCssClass(this.textareaElement, "ace_composition");
        this.$keepTextAreaAtCursor = this.$composition.keepTextAreaAtCursor;
        this.textareaElement.style.cssText = this.$composition.cssText;
        this.$composition = null;
    }

    getShowFoldWidgets(): boolean {
        return this.$gutterLayer.getShowFoldWidgets();
    }

    setShowFoldWidgets(showFoldWidgets: boolean): void {
        this.$gutterLayer.setShowFoldWidgets(showFoldWidgets);
    }

    /**
     * Sets a new theme for the editor.
     * This is a synchronous method.
     */
    setTheme(modJs: { cssText: string; cssClass: string; isDark: boolean; padding: number }): void {

        if (!modJs.cssClass) {
            return;
        }

        ensureHTMLStyleElement(modJs.cssText, modJs.cssClass, this.containerElement.ownerDocument);

        if (this.theme) {
            removeCssClass(this.containerElement, this.theme.cssClass);
        }

        this.theme = modJs;
        this.addCssClass(modJs.cssClass);
        this.setCssClass("ace_dark", modJs.isDark);

        // force re-measure of the gutter width
        if (this.$viewPortSize) {
            this.$viewPortSize = { ...this.$viewPortSize, widthPx: 0};
            this.$updateSizeAsync();
        }

        this.eventBus._emit('themeLoaded', { theme: modJs });
    }

    addCssClass(cssClass: string): void {
        addCssClass(this.containerElement, cssClass);
    }

    removeCssClass(cssClass: string): void {
        removeCssClass(this.containerElement, cssClass);
    }

    setCssClass(className: string, include: boolean): void {
        setCssClass(this.containerElement, className, include);
    }

    /**
     * Appends a link element with rel='stylesheet' type='text/css', and sets the cssClass as the id.
     * The cssClass doubles as both an identifier and a CSS class.
     */
    setThemeCss(themeId: string, href?: string): void {
        if (themeId !== this.themeId) {
            if (this.themeId) {
                this.removeCssClass(this.themeId);
                if (hasHTMLLinkElement(this.themeId, this.containerElement.ownerDocument)) {
                    removeHTMLLinkElement(this.themeId, this.containerElement.ownerDocument);
                }
            }
            if (href) {
                if (!hasHTMLLinkElement(themeId, this.containerElement.ownerDocument)) {
                    appendHTMLLinkElement(themeId, 'stylesheet', 'text/css', href, this.containerElement.ownerDocument);
                }
            }
            this.addCssClass(themeId);
            this.themeId = themeId;
        }
    }

    setThemeDark(isDark: boolean): void {
        this.setCssClass("ace_dark", isDark);
    }

    /**
     * Returns the path of the current theme.
     */
    getTheme(): string {
        return this.themeId;
    }

    // Methods allows to add / remove CSS classnames to the editor element.
    // This feature can be used by plug-ins to provide a visual indication of
    // a certain mode that editor is in.

    /**
     * Adds a new class, `className`, to the editor container.
     */
    setStyle(className: string, include?: boolean): void {
        setCssClass(this.containerElement, className, include !== false);
    }

    /**
     * Removes the class `className` from the editor container.
     */
    unsetStyle(className: string): void {
        removeCssClass(this.containerElement, className);
    }

    setCursorStyle(style: string): void {
        if (this.contentElement.style.cursor !== style) {
            this.contentElement.style.cursor = style;
        }
    }

    /**
     * @param cursorStyle A css cursor style. 'crosshair'.
     */
    setMouseCursor(cursorStyle: string): void {
        this.contentElement.style.cursor = cursorStyle;
    }
}

/**
 * Returns pixels + "px"
 * TODO: This duplicates a function called toPixelString.
 * @param pixels The value in pixels.
 */
function pixelStyle(pixels: number): string {
    return `${pixels}px`;
}

