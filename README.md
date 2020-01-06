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
* `options` <sub>`extends`</sub> [`NodeJS.ReadableOptions`][NodeJS.ReadableOptions]: [`Object`][object]
  * `retries`: &lt;[number][]&gt; Number of times to retry the stream. **Default**: `5`.
* Returns: &lt;[ResilientStream](#resilientstream)&gt;

Return a regenerative, persistent, resuming, resilient stream wrapped
That swaps underlying stream source without data loss.

The `fn` argument must be a function taking two arguments returning a Readable Stream.

#### Event: 'retry'

* `retryCount`: &lt;[number][]&gt; The number of trial iterations so far.
* `bytesRead`: &lt;[number][]&gt; The number of bytes already read by the old stream.

The `'retry'` event is emitted after a stream's `'error'` event is emitted and the stream hasn't used up all of it's retries.

This event is emitted right before the [genFn](#genfn) is called.

### <a id='genfn'></a>GenFn: [`Function`][function]

* `storeSlice`:
  * `retryCount`: &lt;[number][]&gt; The trial count of this iteration.
  * `bytesRead`: &lt;[number][]&gt; The number of bytes previously read (if any).
  * `oldStream`: &lt;[NodeJS.ReadableStream][]&gt; The old stream that error-ed out (if any).
* Returns: &lt;[NodeJS.ReadableStream][]&gt;

### <a id='resilientstream'></a>ResilientStream <sub>`extends`</sub> [NodeJS.ReadableStream][]

The Core resilient stream whose data is streamed off of the underlying streams gotten from the [GenFn](#genfn).

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

[NodeJS.ReadableStream]: https://nodejs.org/api/stream.html#stream_class_stream_readable

[NodeJS.ReadableOptions]: https://nodejs.org/api/stream.html#stream_new_stream_readable_options

[npm]:  https://github.com/npm/cli "The Node Package Manager"
[license]:  LICENSE "Apache 2.0 License"
[author-url]: https://github.com/miraclx

[npm-url]: https://npmjs.org/package/xresilient
[npm-image]: https://badgen.net/npm/node/xresilient
[npm-image-url]: https://nodei.co/npm/xresilient.png?stars&downloads
[downloads-url]: https://npmjs.org/package/xresilient
[downloads-image]: https://badgen.net/npm/dm/xresilient

[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
