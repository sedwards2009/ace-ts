/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { capture, preventDefault } from "../lib/event";
import { isChrome, isGecko, isMac, isTouchPad, isWebKit, isWin } from "../lib/useragent";
import { createElement } from "../lib/dom";
import { createDelayedCall } from "../lib/lang/createDelayedCall";
import { DelayedCall } from "../lib/lang/DelayedCall";
import { Editor } from "../Editor";
import { COMMAND_NAME_BACKSPACE } from '../editor_protocol';
import { COMMAND_NAME_DEL } from '../editor_protocol';
import { RangeBasic } from '../RangeBasic';
import { EventEmitterClass } from "../lib/EventEmitterClass";

const PLACEHOLDER = "\u2028\u2028";
const PLACEHOLDER_CHAR_FIRST = PLACEHOLDER.charAt(0);

interface InComposition {
    range?: RangeBasic;
    lastValue?: string;
}

export type TextInputEventName = 'text'
                                | 'delete'
                                | 'backspace'
                                | 'focus'
                                | 'blur'
                                | 'compositionStart'
                                | 'compositionUpdate'
                                | 'componsitionEnd';


export class TextInput {
    private text: HTMLTextAreaElement;
    _isFocused: boolean;
    private tempStyle: string;
    private afterContextMenu: boolean;
    private inComposition: InComposition;
    private inputHandler: ((data: string) => string) | null;

    private selectionStart: number;
    private selectionEnd: number;

    private pasted: boolean;
    private syncValue: DelayedCall;
    
    private _eventBus: EventEmitterClass<TextInputEventName, any, TextInput>;
    private _container: HTMLElement = null;

    constructor(container: Element, private editor: Editor) {
        this._eventBus = new EventEmitterClass<TextInputEventName, any, TextInput>(this);
        this.editor = editor;
        this._container = this.editor.container;
        this.tempStyle = '';
        this.afterContextMenu = false;
        this.inComposition = null;

        this.text = <HTMLTextAreaElement>createElement("textarea");
        this.text.className = "ace_text-input";

        if (isTouchPad) {
            this.text.setAttribute("x-palm-disable-auto-cap", 'true');
        }

        // autocapitalize is a nonstandard attribute supported by WebKit on iOS.
        // none, sentences, words, characters (on, off are deprecated).
        this.text.setAttribute("autocapitalize", "none");

        // HTML5. We don't want the browser to perform auto complete.
        this.text.setAttribute("autocorrect", "off");

        // HTML5. Setting to true means that the element needs to have its spelling and grammar checked.
        this.text.setAttribute("spellcheck", "false");

        // HTML5. POssible values are (hard, soft). soft is the default value.
        // FIXME: Why off?
        this.text.setAttribute("wrap", "off");

        this.text.style.opacity = "0";
        container.insertBefore(this.text, container.firstChild);

        // let copied = false;
        this.pasted = false;
        let isSelectionEmpty = true;

        this._isFocused = document.activeElement === this.text;

        this.text.addEventListener("blur", () => {
            this._emitBlur();
            this._isFocused = false;
        });
        this.text.addEventListener("focus", () => {
            this._isFocused = true;
            this._emitFocus();
            this.resetSelection();
        });

        // modifying selection of blured textarea can focus it (chrome mac/linux)
        const syncSelection = createDelayedCall(() => {
            if (this._isFocused) {
                this.resetSelection(isSelectionEmpty);
            }
        });

        this.syncValue = createDelayedCall(() => {
            if (!this.inComposition) {
                this.text.value = PLACEHOLDER;
                if (this._isFocused) {
                    this.resetSelection();
                }
            }
        });

        this.resetValue();

        let isAllSelected = function (text: HTMLTextAreaElement): boolean {
            return text.selectionStart === 0 && text.selectionEnd === text.value.length;
        };

        // const onSelect = (e: any) => {
        //     if (copied) {
        //         copied = false;
        //     }
        //     else if (isAllSelected(this.text)) {
        //         editor.selectAll();
        //         this.resetSelection();
        //     }
        //     else if (this.inputHandler) {
        //         if (editor.selection) {
        //             this.resetSelection(editor.selection.isEmpty());
        //         }
        //     }
        // };


        // this.text.addEventListener("select", onSelect);

        this.text.addEventListener("input", (ev) => this.onInput(ev));

        this.text.addEventListener("cut",  (e: ClipboardEvent): void => this.doCut(e));
        this.text.addEventListener("copy", (e: ClipboardEvent): void => this.doCopy(e));
        this.text.addEventListener("paste", (e: ClipboardEvent) => this.onPaste(e));

        const syncComposition = createDelayedCall(() => this.onCompositionUpdate(), 50);

        this.text.addEventListener("compositionstart", (ev: CompositionEvent) => this.onCompositionStart(ev));
        if (isGecko) {
            this.text.addEventListener("text", function () { syncComposition.schedule(); });
        } else {
            this.text.addEventListener("keyup", function () { syncComposition.schedule(); });
            this.text.addEventListener("keydown", function () { syncComposition.schedule(); });
        }
        this.text.addEventListener("compositionend", (ev: CompositionEvent) => this.onCompositionEnd(ev));
        this.text.addEventListener("contextmenu", (ev) => this.onContextMenu(ev));
    }

