//import ReadableStream from 'node:stream/web'
import { ReadableStream } from 'node:stream/web';

class Response {
    // #region Properties
    // A ReadableStream of the body contents.
    #body_ = null;
    get body() { return this.#body_; }
    
    // Stores a boolean value that declares whether the body has been used in a response yet.
    #bodyUsed_ = false;
    get bodyUsed() { return this.#bodyUsed_; }
    
    // // The Headers object associated with the response.
    #headers_ = {};
    get headers() { return this.#headers_; }
    
    // A boolean indicating whether the response was successful (status in the range 200 – 299) or not.
    //#ok_ = false;
    get ok() { return this.#status_ >= 200 && this.#status_ < 300; }
    
    // // Indicates whether or not the response is the result of a redirect (that is, its URL list has more than one entry).
    // #redirected_ = false;
    // get redirected() { return this.#redirected_; }
    
    // The status code of the response. (This will be 200 for a success).
    #status_ = 200;
    get status() { return this.#status_; }
    
    // The status message corresponding to the status code. (e.g., OK for 200).
    #statusText_ = '';
    get statusText() { return this.#statusText_ }
    
    // // The type of the response (e.g., basic, cors).
    // #type_ = 'basic';
    // get type() {return this.#type_; }
    
    // // The URL of the response.
    // #url_ = '';
    // get url() { return this.url_; }

    // #endregion
    
    // #region Static methods
    // Returns a new Response object associated with a network error.
    static error(err) {
        // var resp = new Response();
        // resp.error = err;
        // return resp;
    }
    
    // Returns a new response with a different URL.
    static redirect(url) {
        // var resp = new Response();
        // resp.url_ = url;
        // return resp;
    }
    
    // Returns a new Response object for returning the provided JSON encoded data.
    static json(data) {
        // var resp = new Response();
        // resp.body_ = data;
        // return resp;
    }
    // #endregion
    
    static #defaultOptions_ = {
        status: 200,
        statusText: 'Ok',
        headers: []
    };

    // #region Instance methods
    constructor(body, options) {
        options = options || {};
        for (var i in Response.#defaultOptions_) {
            if (options[i] == undefined) options[i] = Response.#defaultOptions_[i];
        }
        this.#body_ = ReadableStream.from([body]);
        this.#status_ = options.status || 200;
        this.#statusText_ = options.statusText || '';
        if (Array.isArray(options.headers)) {
            for (var hi in options.headers) {
                if (options.headers.hasOwnProperty(hi)) {
                    this.#headers_[hi] = options.headers[hi];
                }
            }
        }
    }

    async #readBody() {
        const reader = this.body.getReader();
        const chunks = [];
        var done, value;
    
        while (!done) {
            ({ done, value } = await reader.read());
            if (value) {
                chunks.push(value);
            }
        }

        var totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        var buffer = new Uint8Array(totalLength);
    
        var offset = 0;
        for (var chunk of chunks) {
            buffer.set(chunk, offset);
            offset += chunk.length;
        }
    
        return buffer;
    }

    // Returns a promise that resolves with an ArrayBuffer representation of the response body.
    // arrayBuffer() {
    //     return new Promise((res, rej) => res(ArrayBuffer.from(this.body)));
    // }
    
    // Returns a promise that resolves with a Blob representation of the response body.
    async blob() {
        return await this.#readBody();
    }
    
    // Creates a clone of a Response object.
    // clone() {
    // }
    
    // // Returns a promise that resolves with a FormData representation of the response body.
    // formData() {
    // }
    
    // Returns a promise that resolves with the result of parsing the response body text as JSON.
    async json() {
        // var txt = await this.text();
        // return JSON.parse(txt);
        return this.text().then(txt => JSON.parse(txt));
    }
    
    // Returns a promise that resolves with a text representation of the response body.
    async text() {
        var decoder = new TextDecoder();
        var buffer = await this.#readBody();
        return decoder.decode(buffer);
    }
    // #endregion
}

export { Response }