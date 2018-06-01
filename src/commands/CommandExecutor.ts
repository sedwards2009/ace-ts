/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Command } from './Command';

export interface CommandExecutor<TARGET> {
    exec(command: Command<TARGET>, target?: TARGET, args?: any): boolean;
    getCommandByName(name: string): Command<TARGET>;
}

