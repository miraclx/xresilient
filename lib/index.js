/* eslint-disable no-underscore-dangle */
/* eslint-disable no-use-before-define */
const stream = require('stream');

function CHECK_VAR(val, varName, type, optional) {
  if (val) {
    // eslint-disable-next-line valid-typeof
    if (typeof val !== type) {
      const er = new TypeError(`<${varName}>${optional ? ', if defined,' : ''} must be a valid type \`${type}\``);
      throw er;
    } else return true;
  }
}

class ResilientStream extends stream.Readable {}

module.exports = function xresilient(fn, opts) {
  if (!fn || typeof fn !== 'function') throw Error('Please specify <fn> as a :Function');
  if (opts && typeof opts !== 'object') throw Error('<opts>, if defined, must be an object');
  const store = {fn, bytesRead: 0, source: null, _source: null, retries: 5, retryCount: 0};
  opts = opts || {};
  if (CHECK_VAR(opts.retries, 'opts.retries', 'number', true)) (store.retries = opts.retries), delete opts.retries;
  const self = new ResilientStream(opts);

  function buildUnderlayer(retrySlice) {
    const _source = store.fn({...retrySlice, chunkCount: (store.retryCount += 1)});
    if (!(_source && [_source.on, _source.once, _source.pipe].every(slot => typeof slot === 'function'))) {
      const er = Error(`xresilient generative function should return a readable stream`);
      throw er;
    }
    let source = _source;
    if (!source._readableState) source = source.pipe(stream.PassThrough(opts));

    store.source = source;
    store._source = _source;

    function ondrain(err) {
      const xdataSlice = {retryCount: store.retryCount, bytesRead: store.bytesRead, lastErr: err, oldStream: source};
      if (!store.retries || store.retryCount === store.retries) self.emit('error', err);
      else self.emit('retry', xdataSlice), buildUnderlayer(xdataSlice);
    }

    function onerr(err) {
      cleanup();
      if (!source._readableState.ended && source._readableState.length) source.once('drain', ondrain.bind(null, err));
      else ondrain(err);
    }

    function onend() {
      cleanup();
      self.push(null);
    }

    function ondata(chunk) {
      store.bytesRead += chunk.length;
      const ret = self.push(chunk);
      if (!ret) source.pause();
    }

    function cleanup() {
      source.removeListener('end', onend);
      source.removeListener('data', ondata);
      _source.removeListener('error', onerr);
    }

    source.on('data', ondata);
    source.once('end', onend);
    _source.once('error', onerr);
  }

  self._read = () => {};
  self.getRetries = () => store.retries;
  self.getRetryCount = () => store.retryCount;
  self.setRetries = retries => {
    if (typeof retries !== 'number') throw new Error("<n>, if defined, must be a valid `'number'` type");
    return retries >= store.retryCount && ((store.retries = retries), true);
  };
  buildUnderlayer({retryCount: store.retryCount, bytesRead: store.bytesRead});
  return self;
};
