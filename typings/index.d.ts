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
  on(event: 'retry', listener: (dataSlice: { retryCount: number, bytesRead: number, lastErr: Error }) => void): this;
  setRetries(retries: number): boolean;
  getRetries(): number;
  getRetryCount(): number;
}

namespace xresilient {
  interface ResilientOpts extends stream.TransformOptions {
    retries: number;
  }
  interface ResilientStore<T> {
    retryCount: number;
    bytesRead: number;
    oldStream: T;
  }
  interface ResilientStream<T> extends ProtoExtends<stream.Transform, _ResilientStream> { }
}

export = xresilient;
