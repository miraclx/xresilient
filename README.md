# xresilient

> Build regenerative, resumable NodeJS streams

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

[![NPM][npm-image-url]][npm-url]

## Installing

Via [NPM][npm]:

``` bash
npm install xresilient
```

## Usage

``` javascript
// Node CommonJS
const xresilient = require('xresilient');
// Or ES6
import xresilient from 'xresilient';
```

## Examples

``` javascript
const retriableStream = xresilient(
  function returnStream({bytesRead, retryCount}) {
    console.log(`Count = ${retryCount}`);
    return request.get('https://website.com/image.png', {
      headers: {
        Range: `bytes=${bytesRead}-`,
      },
    });
  },
  {retries: 5},
);

retriableStream.pipe(fs.createWriteStream('image.png'));
```

The above snippet of code would request an image file from the URL and pipe the result into the `image.png` file

Based on the configuration to retry `5` times, it would recall the function specified with the number of bytes read before the error so you can resume the stream if need be

For instance, get requests interrupted by network errors can be resumed without breaking the active pipe.

## API

### xresilient(fn[, options])

* `fn`: &lt;[GenFn](#genfn)&gt;
* `options` <sub>`extends`</sub> [`stream.ReadableOptions`][stream.ReadableOptions]: [Object][object]
  * `retries`: &lt;[number][]&gt; Number of times to retry the stream. **Default**: `5`.
  * `destroyer`: &lt;[function][]&gt; Method with which to destroy the underlying stream.
    * `source`: &lt;[NodeJS.ReadableStream][]&gt; Readable stream returned by the specified `fn` function.
* Returns: &lt;[ResilientStream](#resilientstream)&gt;

Return a regenerative, persistent, resuming, resilient stream wrapped
That swaps underlying stream source without data loss.

The `fn` argument must be a function taking two arguments returning a ResilientStream.

#### Event: 'retry'

* `retrySlice`: &lt;[RetrySlice](#retryslice)&gt;

The `'retry'` event is emitted after a stream's `'error'` event is emitted and the stream hasn't used up all of it's retries.

This event is emitted right before the [genFn](#genfn) is called.

#### Event: 'error'

* `err`: &lt;[Error][]&gt;

The `'error'` event is emitted when the underlying readable stream encounters an `'error'` event while the resilient stream has maxed-out all possible retries.
i.e

```javascript
self.getRetries() === self.getRetryCount()
```

At this point, the resilient stream is destroyed and the specified [GenFn](#genfn) isn't called.
This, ends the resilient iteration.

### <a id='genfn'></a>GenFn: [`Function`][function]

* `storeSlice`: &lt;[ResilientStore](#resilientstore)&gt;
* Returns: &lt;[NodeJS.ReadableStream][]&gt;

### <a id='resilientstream'></a>ResilientStream <sub>`extends`</sub> [stream.Readable][]

The Core resilient stream whose data is streamed off of the underlying streams gotten from the [GenFn](#genfn).

### <a id='retryslice'></a>RetrySlice: [object][]

* `retryCount`: &lt;[number][]&gt; The number of retry iterations so far.
* `maxRetries`: &lt;[number][]&gt; The maximum number of retries possible.
* `bytesRead`: &lt;[number][]&gt; The number of bytes previously read (if any).
* `lastErr`: &lt;[Error][]&gt; The error emitted by the previous stream.
* `oldStream`: &lt;[NodeJS.ReadableStream][]&gt; The old stream that error-ed out (if any).

### <a id='resilientstore'></a>ResilientStore <sub>`extends`</sub> [RetrySlice](#retryslice): [object][]

* `chunkCount`: &lt;[number][]&gt; The active execution iteration count.

### <a id='resilientstream_setretries'></a>ResilientStream.setRetries(retries)

* `retries`: &lt;[number][]&gt; The retry value to update to.
* Returns: &lt;[boolean][]&gt;

This method sets the number of possible retries.
If the `retryCount` is less than this value, returns `false`.
else, returns `true` on successful setting.

### <a id='resilientstream_getretries'></a>ResilientStream.getRetries()

* Returns: &lt;[number][]&gt;

Returns the value of max possible retries before error emit.

### <a id='resilientstream_getretrycount'></a>ResilientStream.getRetryCount()

* Returns: &lt;[number][]&gt;

Returns the number of the retries so-far.

## Development

### Building

Feel free to clone, use in adherance to the [license](#license) and perhaps send pull requests

``` bash
git clone https://github.com/miraclx/xresilient.git
cd xresilient
npm install
# hack on code
npm run build
```

## License

[Apache 2.0][license] © **Miraculous Owonubi** ([@miraclx][author-url]) &lt;omiraculous@gmail.com&gt;

[stream.Readable]: https://nodejs.org/api/stream.html#stream_class_stream_readable
[NodeJS.ReadableStream]: https://nodejs.org/api/stream.html#stream_class_stream_readable
[stream.ReadableOptions]: https://nodejs.org/api/stream.html#stream_new_stream_readable_options

[npm]:  https://github.com/npm/cli "The Node Package Manager"
[license]:  LICENSE "Apache 2.0 License"
[author-url]: https://github.com/miraclx

[npm-url]: https://npmjs.org/package/xresilient
[npm-image]: https://badgen.net/npm/node/xresilient
[npm-image-url]: https://nodei.co/npm/xresilient.png?stars&downloads
[downloads-url]: https://npmjs.org/package/xresilient
[downloads-image]: https://badgen.net/npm/dm/xresilient

[Error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
