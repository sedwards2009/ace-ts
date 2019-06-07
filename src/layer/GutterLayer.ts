/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { addCssClass, createElement, removeCssClass, setStyle } from "../lib/dom";

import { AbstractLayer } from './AbstractLayer';
import { escapeHTML } from "../lib/escapeHTML";
import { Delta } from "../Delta";
import { EditSession } from "../EditSession";
import { FoldWidget } from "../FoldWidget";
import { Annotation } from "../Annotation";
import { LayerConfig } from "./LayerConfig";
import { Padding } from './Padding';
import { GutterCell } from './GutterCell';
import { Cell, Lines } from './Lines';
import { FoldLine } from "../FoldLine";
import { toPixelString } from "../dom/toPixelString";
import { EventEmitter } from "../EventEmitter";
import { Event } from '../Event';
import { ViewPortSize } from "../ViewPortSize";


function onCreateCell(element: HTMLDivElement) {
    const textNode = document.createTextNode('');
    element.appendChild(textNode);

    const foldWidget = createElement("span") as HTMLSpanElement;
    element.appendChild(foldWidget);

    return element;
}

export class GutterLayer extends AbstractLayer {

    private _gutterWidthPx = 0;
    private _oldLastRow: number;

    /**
     * GutterLayer annotations are different from the Annotation type.
     * 
     */
    $annotations: ({ className: string | undefined; text: string[] } | null)[] = [];
    /**
     * Gutter cells indexed by screen row.
     */
    $cells: GutterCell[] = [];
    private _fixedWidth = false;
    private _showLineNumbers = true;
    private _showFoldWidgets = true;
    private _highlightGutterLine = true;
    private _cursorRow: number;
    private $cursorCell: Cell;
    private _config: LayerConfig;
    private session: EditSession;
    $padding: Padding | null;
    private readonly _lines: Lines;

    private _onWidthChangeEventEmitter = new EventEmitter<number>();
    onWidthChange: Event<number>;

    constructor(parent: HTMLElement) {
        super(parent, "ace_layer ace_gutter-layer");
        this.onWidthChange = this._onWidthChangeEventEmitter.event;
        this.setShowFoldWidgets(true);
        this._lines = new Lines(this.element);
        this._lines.$offsetCoefficient = 1;
    }

    getGutterWidthPx(): number {
        return this._gutterWidthPx;
    }

    setSession(session: EditSession): void {
        if (this.session) {
            this.session.off("change", (delta: Delta) => this._updateAnnotations(delta));
        }
        this.session = session;
        if (session) {
            session.on("change", (delta: Delta) => this._updateAnnotations(delta));
        }
    }

    setAnnotations(annotations: Annotation[]): void {
        // iterate over sparse array
        this.$annotations = [];
        for (let i = 0; i < annotations.length; i++) {
            const annotation = annotations[i];
            const row = annotation.row;
            let rowInfo = this.$annotations[row];
            if (!rowInfo) {
                rowInfo = this.$annotations[row] = { className: undefined, text: [] };
            }

            const annoText = annotation.text ? escapeHTML(annotation.text) : annotation.html || "";

            if (rowInfo.text.indexOf(annoText) === -1) {
                rowInfo.text.push(annoText);
            }

            const type = annotation.type;
            if (type === "error") {
                rowInfo.className = " ace_error";
            } else if (type === "warning" && rowInfo.className !== " ace_error") {
                rowInfo.className = " ace_warning";
            } else if (type === "info" && (!rowInfo.className)) {
                rowInfo.className = " ace_info";
            }
        }
    }

    private _updateAnnotations(delta: Delta): void {
        if (!this.$annotations.length) {
            return;
        }
        const firstRow = delta.start.row;
        const len = delta.end.row - firstRow;
        if (len === 0) {
            // do nothing
        } else if (delta.action === "remove") {
            this.$annotations.splice(firstRow, len + 1, null);
        } else {
            const args = new Array<number>(len + 1);
            args.unshift(firstRow, 1);
            this.$annotations.splice.apply(this.$annotations, args);
        }
    }

