/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export { Delta } from './Delta';
export { Document } from './Document';
export { Editor } from './Editor';
export { EditSession } from './EditSession';
export { Fold } from './Fold';
export { HighlighterToken } from './mode/Highlighter';
export { LanguageMode } from './LanguageMode';
export { Position } from './Position';
export { Range } from './Range';
export { RangeBasic } from './RangeBasic';
export { Renderer } from './Renderer';
export { TextMode } from './mode/TextMode';
export { TokenWithIndex } from './Token';
export { UndoManager } from './UndoManager';
export { ScrollBar } from './ScrollBar';
export { HScrollBar } from './HScrollBar';
export { VScrollBar } from './VScrollBar';
export { commands as DefaultCommands } from './commands/DefaultCommands';
export { Command } from './commands/Command';
export { commands as MultiSelectCommands } from './commands/MultiSelectCommands';

/**
 * The main class required to set up an Ace instance in the browser.
 *
 * @class Ace
 **/
  
// import {} from "./lib/fixoldbrowsers";
  
import * as dom from "./lib/dom";
import * as event from "./lib/event";
import { Range } from "./Range";
import { Editor } from "./Editor";
import { EditSession } from "./EditSession";
import { UndoManager } from "./UndoManager";
import { Renderer } from "./Renderer";
import { commands as DefaultCommands } from './commands/DefaultCommands';
  
  // The following require()s are for inclusion in the built ace file

// import {} from "./worker/worker_client";
// import {} from "./keyboard/hash_handler";
// import {} from "./placeholder";
// import {} from "./multi_select";
// import {} from "./mode/folding/fold_mode";
// import {} from "./theme/textmate";
// import {} from "./ext/error_marker";
  
  
/**
 * Embeds the Ace editor into the DOM, at the element provided by `el`.
 * @param {String | DOMElement} el Either the id of an element, or the element itself
 * @param {Object } options Options for the editor
 *
 **/
export function edit(elementOrString: HTMLElement | string): Editor {
    let el: Element = null;
    let value = "";
    if (typeof elementOrString == "string") {
        const _id = elementOrString;
        el = document.getElementById(_id);
        if (!el)
            throw new Error("ace.edit can't find div #" + _id);
    } else {
        el = elementOrString;
        if (elementOrString && /input|textarea/i.test(elementOrString.tagName)) {
            var oldNode = elementOrString as HTMLInputElement | HTMLTextAreaElement;
            value = oldNode.value;
            el = dom.createElement("pre") as HTMLPreElement;
            oldNode.parentNode.replaceChild(el, oldNode);
        }
    }
    if (el) {
        value = el.textContent;
        el.innerHTML = "";
    }

    const doc = createEditSession(value);

    const editor = new Editor(new Renderer(el as HTMLElement), doc);
    const env = {
        document: doc,
        editor: editor,
        onResize: editor.resize.bind(editor, null),
        textarea: null
    };
    editor.commands.addCommands(DefaultCommands);

    if (oldNode) {
        env.textarea = oldNode;
    }
    event.addListener(window, "resize", env.onResize);
    editor.on("destroy", function() {
        event.removeListener(window, "resize", env.onResize);
    });
    return editor;
}
  
/**
 * Creates a new [[EditSession]], and returns the associated [[Document]].
 * @param {Document | String} text {:textParam}
 * @param {TextMode} mode {:modeParam}
 * 
 **/
export function createEditSession(text, mode?) {
    const doc = new EditSession(text, mode);
    doc.setUndoManager(new UndoManager());
    return doc;
};
