/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { TextMode } from "./TextMode";
import { hookAnnotations, hookTerminate, initWorker } from './TextMode';
import { HaskellHighlightRules } from "./HaskellHighlightRules";
import { CstyleFoldMode } from "./folding/CstyleFoldMode";
import { WorkerClient } from "../worker/WorkerClient";
import { EditSession } from '../EditSession';

export class HaskellMode extends TextMode {

    constructor(workerUrl: string, scriptImports: string[]) {
        super(workerUrl, scriptImports);
        this.$id = "Haskell";
        this.blockComment = { start: "/*", end: "*/" };
        this.lineCommentStart = "--";
        this.HighlightRules = HaskellHighlightRules;
        this.foldingRules = new CstyleFoldMode();
    }

    createWorker(session: EditSession, callback: (err: any, worker?: WorkerClient) => any): void {
        const worker = new WorkerClient(this.workerUrl);
        const tearDown = hookAnnotations(worker, session, true);
        hookTerminate(worker, session, tearDown);
        initWorker(worker, 'stemcstudio-workers.js', 'HaskellWorker', this.scriptImports, session, callback);
    }
}

export const Mode = HaskellMode;
