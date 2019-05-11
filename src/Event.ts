/*
 * Copyright (c) 2019, Simon Edwards
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
import { Disposable } from "./Disposable";

/**
 * Function which represents a specific event which you can subscribe to.
 */
export interface Event<T> {
  (listener: (e: T) => any): Disposable;
}
