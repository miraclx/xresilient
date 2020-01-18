// Type definitions for xresilient
// Project: https://github.com/miraclx/xresilient
// Definitions by: Miraculous Owonubi <https://github.com/miraclx>

/// <reference types="node" />

import * as stream from 'stream';

type ProtoExtends<T, U> = U & Omit<T, keyof U>;

declare function xresilient<T = NodeJS.ReadableStream>(
  fn: (storeSlice: xresilient.ResilientStore<T>) => T, options?: xresilient.ResilientOpts
): xresilient.ResilientStream<T>;

interface _ResilientStream<T> {
  on(event: 'retry', listener: (retrySlice: xresilient.RetrySlice<T>) => void): this;
  setRetries(retries: number): boolean;
  getRetries(): number;
  getRetryCount(): number;
}

declare namespace xresilient {
  interface ResilientOpts extends stream.ReadableOptions {
    retries: number;
  }
  interface RetrySlice<T> {
    retryCount: number;
    bytesRead: number;
    lastErr: Error;
    oldStream: T;
  }

  interface ResilientStore<T> extends RetrySlice<T> {
    chunkCount: number;
  }

  interface ResilientStream<T> extends ProtoExtends<stream.Readable, _ResilientStream<T>> { }
}

export = xresilient;
