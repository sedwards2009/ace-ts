/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Command } from '../commands/Command';

/**
 *
 */
export interface KeyboardResponse<TARGET> {
    /**
     *
     */
    command: Command<TARGET> | null;
    /**
     *
     */
    args?: any;
    /**
     *
     */
    passEvent?: boolean;
}