    /**
     * The event handler for the 'input' event of the text area.
     */
    private onInput(e?: any): void {
        if (this.inComposition) {
            return;
        }
        const data = this.text.value;
        // The data is essentially the last character typed because of the reset.
        this.sendText(data);
        this.resetValue();
    }

    private doCopy(e: ClipboardEvent): void {
        const data = this._emitCopy();
        if (!data) {
            preventDefault(e);
            return;
        }
        e.clipboardData.setData("text/plain", data);
        preventDefault(e);
    }

    private doCut(e: ClipboardEvent): void {
        const data = this._emitCut();
        if (!data) {
            preventDefault(e);
            return;
        }
        e.clipboardData.setData("text/plain", data);
        preventDefault(e);
    }

    // TODO: I don't see this being cleaned up. 
    private onPaste(e: ClipboardEvent): void {
        const text = e.clipboardData.getData("text/plain");
        if (text) {
            this._emitPaste(text);
        }
        preventDefault(e);
    }

    private onCompositionStart(ev: CompositionEvent): void {
        if (this.inComposition) {
            return;
        }

        this.inComposition = {};
        this._emitCompositionStart();

        setTimeout(() => this.onCompositionUpdate(), 0);
    }

    private onCompositionUpdate(): void {
        if ( ! this.inComposition) {
            return;
        }
        const val = this.text.value.replace(/\x01/g, "");
        if (this.inComposition != null && this.inComposition.lastValue === val) {
            return;
        }
        this._emitCompositionUpdate(val);
    }

    cancelComposition(): void {
        this.inComposition = null;
        this.resetValue();
    }

    private onCompositionEnd(e: CompositionEvent): void {
        const inComposition = this.inComposition;
        this.inComposition = null;
        let timer: number | null = window.setTimeout(() => {
            timer = null;
            const str = this.text.value.replace(/\x01/g, "");

            if (this.inComposition) {
                return;
            } else if (str === inComposition.lastValue) {
                this.resetValue();
            } else if (!inComposition.lastValue && str) {
                this.resetValue();
                this.sendText(str);
            }
        });

        this.inputHandler = function compositionInputHandler(str: string): string {
            if (timer) {
                clearTimeout(timer);
            }
            str = str.replace(/\x01/g, "");
            if (inComposition != null && str === inComposition.lastValue) {
                return "";
            }
            return str;
        };

        this._emitCompositionEnd(e);
    }

    getElement(): HTMLTextAreaElement {
        return this.text;
    }

    isFocused(): boolean {
        return this._isFocused;
    }

    moveToMouse(e: MouseEvent, bringToFront?: boolean): void {
        if (!this.tempStyle) {
            this.tempStyle = this.text.style.cssText;
        }

        this.text.style.cssText = (bringToFront ? "z-index:100000;" : "")
            + "height:" + this.text.style.height + ";";
        const rect = this._container.getBoundingClientRect();
        const style = window.getComputedStyle(this._container);
        const top = rect.top + intFromStringOrNull(style.borderTopWidth);
        const left = rect.left + intFromStringOrNull(style.borderLeftWidth);
        const maxTop = rect.bottom - top - this.text.clientHeight - 2;

        const move = (e: MouseEvent) => {
            this.text.style.left = e.clientX - left - 2 + "px";
            this.text.style.top = Math.min(e.clientY - top - 2, maxTop) + "px";
        };

        move(e);

        if (e.type !== "mousedown") {
            return;
        }

        // on windows context menu is opened after mouseup
        if (isWin) {
            capture(this._container, move, () => { this.onContextMenuClose(); });
        }
    }

    setReadOnly(readOnly: boolean): void {
        this.text.readOnly = readOnly;
    }

    focus(): void {
        return this.text.focus();
    }

    blur() {
        return this.text.blur();
    }

    onContextMenu(e: MouseEvent): void {
        this.afterContextMenu = true;
        this._emitContextMenu(e);
        this.moveToMouse(e, true);
    }

