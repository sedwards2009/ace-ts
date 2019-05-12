/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { createFragment } from '../dom/createFragment';
import { translate } from '../dom/translate';
import { createElement } from "../lib/dom";
import { EditSession } from '../EditSession';
import { LayerConfig } from './LayerConfig';

export type Cell = { row: number; element: HTMLDivElement; text: string };

export type LineConfig = { firstRowScreen: number; lineHeight: number; offset: number };

export class Lines {
    private element: HTMLDivElement;
    private canvasHeight: number;
    public cells: Cell[];
    private cellCache: Cell[];
    public $offsetCoefficient = 0;
    constructor(element: HTMLDivElement, canvasHeight = 500000) {
        this.element = element;
        this.canvasHeight = canvasHeight;
        this.element.style.height = (this.canvasHeight * 2) + "px";

        this.cells = [];
        this.cellCache = [];
        this.$offsetCoefficient = 0;
    }

    moveContainer(config: LayerConfig): void {
        translate(this.element, 0, -((config.firstRowScreen * config.charHeightPx) % this.canvasHeight) - config.verticalOffsetPx * this.$offsetCoefficient);
    }

    pageChanged(oldConfig: LayerConfig, newConfig: LayerConfig): boolean {
        return (
            Math.floor((oldConfig.firstRowScreen * oldConfig.charHeightPx) / this.canvasHeight) !==
            Math.floor((newConfig.firstRowScreen * newConfig.charHeightPx) / this.canvasHeight)
        );
    }

    computeLineTop(row: number, config: LayerConfig, session: EditSession): number {
        const screenTop = config.firstRowScreen * config.charHeightPx;
        const screenPage = Math.floor(screenTop / this.canvasHeight);
        const lineTop = session.documentToScreenRow(row, 0) * config.charHeightPx;
        return lineTop - (screenPage * this.canvasHeight);
    }

    computeLineHeight(row: number, config: LayerConfig, session: EditSession): number {
        return config.charHeightPx * session.getRowLength(row);
    }

    getLength(): number {
        return this.cells.length;
    }

    get(index: number): Cell {
        return this.cells[index];
    }

    shift(): void {
        this.$cacheCell(this.cells.shift());
    }

    pop(): void {
        this.$cacheCell(this.cells.pop());
    }

    push(cell: Cell[] | Cell): void {
        if (Array.isArray(cell)) {
            this.cells.push.apply(this.cells, cell);
            const fragment = createFragment(this.element);
            for (let i = 0; i < cell.length; i++) {
                fragment.appendChild(cell[i].element);
            }
            this.element.appendChild(fragment);
        } else {
            this.cells.push(cell);
            this.element.appendChild(cell.element);
        }
    }

    unshift(cell: Cell[] | Cell): void {
        if (Array.isArray(cell)) {
            this.cells.unshift.apply(this.cells, cell);
            const fragment = createFragment(this.element);
            for (let i = 0; i < cell.length; i++) {
                fragment.appendChild(cell[i].element);
            }
            if (this.element.firstChild)
                this.element.insertBefore(fragment, this.element.firstChild);
            else
                this.element.appendChild(fragment);
        } else {
            this.cells.unshift(cell);
            this.element.insertAdjacentElement("afterbegin", cell.element);
        }
    }

    last(): Cell {
        if (this.cells.length)
            return this.cells[this.cells.length - 1];
        else
            return null;
    }

    private $cacheCell(cell: Cell): void {
        if (!cell)
            return;

        cell.element.remove();
        this.cellCache.push(cell);
    }

    createCell(row: number, unused: LayerConfig, session: EditSession, initElement: (element: HTMLDivElement) => any): Cell {
        let cell = this.cellCache.pop();
        if (!cell) {
            const element = createElement("div") as HTMLDivElement;
            if (initElement) {
                initElement(element);
            }

            this.element.appendChild(element);

            cell = {
                element: element,
                text: "",
                row: row
            };
        }
        cell.row = row;

        return cell;
    }
}