    update(config: LayerConfig, viewPortSize: ViewPortSize): void {
        const session = this.session;
        const firstRow = config.firstRow;
        // Compensate for horizontal scollbar.
        const lastRow = Math.min(config.lastRow + config.gutterOffsetRows, session.getLength() - 1);
        let fold = session.getNextFoldLine(firstRow);
        let foldStart = fold ? fold.start.row : Infinity;
        const foldWidgets = this._showFoldWidgets && session.foldWidgets;
        const breakpoints = session.$breakpoints;
        const decorations = session.$decorations;
        const firstLineNumber = session.getFirstLineNumber();
        let lastLineNumber = 0;

        let cell: GutterCell | null | undefined = null;
        let index = -1;
        let row = firstRow;
        while (true) {
            if (row > foldStart) {
                if (fold) {
                    row = fold.end.row + 1;
                    fold = session.getNextFoldLine(row, fold);
                    foldStart = fold ? fold.start.row : Infinity;
                }
            }
            if (row > lastRow) {
                while (this.$cells.length > index + 1) {
                    cell = this.$cells.pop();
                    if (cell) {
                        this.element.removeChild(cell.element);
                    }
                }
                break;
            }

            cell = this.$cells[++index];
            if (!cell) {
                cell = { element: <HTMLDivElement>createElement("div"), textNode: document.createTextNode(''), foldWidget: null };
                cell.element.appendChild(cell.textNode);
                this.element.appendChild(cell.element);
                this.$cells[index] = cell;
            }

            let className = "ace_gutter-cell ";
            if (breakpoints[row]) {
                className += breakpoints[row];
            }
            if (decorations[row]) {
                className += decorations[row];
            }
            const annotation = this.$annotations[row];
            if (annotation) {
                className += annotation.className;
            }
            if (cell.element.className !== className) {
                cell.element.className = className;
            }

            const height = session.getRowLength(row) * config.charHeightPx + "px";
            if (height !== cell.element.style.height) {
                cell.element.style.height = height;
            }

            let c: FoldWidget;
            if (foldWidgets) {
                c = foldWidgets[row];
                // check if cached value is invalidated and we need to recompute
                if (c == null) {
                    c = foldWidgets[row] = session.getFoldWidget(row);
                }
            }

            if (c) {
                if (!cell.foldWidget) {
                    cell.foldWidget = <HTMLSpanElement>createElement("span");
                    cell.element.appendChild(cell.foldWidget);
                }
                let className = "ace_fold-widget ace_" + c;
                if (c === "start" && row === foldStart && fold && row < fold.end.row) {
                    className += " ace_closed";
                } else {
                    className += " ace_open";
                }
                if (cell.foldWidget.className !== className) {
                    cell.foldWidget.className = className;
                }

                const height = config.charHeightPx + "px";
                if (cell.foldWidget.style.height !== height) {
                    cell.foldWidget.style.height = height;
                }
            } else {
                if (cell.foldWidget) {
                    cell.element.removeChild(cell.foldWidget);
                    cell.foldWidget = null;
                }
            }

            lastLineNumber = row + firstLineNumber;
            const text: string = this._showLineNumbers ? lastLineNumber.toString() : "";
            if (text !== cell.textNode.data) {
                cell.textNode.data = text;
            }

            row++;
        }

        this.element.style.height = config.minHeightPx + "px";

        if (this._fixedWidth || session.$useWrapMode) {
            lastLineNumber = session.getLength() + firstLineNumber;
        }

        let gutterWidth = this._showLineNumbers ? lastLineNumber.toString().length * config.charWidthPx : 0;
        const padding = this.$padding || this._computePadding();
        gutterWidth += padding.left + padding.right;
        if (gutterWidth !== this._gutterWidthPx && !isNaN(gutterWidth)) {
            this._gutterWidthPx = gutterWidth;
            this.element.style.width = Math.ceil(this._gutterWidthPx) + "px";
            this._onWidthChangeEventEmitter.fire(gutterWidth);
        }
    }

    private _updateGutterWidth(config: LayerConfig): void {
        const lastLineText = this._lines.last() ? this._lines.last().text : "";

        let gutterWidth = this._showLineNumbers ? lastLineText.toString().length * config.charWidthPx : 0;

        const padding = this.$padding || this._computePadding();
        gutterWidth += padding.left + padding.right;
        if (gutterWidth !== this._gutterWidthPx && !isNaN(gutterWidth)) {
            this._gutterWidthPx = gutterWidth;
            (this.element.parentNode as HTMLElement).style.width = this.element.style.width = Math.ceil(this._gutterWidthPx) + "px";
            this._onWidthChangeEventEmitter.fire(gutterWidth);
        }
    }

