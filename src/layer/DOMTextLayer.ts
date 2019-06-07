/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { createElement } from "../lib/dom";
import { stringRepeat } from "../lib/lang";
import { AbstractLayer } from './AbstractLayer';
import { Disposable } from '../Disposable';
import { EditSession } from "../EditSession";
import { FoldLine } from "../FoldLine";
import { LayerConfig } from './LayerConfig';
import { Token } from "../Token";
import { TextLayer } from "./TextLayer";
import { ViewPortSize } from "../ViewPortSize";

const EOF_CHAR = "\xB6";
const EOL_CHAR_LF = "\xAC";
const EOL_CHAR_CRLF = "\xa4";
const TAB_CHAR = "\u2192";
const SPACE_CHAR = "\xB7";


export class DOMTextLayer extends AbstractLayer implements Disposable,  TextLayer {
    private _eolChar: string;

    private _session: EditSession;
    private _showInvisibles = false;
    private _displayIndentGuides = true;

    private _tabStrings: string[] = [];
    private _textToken = { "text": true, "rparen": true, "lparen": true };
    private _tabSize: number;
    private _indentGuideRe: RegExp;

    private _config: LayerConfig;

    constructor(parent: HTMLElement) {
        super(parent, "ace_layer ace_text-layer");
        this._eolChar = EOL_CHAR_LF;
    }

    setEolChar(eolChar: string): void {
        this._eolChar = eolChar === "\n" ? EOL_CHAR_LF : EOL_CHAR_CRLF;
    }

    setSession(session: EditSession): void {
        this._session = session;
        this._computeTabString();
    }

    getShowInvisibles(): boolean {
        return this._showInvisibles;
    }

    /**
     * This method required a session to be in effect.
     */
    setShowInvisibles(showInvisibles: boolean): boolean {
        if (this._showInvisibles === showInvisibles) {
            return false;
        } else {
            this._showInvisibles = showInvisibles;
            this._computeTabString();
            return true;
        }
    }

    getDisplayIndentGuides(): boolean {
        return this._displayIndentGuides;
    }

    /**
     * This method requires a session to be in effect.
     */
    setDisplayIndentGuides(displayIndentGuides: boolean): boolean {
        if (this._displayIndentGuides === displayIndentGuides) {
            return false;
        } else {
            this._displayIndentGuides = displayIndentGuides;
            this._computeTabString();
            return true;
        }
    }

    // FIXME: DGH Check that this is consistent with ACE
    onChangeTabSize(): void {
        this._computeTabString();
    }

    /**
     * Recomputes the tabSize, and $tabStrings properties.
     * This method required a session to be defined.
     */
    private _computeTabString(): void {
        if (this._session) {
            const tabSize = this._session.getTabSize();
            this._tabSize = tabSize;
            const tabStr = this._tabStrings = ["0"];
            for (let i = 1; i < tabSize + 1; i++) {
                if (this._showInvisibles) {
                    tabStr.push("<span class='ace_invisible ace_invisible_tab'>"
                        + TAB_CHAR
                        + stringRepeat("\xa0", i - 1)
                        + "</span>");
                } else {
                    tabStr.push(stringRepeat("\xa0", i));
                }
            }
            if (this._displayIndentGuides) {
                this._indentGuideRe = /\s\S| \t|\t |\s$/;
                let className = "ace_indent-guide";
                let spaceClass = "";
                let tabClass = "";
                let spaceContent: string;
                let tabContent: string;
                if (this._showInvisibles) {
                    className += " ace_invisible";
                    spaceClass = " ace_invisible_space";
                    tabClass = " ace_invisible_tab";
                    spaceContent = stringRepeat(SPACE_CHAR, this._tabSize);
                    tabContent = TAB_CHAR + stringRepeat("\xa0", this._tabSize - 1);
                } else {
                    spaceContent = stringRepeat("\xa0", this._tabSize);
                    tabContent = spaceContent;
                }

                this._tabStrings[" "] = "<span class='" + className + spaceClass + "'>" + spaceContent + "</span>";
                this._tabStrings["\t"] = "<span class='" + className + tabClass + "'>" + tabContent + "</span>";
            }
        } else {
            // Ignoring, but could equally well throw an exception.
        }
    }

