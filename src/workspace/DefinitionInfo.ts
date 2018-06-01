/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
// import { Position } from './Position';
import { TextSpan } from './TextSpan';

export interface DefinitionInfo<POSITION> {
    fileName: string;
    textSpan: TextSpan<POSITION>;
    kind: string;
    name: string;
    containerKind: string;
    containerName: string;
}
/*
export function toDefinitionAtPosition(definitionInfo: DefinitionInfo): DefintionAtPosition {

}
*/

