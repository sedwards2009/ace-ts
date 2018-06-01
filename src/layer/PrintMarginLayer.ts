/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { AbstractLayer } from './AbstractLayer';
import { refChange } from '../refChange';

export class PrintMarginLayer extends AbstractLayer {

    /**
     * 
     */
    constructor(parent: HTMLDivElement) {
        super(parent, '"ace_layer ace_text-layer"');
        refChange(this.uuid, 'PrintMarginLayer', +1);
    }

    /**
     * 
     */
    dispose(): void {
        refChange(this.uuid, 'PrintMarginLayer', -1);
        super.dispose();
    }
}