    onContextMenuClose(): void {
        setTimeout(() => {
            if (this.tempStyle) {
                this.text.style.cssText = this.tempStyle;
                this.tempStyle = '';
            }
            this._emitContextMenuClose();
        }, 0);
    }

    sendText(data: string): void {
        if (this.inputHandler) {
            data = this.inputHandler(data);
            this.inputHandler = null;
        }

        if (this.pasted) {
            this.resetSelection();
            if (data) {
                this._emitPaste(data);
            }
            this.pasted = false;
        } else if (data === PLACEHOLDER_CHAR_FIRST) {
            if (this.afterContextMenu) {
                this._emitDelete();
            } else {
                this._emitBackspace();
            }
        } else {
            if (data.substring(0, 2) === PLACEHOLDER) {
                data = data.substr(2);
            } else if (data.charAt(0) === PLACEHOLDER_CHAR_FIRST) {
                data = data.substr(1);
            } else if (data.charAt(data.length - 1) === PLACEHOLDER_CHAR_FIRST) {
                data = data.slice(0, -1);
            }
            // can happen if undo in textarea isn't stopped
            if (data.charAt(data.length - 1) === PLACEHOLDER_CHAR_FIRST) {
                data = data.slice(0, -1);
            }
            if (data) {
                this._emitText(data);
            }
        }
        if (this.afterContextMenu) {
            this.afterContextMenu = false;
        }
    }

    resetSelection(isEmpty?: boolean): void {
        if (this.inComposition) {
            return;
        }
        if (this.inputHandler) {
            this.selectionStart = 0;
            this.selectionEnd = isEmpty ? 0 : this.text.value.length - 1;
        } else {
            this.selectionStart = isEmpty ? 2 : 1;
            this.selectionEnd = 2;
        }
        // on firefox this throws if textarea is hidden
        try {
            this.text.setSelectionRange(this.selectionStart, this.selectionEnd);
        }
        catch (e) {
            // Do nothing.
        }
    }

    setInputHandler(inputHandler: (data: string) => string): void {
        this.inputHandler = inputHandler;
    }

    getInputHandler(): ((data: string) => string) | null {
        return this.inputHandler;
    }

    resetValue(): void {
        if (this.inComposition) {
            return;
        }
        this.text.value = PLACEHOLDER;
        // http://code.google.com/p/chromium/issues/detail?id=76516
        if (isWebKit)
            this.syncValue.schedule();
    }

    on(eventName: TextInputEventName, callback: (data: any, source: TextInput) => any, capturing?: boolean) {
        this._eventBus.on(eventName, callback, capturing);
        return () => {
            this.off(eventName, callback, capturing);
        };
    }

    off(eventName: TextInputEventName, callback: (data: any, source: TextInput) => any, capturing?: boolean): void {
        this._eventBus.off(eventName, callback/*, capturing*/);
    }

    once(eventName: TextInputEventName, callback: (data: any, source: TextInput) => any) {
        this._eventBus.once(eventName, callback);
    }

    private _emitText(data: string): void {
console.log("Input: ", data);
        this.editor.onTextInput(data);
    }

    private _emitBlur(): void {
        this.editor.onBlur();
    }
    private _emitFocus(): void {
        this.editor.onFocus();
    }

    private _emitContextMenu(e: MouseEvent): void {
        if (this.editor.selection) {
            this.resetSelection(this.editor.selection.isEmpty());
        }
        this.editor._emit("nativecontextmenu", { target: this.editor, domEvent: e });
    }

    private _emitContextMenuClose(): void {
        this.editor.renderer.$moveTextAreaToCursor();
    }

    private _emitCopy(): string {
        return this.editor.getSelectedText();
    }

    private _emitCut(): string {
        const data = this.editor.getSelectedText();
        // FIXME
        return data;
    }

    private _emitPaste(text: string): void {
        this.editor.onPaste(text);
    }

    private _emitDelete(): void {
        const delCommand = this.editor.commands.getCommandByName(COMMAND_NAME_DEL);
        this.editor.execCommand(delCommand, { source: "ace" });
    }

    private _emitBackspace(): void {
        // Some versions of Android do not fire keydown when pressing backspace.
        const backCommand = this.editor.commands.getCommandByName(COMMAND_NAME_BACKSPACE);
        this.editor.execCommand(backCommand, { source: "ace" });
    }

    private _emitCompositionStart(): void {
        this.editor.onCompositionStart();
    }

    private _emitCompositionUpdate(val: string): void {

    }

    private _emitCompositionEnd(e: CompositionEvent): void {
        this.editor.onCompositionEnd();
    }
}

function intFromStringOrNull(str: string | null): number {
    if (typeof str === 'string') {
        return parseInt(str, 10) || 0;
    } else {
        return 0;
    }
}
