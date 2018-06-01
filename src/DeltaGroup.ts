/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { DeltaWithFolds } from './DeltaWithFolds';

export interface DeltaGroup {
    /**
     * FIXME: This might also allow 'fold'?
     */
    group: 'doc';

    /**
     * 
     */
    deltas: DeltaWithFolds[];
}

