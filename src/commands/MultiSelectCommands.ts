/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Command } from './Command';
import { Editor } from '../Editor';
import { Direction } from '../Direction';

// commands to enter multiselect mode
export const commands: Command<Editor>[] = [{
    name: "addCursorAbove",
    exec: function (editor: Editor) { editor.selectMoreLines(Direction.BACKWARD); },
    bindKey: { win: "Ctrl-Alt-Up", mac: "Ctrl-Alt-Up" },
    readOnly: true
}, {
    name: "addCursorBelow",
    exec: function (editor: Editor) { editor.selectMoreLines(Direction.FORWARD); },
    bindKey: { win: "Ctrl-Alt-Down", mac: "Ctrl-Alt-Down" },
    readOnly: true
}, {
    name: "addCursorAboveSkipCurrent",
    exec: function (editor: Editor) { editor.selectMoreLines(Direction.BACKWARD, true); },
    bindKey: { win: "Ctrl-Alt-Shift-Up", mac: "Ctrl-Alt-Shift-Up" },
    readOnly: true
}, {
    name: "addCursorBelowSkipCurrent",
    exec: function (editor: Editor) { editor.selectMoreLines(Direction.FORWARD, true); },
    bindKey: { win: "Ctrl-Alt-Shift-Down", mac: "Ctrl-Alt-Shift-Down" },
    readOnly: true
}, {
    name: "selectMoreBefore",
    exec: function (editor: Editor) { editor.selectMore(Direction.BACKWARD); },
    bindKey: { win: "Ctrl-Alt-Left", mac: "Ctrl-Alt-Left" },
    readOnly: true
}, {
    name: "selectMoreAfter",
    exec: function (editor: Editor) { editor.selectMore(Direction.FORWARD); },
    bindKey: { win: "Ctrl-Alt-Right", mac: "Ctrl-Alt-Right" },
    readOnly: true
}, {
    name: "selectNextBefore",
    exec: function (editor: Editor) { editor.selectMore(Direction.BACKWARD, true); },
    bindKey: { win: "Ctrl-Alt-Shift-Left", mac: "Ctrl-Alt-Shift-Left" },
    readOnly: true
}, {
    name: "selectNextAfter",
    exec: function (editor: Editor) { editor.selectMore(Direction.FORWARD, true); },
    bindKey: { win: "Ctrl-Alt-Shift-Right", mac: "Ctrl-Alt-Shift-Right" },
    readOnly: true
}, {
    name: "splitIntoLines",
    exec: function (editor: Editor) { editor.splitIntoLines(); },
    bindKey: { win: "Ctrl-Alt-L", mac: "Ctrl-Alt-L" },
    readOnly: true
}, {
    name: "alignCursors",
    exec: function (editor: Editor) { editor.alignCursors(); },
    bindKey: { win: "Ctrl-Alt-A", mac: "Ctrl-Alt-A" }
}, {
    name: "findAll",
    exec: function (editor: Editor) { editor.findAll(); },
    bindKey: { win: "Ctrl-Alt-K", mac: "Ctrl-Alt-K" },
    readOnly: true
}, {
    name: "singleSelection",
    bindKey: "esc",
    exec: function(editor) { editor.exitMultiSelectMode(); },
    readOnly: true,
    isAvailable: function(editor) {return editor && editor.inMultiSelectMode}
}];
