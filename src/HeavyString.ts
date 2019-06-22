/**
 * Copyright (c) 2019, Simon Edwards <simon@simonzone.com>
*/

/**
 * This type is used to pass through a string plus extra data which can be
 * used by subclasses of EditSession and Renderer etc.
 */

export interface HeavyString {
  length: number;
  getString(): string;
}
