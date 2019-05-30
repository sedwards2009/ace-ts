/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Annotation } from "./Annotation";
import { Position } from "./Position";

// TODO: The HTML nature is leaky.
export interface EditorRenderer {
    $keepTextAreaAtCursor: boolean | null;
    maxLines: number;
    minLines: number;
    scrollerElement: HTMLDivElement;
    scrollTopPx: number;
    textareaElement: HTMLTextAreaElement;

    /**
     * Returns the root element containing this renderer.
     */
    getContainerElement(): HTMLElement;

    /**
     * Move text input over the cursor.
     * Required for iOS and IME.
     */
    $moveTextAreaToCursor(): void;

    /**
     * Sets annotations for the gutter.
     *
     * @param annotations An array containing annotations.
     */
    setAnnotations(annotations: Annotation[]): void;

    setHighlightGutterLine(highlightGutterLine: boolean): void;

    /**
     * Identifies whether you want to show the gutter or not.
     *
     * @param showGutter Set to `true` to show the gutter.
     */
    setShowGutter(showGutter: boolean): void;

    screenToTextCoordinates(clientX: number, clientY: number): Position;

    /**
     * Scrolls the editor across both x- and y-axes.
     *
     * @param deltaX The x value to scroll by.
     * @param deltaY The y value to scroll by.
     */
    scrollByPx(deltaX: number, deltaY: number): void;

    /**
     * Scrolls the cursor into the first visibile area of the editor
     */
    scrollCursorIntoView(cursor?: Position, offset?: number, $viewMargin?: { top?: number; bottom?: number }): void;
}