    private _updateCursorRow(): void {
        if (!this._highlightGutterLine) {
            return;
        }

        const position = this.session.selection.getCursor();
        if (this._cursorRow === position.row) {
            return;
        }

        this._cursorRow = position.row;
    }

    private _updateLineHighlight(): void {
        if (!this._highlightGutterLine) {
            return;
        }
        const row = this.session.selection.getCursor().row;
        this._cursorRow = row;

        if (this.$cursorCell && this.$cursorCell.row === row) {
            return;
        }
        if (this.$cursorCell) {
            this.$cursorCell.element.className = this.$cursorCell.element.className.replace("ace_gutter-active-line ", "");
        }
        const cells = this._lines.cells;
        this.$cursorCell = null;
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            if (cell.row >= this._cursorRow) {
                if (cell.row > this._cursorRow) {
                    const fold = this.session.getFoldLine(this._cursorRow);
                    if (i > 0 && fold && fold.start.row === cells[i - 1].row) {
                        cell = cells[i - 1];
                    } else {
                        break;
                    }
                }
                cell.element.className = "ace_gutter-active-line " + cell.element.className;
                this.$cursorCell = cell;
                break;
            }
        }
    }

    scrollLines(config: LayerConfig, viewPortSize: ViewPortSize): void {
        const oldConfig = this._config;
        this._config = config;

        this._updateCursorRow();
        if (this._lines.pageChanged(oldConfig, config)) {
            return this.update(config, viewPortSize);
        }

        this._lines.moveContainer(config);

        const lastRow = Math.min(config.lastRow + config.gutterOffsetRows, this.session.getLength() - 1);
        const oldLastRow = this._oldLastRow;
        this._oldLastRow = lastRow;

        if (!oldConfig || oldLastRow < config.firstRow) {
            return this.update(config, viewPortSize);
        }

        if (lastRow < oldConfig.firstRow) {
            return this.update(config, viewPortSize);
        }

        if (oldConfig.firstRow < config.firstRow) {
            for (let row = this.session.getFoldedRowCount(oldConfig.firstRow, config.firstRow - 1); row > 0; row--) {
                this._lines.shift();
            }
        }

        if (oldLastRow > lastRow) {
            for (let row = this.session.getFoldedRowCount(lastRow + 1, oldLastRow); row > 0; row--) {
                this._lines.pop();
            }
        }

        if (config.firstRow < oldConfig.firstRow) {
            this._lines.unshift(this._renderLines(config, config.firstRow, oldConfig.firstRow - 1));
        }

        if (lastRow > oldLastRow) {
            this._lines.push(this._renderLines(config, oldLastRow + 1, lastRow));
        }

        this._updateLineHighlight();
        this._updateGutterWidth(config);
    }

    private _renderLines(config: LayerConfig, firstRow: number, lastRow: number): Cell[] {
        const fragment: Cell[] = [];
        let row = firstRow;
        let foldLine = this.session.getNextFoldLine(row);
        let foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row + 1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row : Infinity;
            }
            if (row > lastRow)
                break;

            const cell = this._lines.createCell(row, config, this.session, onCreateCell);
            this._renderCell(cell, config, foldLine, row);
            fragment.push(cell);

            row++;
        }
        return fragment;
    }

    private _renderCell(cell: Cell, config: LayerConfig, fold: FoldLine, row: number): Cell {
        const element = cell.element;

        const textNode = element.childNodes[0] as Text;
        const foldWidget = element.childNodes[1] as HTMLDivElement;

        const session = this.session;

        const firstLineNumber = session.getFirstLineNumber();

        const breakpoints = session.$breakpoints;
        const decorations = session.$decorations;
        const foldWidgets = this._showFoldWidgets && session.foldWidgets;
        const foldStart = fold ? fold.start.row : Number.MAX_VALUE;

        let className = "ace_gutter-cell ";
        if (this._highlightGutterLine) {
            if (row === this._cursorRow || (fold && row < this._cursorRow && row >= foldStart && this._cursorRow <= fold.end.row)) {
                className += "ace_gutter-active-line ";
                if (this.$cursorCell !== cell) {
                    if (this.$cursorCell)
                        this.$cursorCell.element.className = this.$cursorCell.element.className.replace("ace_gutter-active-line ", "");
                    this.$cursorCell = cell;
                }
            }
        }

        if (breakpoints[row]) {
            className += breakpoints[row];
        }
        if (decorations[row]) {
            className += decorations[row];
        }
        if (this.$annotations[row]) {
            className += this.$annotations[row].className;
        }
        if (element.className !== className) {
            element.className = className;
        }

        let c: FoldWidget;
        if (foldWidgets) {
            c = foldWidgets[row];
            // check if cached value is invalidated and we need to recompute
            if (c == null) {
                c = foldWidgets[row] = session.getFoldWidget(row);
            }
        }

        if (c) {
            let className = "ace_fold-widget ace_" + c;
            if (c === "start" && row === foldStart && row < fold.end.row) {
                className += " ace_closed";
            } else {
                className += " ace_open";
            }
            if (foldWidget.className !== className) {
                foldWidget.className = className;
            }

            const foldHeight = toPixelString(config.charHeightPx);
            setStyle(foldWidget.style, "height", foldHeight);
            setStyle(foldWidget.style, "display", "inline-block");
        } else {
            if (foldWidget) {
                setStyle(foldWidget.style, "display", "none");
            }
        }

        const text = this._showLineNumbers ? (row + firstLineNumber).toString() : "";
        if (text !== textNode.data) {
            textNode.data = text;
        }

        setStyle(cell.element.style, "height", this._lines.computeLineHeight(row, config, session) + "px");
        setStyle(cell.element.style, "top", this._lines.computeLineTop(row, config, session) + "px");

        cell.text = text;
        return cell;
    }

    setHighlightGutterLine(highlightGutterLine: boolean): void {
        this._highlightGutterLine = highlightGutterLine;
    }

    setShowLineNumbers(showLineNumbers: boolean): void {
        this._showLineNumbers = showLineNumbers;
    }

    getShowLineNumbers(): boolean {
        return this._showLineNumbers;
    }

    /**
     * Setting this property changes the CSS class of the `element` property.
     * It also clears the padding.
     */
    setShowFoldWidgets(showFoldWidgets: boolean): void {
        if (showFoldWidgets) {
            addCssClass(this.element, "ace_folding-enabled");
        } else {
            removeCssClass(this.element, "ace_folding-enabled");
        }
        this._showFoldWidgets = showFoldWidgets;
        this.$padding = null;
    }

    getShowFoldWidgets(): boolean {
        return this._showFoldWidgets;
    }

    /**
     * Updates and returns a reference to the cached padding property.
     * Always returns a Padding, but the left and right values may be zero.
     */
    private _computePadding(): Padding {
        if (!this.element.firstChild) {
            return { left: 0, right: 0 };
        }
        // FIXME: The firstChild may not be an HTMLElement.
        const style = window.getComputedStyle(<Element>this.element.firstChild);
        this.$padding = { left: 0, right: 0 };
        if (style.paddingLeft) {
            this.$padding.left = parseInt(style.paddingLeft, 10) + 1 || 0;
        } else {
            this.$padding.left = 0;
        }

        if (style.paddingRight) {
            this.$padding.right = parseInt(style.paddingRight, 10) || 0;
        } else {
            this.$padding.right = 0;
        }
        return this.$padding;
    }

    /**
     * Determines the region of the gutter corresponding to the supplied point.
     * Returns either "markers", "foldWidgets", or undefined (if in neither region).
     */
    getRegion(point: { clientX: number; clientY: number }): 'markers' | 'foldWidgets' | undefined {
        const padding: Padding = this.$padding || this._computePadding();
        const rect = this.element.getBoundingClientRect();
        if (point.clientX < padding.left + rect.left) {
            return "markers";
        }
        if (this._showFoldWidgets && point.clientX > rect.right - padding.right) {
            return "foldWidgets";
        }
        return undefined;
    }
}
