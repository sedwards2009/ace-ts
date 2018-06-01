/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { TypeScriptMode } from './TypeScriptMode';

/**
 * The tsx mode extends the TypeScript mode.
 */
export class TsxMode extends TypeScriptMode {
    constructor(workerUrl: string, scriptImports: string[]) {
        super(workerUrl, scriptImports);
        this.$id = "TSX";
        this.$highlightRuleConfig = { jsx: true };
    }
}