    updateRows(config: LayerConfig, viewPortSize: ViewPortSize, firstRow: number, lastRow: number): void {
        // Due to wrap line changes there can be new lines if e.g.
        // the line to updated wrapped in the meantime.
        if (this._config.lastRow !== config.lastRow ||
            this._config.firstRow !== config.firstRow) {
            this.scrollRows(config);
        }
        this._config = config;

        let first = Math.max(firstRow, config.firstRow);
        const last = Math.min(lastRow, config.lastRow);

        const lineElements = this.element.childNodes;
        let lineElementsIdx = 0;

        for (let row = config.firstRow; row < first; row++) {
            const foldLine = this._session.getFoldLine(row);
            if (foldLine) {
                if (foldLine.containsRow(first)) {
                    first = foldLine.start.row;
                    break;
                } else {
                    row = foldLine.end.row;
                }
            }
            lineElementsIdx++;
        }

        let row = first;
        let foldLine = this._session.getNextFoldLine(row);
        let foldStart = foldLine ? foldLine.start.row : Infinity;

        // TODO: strictNullChecks says foldLine may be null
        while (true) {
            if (row > foldStart) {
                if (foldLine) {
                    row = foldLine.end.row + 1;
                    foldLine = this._session.getNextFoldLine(row, foldLine);
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }
            }
            if (row > last) {
                break;
            }

            const lineElement: HTMLElement = <HTMLElement>lineElements[lineElementsIdx++];
            if (lineElement) {
                const html: string[] = [];
                this._renderLine(
                    html, row, !this._useLineGroups(), row === foldStart ? foldLine : false
                );
                lineElement.style.height = config.charHeightPx * this._session.getRowLength(row) + "px";
                lineElement.innerHTML = html.join("");
            }
            row++;
        }
    }

