const stream = require('stream');

class ResilientStream extends stream.Transform {}

module.exports = function xresilient(fn, opts) {
  if (!fn || typeof fn !== 'function') throw Error('Please specify <fn> as a :Function');
  if (opts && typeof opts !== 'object') throw Error('<opts>, if defined, must be an object');
  const store = {fn, bytesRead: 0, source: null, retries: 5, retryCount: 0, paused: false};
  opts = opts || {};
  if (opts.retries) (store.retries = opts.retries), delete opts.retries;
  store.xtream = new ResilientStream(opts);
  function work(retrySlice) {
    // eslint-disable-next-line no-underscore-dangle
    const _source = store.fn({...retrySlice, chunkCount: (store.retryCount += 1)});
    let source = _source;
    if (!(_source && [_source.on, _source.once, _source.pipe].every(slot => typeof slot === 'function'))) {
      const er = Error(`Function should return a readable stream`);
      throw er;
    }
    // eslint-disable-next-line no-underscore-dangle
    if (!source._readableState) source = source.pipe(stream.PassThrough(opts));
    function onErr(err) {
      source.unpipe(store.xtream);
      const xdataSlice = {retryCount: store.retryCount, bytesRead: store.bytesRead, lastErr: err, oldStream: source};
      if (!store.retries || store.retryCount === store.retries) store.xtream.emit('error', err);
      else store.xtream.emit('retry', xdataSlice), work(xdataSlice);
    }
    function onEnd() {
      _source.removeListener('error', onErr);
      store.xtream.push(null);
    }
    _source.on('error', onErr);
    source.on('end', onEnd);
    source.pipe(store.xtream, {end: false});
  }
  // eslint-disable-next-line no-underscore-dangle
  store.xtream._transform = (v, e, c) => ((store.bytesRead += v.length), c(null, v));
  store.xtream.getRetries = () => store.retries;
  store.xtream.getRetryCount = () => store.retryCount;
  store.xtream.setRetries = retries => {
    if (typeof retries !== 'number') throw new Error("<n>, if defined, must be a valid `'number'` type");
    return retries >= store.retryCount && ((store.retries = retries), true);
  };
  return work({retryCount: store.retryCount, bytesRead: store.bytesRead}), store.xtream;
};
