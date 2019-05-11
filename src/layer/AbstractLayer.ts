/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { createElement, setCssClass } from "../lib/dom";
import { Disposable } from '../Disposable';


export class AbstractLayer implements Disposable {

    /**
     * This is the child of the DOM element that the layer is associated with.
     */
    element: HTMLDivElement = null;

    /**
     * Creates an underlying element, sets the className property, and appends to the parent.
     */
    constructor(private readonly parent: HTMLElement, className: string) {
        // TODO: createHTMLDivElement would be nice convenience to avoid casting?
        // We should probably pay more attention to the owner document too.
        this.element = createElement('div') as HTMLDivElement;
        this.element.className = className;
        parent.appendChild(this.element);
    }

    dispose(): void {
        this.parent.removeChild(this.element);
        this.element = null;
    }

    setCssClass(className: string, include: boolean): void {
        setCssClass(this.element, className, include);
    }
}
