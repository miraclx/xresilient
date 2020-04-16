// Type definitions for xresilient
// Project: https://github.com/miraclx/xresilient
// Definitions by: Miraculous Owonubi <https://github.com/miraclx>

/// <reference types="node" />

import * as stream from 'stream';

type ProtoExtends<T, U> = U & Omit<T, keyof U>;

declare function xresilient<T = NodeJS.ReadableStream>(
  fn: (storeSlice: xresilient.ResilientStore<T>) => T | Promise<T>, options?: xresilient.ResilientOpts<T>
): xresilient.ResilientStream<T>;

interface _ResilientStream<T> {
  on(event: 'data', listener: (chunk: any) => void): this;
  on(event: 'end', listener: () => void): this;
  on(event: 'retry', listener: (retrySlice: xresilient.RetrySlice<T>) => void): this;
  on(event: 'readable', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  setRetries(retries: number): boolean;
  getRetries(): number;
  getRetryCount(): number;
}

declare namespace xresilient {
  interface ResilientOpts<T> extends stream.ReadableOptions {
    retries: number;
    destroyer(source: T): void;
  }
  interface RetrySlice<T> {
    retryCount: number;
    maxRetries: number;
    bytesRead: number;
    lastErr: Error;
    oldStream: T;
  }

  interface ResilientStore<T> extends RetrySlice<T> {
    trialCount: number;
  }

  interface ResilientStream<T> extends ProtoExtends<stream.Readable, _ResilientStream<T>> { }
}

export = xresilient;
