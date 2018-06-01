/**
 * Copyright (c) 2010, Ajax.org B.V.
 * Copyright (c) 2015-2018, David Holmes
 * Licensed under the 3-Clause BSD license. See the LICENSE file for details.
 */
export interface WorkerCallback {

    on(name: string, callback);
    callback(data, callbackId: number);
    emit(name: string, data?);
}

