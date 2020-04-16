/* eslint-disable no-underscore-dangle, no-use-before-define */
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
  if (!fn || typeof fn !== 'function') throw new Error('Please specify <fn> as a :Function');
  if (opts && typeof opts !== 'object') throw new Error('<opts>, if defined, must be an object');
  const store = {fn, bytesRead: 0, source: null, _source: null, retries: 5, retryCount: 0, hasGeneratedOnce: false};
  opts = {destroyer: source => source.destroy(), ...(opts || {})};
  if (CHECK_VAR(opts.destroyer, 'opts.destroyer', 'function', true)) (store.destroyer = opts.destroyer), delete opts.destroyer;
  if (CHECK_VAR(opts.retries, 'opts.retries', 'number', true)) (store.retries = opts.retries), delete opts.retries;
  const self = new ResilientStream(opts);

  async function buildUnderlayer(retrySlice) {
    store.hasGeneratedOnce = true;
    const _source = await store.fn({...retrySlice, trialCount: (store.retryCount += 1)});
    if (!(_source && [_source.on, _source.once, _source.pipe].every(slot => typeof slot === 'function'))) {
      const er = new Error(`xresilient generative function should return a readable stream`);
      throw er;
    }
    let source = _source;
    if (!source._readableState) source = source.pipe(stream.PassThrough(opts));
    store.source = source;
    store._source = _source;

    if (_source._readableState.ended) return onend();
    if (_source._readableState.destroyed) return ondrain();

    function ondrain(err) {
      if (!_source._readableState.destroyed) store.destroyer(_source);
      source.destroy();
      containedUnderlayer({lastErr: err, oldStream: source});
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
    return null;
  }

  function containedUnderlayer(xdataSlice) {
    xdataSlice = {
      retryCount: store.retryCount,
      maxRetries: store.retries,
      bytesRead: store.bytesRead,
      ...xdataSlice,
    };
    if (!store.retries || store.retryCount === store.retries) self.emit('error', xdataSlice.err);
    else {
      if (store.hasGeneratedOnce) self.emit('retry', xdataSlice);
      buildUnderlayer(xdataSlice).catch(lastErr => containedUnderlayer({lastErr}));
    }
  }

  self._read = () => {
    if (store.source) {
      if (!store.source._readableState.flowing) store.source.resume();
    } else containedUnderlayer();
  };
  self._destroy = (err, cb) => (store._source ? store.destroyer(store._source) : null, cb(err));
  self.getRetries = () => store.retries;
  self.getRetryCount = () => store.retryCount;
  self.setRetries = retries => {
    if (typeof retries !== 'number') throw new Error("<n>, if defined, must be a valid `'number'` type");
    return retries >= store.retryCount && ((store.retries = retries), true);
  };
  return self;
};