    scrollRows(config: LayerConfig): void {
        const oldConfig = this._config;
        this._config = config;

        if (!oldConfig || oldConfig.lastRow < config.firstRow) {
            return this.update(config);
        }

        if (config.lastRow < oldConfig.firstRow) {
            return this.update(config);
        }

        const el = this.element;
        if (oldConfig.firstRow < config.firstRow) {
            for (let row = this._session.getFoldedRowCount(oldConfig.firstRow, config.firstRow - 1); row > 0; row--) {
                if (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            }
        }

        if (oldConfig.lastRow > config.lastRow) {
            for (let row = this._session.getFoldedRowCount(config.lastRow + 1, oldConfig.lastRow); row > 0; row--) {
                if (el.lastChild) {
                    el.removeChild(el.lastChild);
                }
            }
        }

        if (config.firstRow < oldConfig.firstRow) {
            const fragment = this._renderLinesFragment(config, config.firstRow, oldConfig.firstRow - 1);
            if (el.firstChild) {
                el.insertBefore(fragment, el.firstChild);
            } else {
                el.appendChild(fragment);
            }
        }

        if (config.lastRow > oldConfig.lastRow) {
            const fragment = this._renderLinesFragment(config, oldConfig.lastRow + 1, config.lastRow);
            el.appendChild(fragment);
        }
    }

    private _renderLinesFragment(config: LayerConfig, firstRow: number, lastRow: number): DocumentFragment {
        const fragment = this.element.ownerDocument.createDocumentFragment();
        let row = firstRow;
        let foldLine = this._session.getNextFoldLine(row);
        let foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                if (foldLine) {
                    row = foldLine.end.row + 1;
                    foldLine = this._session.getNextFoldLine(row, foldLine);
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }
            }
            if (row > lastRow) {
                break;
            }

            const container = <HTMLDivElement>createElement("div");

            const html: (number | string)[] = [];
            // Get the tokens per line as there might be some lines in between
            // beeing folded.
            this._renderLine(html, row, false, row === foldStart ? foldLine : false);

            // don't use setInnerHtml since we are working with an empty DIV
            container.innerHTML = html.join("");
            if (this._useLineGroups()) {
                container.className = 'ace_line_group';
                fragment.appendChild(container);
                container.style.height = config.charHeightPx * this._session.getRowLength(row) + "px";

            } else {
                while (container.firstChild) {
                    fragment.appendChild(container.firstChild);
                }
            }

            row++;
        }
        return fragment;
    }

    update(config: LayerConfig): void {
        this._config = config;

        const html: (number | string)[] = [];
        const firstRow = config.firstRow;
        const lastRow = config.lastRow;

        let row = firstRow;
        let foldLine = this._session.getNextFoldLine(row);
        let foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                if (foldLine) {
                    row = foldLine.end.row + 1;
                    foldLine = this._session.getNextFoldLine(row, foldLine);
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }
            }
            if (row > lastRow) {
                break;
            }

            if (this._useLineGroups()) {
                html.push("<div class='ace_line_group' style='height:", config.charHeightPx * this._session.getRowLength(row), "px'>");
            }

            this._renderLine(html, row, false, row === foldStart ? foldLine : false);

            if (this._useLineGroups()) {
                html.push("</div>"); // end the line group
            }

            row++;
        }
        this.element.innerHTML = html.join("");
    }


    private _renderToken(stringBuilder: (number | string)[], screenColumn: number, token: Token, value: string): number {
        const replaceReg = /\t|&|<|( +)|([\x00-\x1f\x80-\xa0\u1680\u180E\u2000-\u200f\u2028\u2029\u202F\u205F\u3000\uFEFF])|[\u1100-\u115F\u11A3-\u11A7\u11FA-\u11FF\u2329-\u232A\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3000-\u303E\u3041-\u3096\u3099-\u30FF\u3105-\u312D\u3131-\u318E\u3190-\u31BA\u31C0-\u31E3\u31F0-\u321E\u3220-\u3247\u3250-\u32FE\u3300-\u4DBF\u4E00-\uA48C\uA490-\uA4C6\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFF01-\uFF60\uFFE0-\uFFE6]/g;
        const replaceFunc = (c: string, a: any, b: any, tabIdx: number, idx4: any) => {
            if (a) {
                return this._showInvisibles ?
                    "<span class='ace_invisible ace_invisible_space'>" + stringRepeat(SPACE_CHAR, c.length) + "</span>" :
                    stringRepeat("\xa0", c.length);
            } else if (c === "&") {
                return "&#38;";
            } else if (c === "<") {
                return "&#60;";
            } else if (c === "\t") {
                const tabSize = this._session.getScreenTabSize(screenColumn + tabIdx);
                screenColumn += tabSize - 1;
                return this._tabStrings[tabSize];
            } else if (c === "\u3000") {
                // U+3000 is both invisible AND full-width, so must be handled uniquely
                const classToUse = this._showInvisibles ? "ace_cjk ace_invisible ace_invisible_space" : "ace_cjk";
                const space = this._showInvisibles ? SPACE_CHAR : "";
                screenColumn += 1;
                return "<span class='" + classToUse + "' style='width:" +
                    (this._config.charWidthPx * 2) +
                    "px'>" + space + "</span>";
            } else if (b) {
                return "<span class='ace_invisible ace_invisible_space ace_invalid'>" + SPACE_CHAR + "</span>";
            } else {
                screenColumn += 1;
                return "<span class='ace_cjk' style='width:" +
                    (this._config.charWidthPx * 2) +
                    "px'>" + c + "</span>";
            }
        };

        const output = value.replace(replaceReg, replaceFunc);

        if (!this._textToken[token.type]) {
            const classes = "ace_" + token.type.replace(/\./g, " ace_");
            let style = "";
            if (token.type === "fold")
                style = " style='width:" + (token.value.length * this._config.charWidthPx) + "px;' ";
            stringBuilder.push("<span class='", classes, "'", style, ">", output, "</span>");
        } else {
            stringBuilder.push(output);
        }
        return screenColumn + value.length;
    }

    // FIXME; How can max be optional if it is always used?
    private _renderIndentGuide(stringBuilder: (number | string)[], value: string, max?: number): string {
        let cols = value.search(this._indentGuideRe);
        if (cols <= 0 || cols >= (max as number)) {
            return value;
        }
        if (value[0] === " ") {
            cols -= cols % this._tabSize;
            stringBuilder.push(stringRepeat(this._tabStrings[" "], cols / this._tabSize));
            return value.substr(cols);
        } else if (value[0] === "\t") {
            stringBuilder.push(stringRepeat(this._tabStrings["\t"], cols));
            return value.substr(cols);
        }
        return value;
    }

    private _renderWrappedLine(stringBuilder: (number | string)[], tokens: Token[], splits: number[], onlyContents: boolean): void {
        let chars = 0;
        let split = 0;
        let splitChars = splits[0];
        let screenColumn = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let value = token.value;
            if (i === 0 && this._displayIndentGuides) {
                chars = value.length;
                value = this._renderIndentGuide(stringBuilder, value, splitChars);
                if (!value) {
                    continue;
                }
                chars -= value.length;
            }

            if (chars + value.length < splitChars) {
                screenColumn = this._renderToken(stringBuilder, screenColumn, token, value);
                chars += value.length;
            } else {
                while (chars + value.length >= splitChars) {
                    screenColumn = this._renderToken(
                        stringBuilder, screenColumn,
                        token, value.substring(0, splitChars - chars)
                    );
                    value = value.substring(splitChars - chars);
                    chars = splitChars;

                    if (!onlyContents) {
                        stringBuilder.push("</div>",
                            "<div class='ace_line' style='height:",
                            this._config.charHeightPx, "px'>"
                        );
                    }

                    split++;
                    screenColumn = 0;
                    splitChars = splits[split] || Number.MAX_VALUE;
                }
                if (value.length !== 0) {
                    chars += value.length;
                    screenColumn = this._renderToken(
                        stringBuilder, screenColumn, token, value
                    );
                }
            }
        }
    }

    private _renderSimpleLine(stringBuilder: (number | string)[], tokens: Token[]): void {
        let screenColumn = 0;
        let token = tokens[0];
        let value = token.value;
        if (this._displayIndentGuides) {
            value = this._renderIndentGuide(stringBuilder, value);
        }
        if (value) {
            screenColumn = this._renderToken(stringBuilder, screenColumn, token, value);
        }
        for (let i = 1; i < tokens.length; i++) {
            token = tokens[i];
            value = token.value;
            screenColumn = this._renderToken(stringBuilder, screenColumn, token, value);
        }
    }

    // row is either first row of foldline or not in fold
    private _renderLine(stringBuilder: (number | string)[], row: number, onlyContents: boolean, foldLine: FoldLine | boolean | null): void {
        if (!foldLine && foldLine !== false) {
            foldLine = this._session.getFoldLine(row);
        }

        const tokens = foldLine ? this._getFoldLineTokens(row, <FoldLine>foldLine) : this._session.getTokens(row);

        if (!onlyContents) {
            stringBuilder.push(
                "<div class='ace_line' style='height:",
                this._config.charHeightPx * (
                    this._useLineGroups() ? 1 : this._session.getRowLength(row)
                ), "px'>"
            );
        }

        // We may not get tokens if there is no language mode.
        if (tokens && tokens.length) {
            const splits = this._session.getRowSplitData(row);
            if (splits && splits.length) {
                this._renderWrappedLine(stringBuilder, tokens, splits, onlyContents);
            } else {
                this._renderSimpleLine(stringBuilder, tokens);
            }
        }

        if (this._showInvisibles) {
            if (foldLine) {
                row = (<FoldLine>foldLine).end.row;
            }

            stringBuilder.push(
                "<span class='ace_invisible ace_invisible_eol'>",
                row === this._session.getLength() - 1 ? EOF_CHAR : this._eolChar,
                "</span>"
            );
        }
        if (!onlyContents) {
            stringBuilder.push("</div>");
        }
    }

    private _getFoldLineTokens(row: number, foldLine: FoldLine): Token[] {
        const session = this._session;
        const renderTokens: Token[] = [];

        function addTokens(tokens: Token[], from: number, to: number): void {
            let idx = 0;
            let col = 0;
            while ((col + tokens[idx].value.length) < from) {
                col += tokens[idx].value.length;
                idx++;

                if (idx === tokens.length) {
                    return;
                }
            }
            if (col !== from) {
                let value = tokens[idx].value.substring(from - col);
                // Check if the token value is longer then the from...to spacing.
                if (value.length > (to - from)) {
                    value = value.substring(0, to - from);
                }

                renderTokens.push({
                    type: tokens[idx].type,
                    value: value
                });

                col = from + value.length;
                idx += 1;
            }

            while (col < to && idx < tokens.length) {
                let value = tokens[idx].value;
                if (value.length + col > to) {
                    renderTokens.push({
                        type: tokens[idx].type,
                        value: value.substring(0, to - col)
                    });
                } else {
                    renderTokens.push(tokens[idx]);
                }
                col += value.length;
                idx += 1;
            }
        }

        let tokens = session.getTokens(row);
        foldLine.walk(function (placeholder, row, column, lastColumn, isNewRow) {
            if (placeholder != null) {
                renderTokens.push({
                    type: "fold",
                    value: placeholder
                });
            } else {
                if (isNewRow) {
                    tokens = session.getTokens(row);
                }
                if (tokens.length) {
                    addTokens(tokens, lastColumn, column);
                }
            }
        }, foldLine.end.row, this._session.getLine(foldLine.end.row).length);

        return renderTokens;
    }

    private _useLineGroups(): boolean {
        // For the updateLines function to work correctly, it's important that the
        // child nodes of this.element correspond on a 1-to-1 basis to rows in the
        // document (as distinct from lines on the screen). For sessions that are
        // wrapped, this means we need to add a layer to the node hierarchy (tagged
        // with the class name ace_line_group).
        return this._session.getUseWrapMode();
    }
}

