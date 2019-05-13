/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { OrientedRange } from '../RangeBasic';
import { Position } from '../Position';
import { isRangeEmpty } from "../RangeBasic";
import { clone as cloneRange } from "../RangeHelpers";
import { EditorMouseEvent } from '../EditorMouseEvent';

var event = require("../lib/event");
var useragent = require("../lib/useragent");

// mouse
function isSamePoint(p1, p2) {
    return p1.row == p2.row && p1.column == p2.column;
}

export function onMouseDown(e: EditorMouseEvent): void {
    const ev = e.domEvent;
    const alt = ev.altKey;
    const shift = ev.shiftKey;
    const ctrl = ev.ctrlKey;
    const accel = e.getAccelKey();
    let button = e.getButton();
    
    if (ctrl && useragent.isMac) {
        button = ev.button;
    }

    if (e.editor.inMultiSelectMode && button == 2) {
        e.editor.textInput.onContextMenu(e.domEvent);
        return;
    }
    
    if (!ctrl && !alt && !accel) {
        if (button === 0 && e.editor.inMultiSelectMode) {
            e.editor.exitMultiSelectMode();
        }
        return;
    }
    
    if (button !== 0) {
        return;
    }

    const editor = e.editor;
    const selection = editor.selection;
    const isMultiSelect = editor.inMultiSelectMode;
    const pos = e.getDocumentPosition();
    const cursor = selection.getCursor();
    const inSelection = e.inSelection() || (selection.isEmpty() && isSamePoint(pos, cursor));

    let mouseX = e.clientX;
    let mouseY = e.clientY;
    var onMouseSelection = function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    };
    
    const session = editor.session;
    let screenAnchor: Position = editor.renderer.pixelToScreenCoordinates(mouseX, mouseY);
    let screenCursor = screenAnchor;
    
    let selectionMode = "";
    if (accel && !alt) {
        selectionMode = "add";
        if (!isMultiSelect && shift) {
            return;
        }
    } else {
        if (alt) {
            selectionMode = "block";
        }
    }
    
    if (selectionMode && useragent.isMac && ev.ctrlKey) {
        editor.$mouseHandler.cancelContextMenu();
    }

    if (selectionMode == "add") {
        let range: OrientedRange = null;
        if (!isMultiSelect && inSelection) {
            return; // dragging
        }

        if (!isMultiSelect) {
            range = selection.toOrientedRange();
            editor.addSelectionMarker(range);
        }

        let oldRange = selection.rangeList.rangeAtPoint(pos);

        editor.$blockScrolling++;
        editor.inVirtualSelectionMode = true;

        if (shift) {
            oldRange = null;
            range = selection.ranges[0];
            editor.removeSelectionMarkers([range]);
        }
        editor.once("mouseup", function() {
            var tmpSel = selection.toOrientedRange();

            if (oldRange && isRangeEmpty(tmpSel) && isSamePoint(oldRange.cursor, tmpSel.cursor)) {
                selection.substractPoint(tmpSel.cursor);
            } else {
                if (shift) {
                    selection.substractPoint(range.cursor);
                } else {
                    if (range) {
                        editor.removeSelectionMarkers([range]);
                        selection.addRange(range);
                    }
                }
                selection.addRange(tmpSel);
            }
            editor.$blockScrolling--;
            editor.inVirtualSelectionMode = false;
        });

    } else if (selectionMode == "block") {
        e.domEvent.preventDefault();
        e.domEvent.stopPropagation();
        editor.inVirtualSelectionMode = true;        
        let initialRange: OrientedRange;
        let rectSel = [];
        const blockSelect = function() {
            const newCursor = editor.renderer.pixelToScreenCoordinates(mouseX, mouseY);
            const cursor = session.screenPositionToDocumentPosition(newCursor.row, newCursor.column);

            if (isSamePoint(screenCursor, newCursor) && isSamePoint(cursor, selection.lead)) {
                return;
            }
            screenCursor = newCursor;

            editor.selection.moveToPosition(cursor);
            editor.renderer.scrollCursorIntoView();

            editor.removeSelectionMarkers(rectSel);
            rectSel = selection.rectangularRangeBlock(screenCursor, screenAnchor, true);
            if (editor.$mouseHandler.$clickSelection && rectSel.length == 1 && isRangeEmpty(rectSel[0])) {
                rectSel[0] = cloneRange(editor.$mouseHandler.$clickSelection);
            }
            rectSel.forEach(editor.addSelectionMarker, editor);
            editor.updateSelectionMarkers();
        };
        
        if (isMultiSelect && !accel) {
            selection.toSingleRange();
        } else if (!isMultiSelect && accel) {
            initialRange = selection.toOrientedRange();
            editor.addSelectionMarker(initialRange);
        }
        
        if (shift) {
            screenAnchor = session.documentPositionToScreenPosition(selection.lead.row, selection.lead.column);
        } else {
            selection.moveToPosition(pos);
        }

        screenCursor = {row: -1, column: -1};

        let timerId: number;
        const onMouseSelectionEnd = function(e) {
            clearInterval(timerId);
            editor.removeSelectionMarkers(rectSel);
            if (!rectSel.length) {
                rectSel = [selection.toOrientedRange()];
            }
            editor.$blockScrolling++;
            if (initialRange) {
                editor.removeSelectionMarkers([initialRange]);
                selection.toSingleRange(initialRange);
            }
            for (let i = 0; i < rectSel.length; i++) {
                selection.addRange(rectSel[i]);
            }
            editor.inVirtualSelectionMode = false;
            editor.$mouseHandler.$clickSelection = null;
            editor.$blockScrolling--;
        };

        const onSelectionInterval = blockSelect;

        event.capture(editor.container, onMouseSelection, onMouseSelectionEnd);
        timerId = window.setInterval(onSelectionInterval, 20);

        return e.domEvent.preventDefault();
    }
}
