// Type definitions for xresilient
// Project: https://github.com/miraclx/xresilient
// Definitions by: Miraculous Owonubi <https://github.com/miraclx>

/// <reference types="node" />

import * as stream from 'stream';

type ProtoExtends<T, U> = U & Omit<T, keyof U>;

function xresilient<T = NodeJS.ReadableStream>(
  fn: (storeSlice: xresilient.ResilientStore<T>) => T, options?: xresilient.ResilientOpts
): xresilient.ResilientStream<T>;

interface _ResilientStream {
  on(event: 'retry', listener: (retryCount: number) => void): this;
}

namespace xresilient {
  interface ResilientOpts extends stream.ReadableOptions {
    retries: number;
  }
  interface ResilientStore<T> {
    retryCount: number;
    bytesRead: number;
    oldStream: T;
  }
  interface ResilientStream<T> extends ProtoExtends<NodeJS.ReadableStream, _ResilientStream> { }
}

export = xresilient;
