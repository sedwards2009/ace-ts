/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export type RuleArgumentType = boolean | number | string | object;

/**
 * This corresponds to IConfigurationFile in the tslint worker code.
 */
export interface TsLintSettings {
    extends?: string | string[];
    jsRules?: { [name: string]: boolean | RuleArgumentType[] };
    linterOptions?: {
        typeCheck?: boolean,
    };
    rulesDirectory?: string | string[];
    rules?: { [name: string]: boolean | RuleArgumentType[] };
}

