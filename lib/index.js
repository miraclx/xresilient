const stream = require('stream');

class ResilientStream extends stream.Readable {}

module.exports = function xresilient(fn, opts) {
  if (!fn || typeof fn !== 'function') throw Error('Please specify <fn> as a :Function');
  if (opts && typeof opts !== 'object') throw Error('<opts>, if defined, must be an object');
  const store = {fn, bytesRead: 0, source: null, retries: 5, retryCount: 1, paused: false};
  opts = opts || {};
  if (opts.retries) (store.retries = opts.retries), delete opts.retries;
  store.xtream = new ResilientStream(opts);
  // eslint-disable-next-line no-underscore-dangle
  const state = store.xtream._readableState;

  function work() {
    // eslint-disable-next-line no-multi-assign
    const source = (store.source = store.fn({retryCount: store.retryCount, bytesRead: store.bytesRead, oldStream: store.source}));
    if (!(source && [source.on, source.once, source.pipe].every(slot => typeof slot === 'function'))) {
      const er = Error(`Function should return a readable stream`);
      throw er;
    }
    function handleChunk(chunk) {
      if (this !== store.source) return;
      if (state.decoder) chunk = state.decoder.write(chunk);
      if (state.objectMode && (chunk === null || chunk === undefined)) return;
      if (!state.objectMode && (!chunk || !chunk.length)) return;
      store.bytesRead += chunk.length;
      const ret = store.xtream.push(chunk);
      if (!ret) (store.paused = true), source.pause();
    }
    function handleEnd() {
      if (state.decoder) {
        const chunk = state.decoder.end();
        if (chunk && chunk.length) store.xtream.push(chunk);
      }
      store.xtream.push(null);
    }

    function handleErr(err) {
      source.removeListener('data', handleChunk).removeListener('end', handleEnd);
      if (!store.retries || store.retryCount === store.retries) store.xtream.emit('error', err);
      else store.xtream.emit('retry', (store.retryCount += 1)), work();
    }

    source
      .on('data', handleChunk)
      .once('end', handleEnd)
      .once('error', handleErr);
    // eslint-disable-next-line no-underscore-dangle
    store.xtream._read = () => (store.paused ? ((store.paused = false), source.resume()) : null);
  }

  work();
  return store.xtream;
};
