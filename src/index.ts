/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

export { EditSession } from './EditSession';
export { Range } from './Range';
export { Renderer as VirtualRenderer } from './Renderer';
export { UndoManager } from './UndoManager';
export { Document } from './Document';

export { HighlighterToken } from './mode/Highlighter';
export { Delta } from './Delta';
export { Fold } from './Fold';
export { LanguageMode } from './LanguageMode';
export { TextMode } from './mode/TextMode';
export { RangeBasic } from './RangeBasic';
export { TokenWithIndex } from './Token';


/**
 * The main class required to set up an Ace instance in the browser.
 *
 * @class Ace
 **/
  
import {} from "./lib/fixoldbrowsers";
  
import * as dom from "./lib/dom";
import * as event from "./lib/event";
import { Range } from "./Range";
import { Editor } from "./Editor";
import { EditSession } from "./EditSession";
import { UndoManager } from "./UndoManager";
import { Renderer } from "./Renderer";
  
  // The following require()s are for inclusion in the built ace file

import {} from "./worker/worker_client";
import {} from "./keyboard/hash_handler";
import {} from "./placeholder";
import {} from "./multi_select";
import {} from "./mode/folding/fold_mode";
import {} from "./theme/textmate";
import {} from "./ext/error_marker";
  
  
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

    var doc = createEditSession(value);

    var editor = new Editor(new Renderer(el as HTMLElement), doc);
    var env = {
        document: doc,
        editor: editor,
        onResize: editor.resize.bind(editor, null),
        textarea: null
    };
    if (oldNode) env.textarea = oldNode;
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
    var doc = new EditSession(text, mode);
    doc.setUndoManager(new UndoManager());
    return doc;
};
(<any> window).edit = edit;
