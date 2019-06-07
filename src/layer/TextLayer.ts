/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Disposable } from "../Disposable";
import { EditSession } from "../EditSession";
import { LayerConfig } from "./LayerConfig";
import { ViewPortSize } from "../ViewPortSize";

export interface TextLayer extends Disposable {
    element: HTMLDivElement;

    setEolChar(eolChar: string): void ;
    setSession(session: EditSession): void;
    getShowInvisibles(): boolean;
    setShowInvisibles(showInvisibles: boolean): boolean;
    getDisplayIndentGuides(): boolean;
    setDisplayIndentGuides(displayIndentGuides: boolean): boolean;

    onChangeTabSize(): void;

    updateRows(config: LayerConfig, viewPortSize: ViewPortSize, firstRow: number, lastRow: number): void;
    scrollRows(config: LayerConfig, viewPortSize: ViewPortSize): void;
    update(config: LayerConfig, viewPortSize: ViewPortSize): void;
}
