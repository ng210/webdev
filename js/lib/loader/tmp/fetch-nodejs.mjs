import fs from 'node:fs';
import http from 'node:http';
import { Response } from './response.mjs'

// #region options
const defaultOptions_ = {
    'body': null,
    'cache': 'default',
    //     A string indicating how the request will interact with the browser's HTTP cache.
    //     The possible values, default, no-store, reload, no-cache, force-cache, and only-if-cached.
    'credentials': 'omit',
    //     Controls what browsers do with credentials (cookies, HTTP authentication entries, and TLS client certificates).
    //     Must be one of the following strings:
    //     - omit: Tells browsers to exclude credentials from the request, and ignore any credentials sent back in the response (e.g., any Set-Cookie header).
    //     - same-origin: Tells browsers to include credentials with requests to same-origin URLs, and use any credentials sent back in responses from same-origin URLs. This is the default value.
    //     - include: Tells browsers to include credentials in both same- and cross-origin requests, and always use any credentials sent back in responses.
    //     Note: Credentials may be included in simple and "final" cross-origin requests, but should not be included in CORS preflight requests.
    'headers': [],            
    //     Any headers you want to add to your request, contained within a Headers object or an object literal with String values. Note that some names are forbidden.
    //     Note: The Authorization HTTP header may be added to a request, but will be removed if the request is redirected cross-origin.
    'integrity': '',
    //     Contains the subresource integrity value of the request (e.g., sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=).
    'keepalive': false,
    //     The keepalive option can be used to allow the request to outlive the page. Fetch with the keepalive flag is a replacement for the Navigator.sendBeacon() API.
    'method': 'GET',
    //     The request method, e.g., "GET", "POST". The default is "GET".
    //     Note that the Origin header is not set on Fetch requests with a method of HEAD or GET.
    //     Any string which is a case-insensitive match for one of the methods in RFC 9110 will be uppercased automatically. If you want to use a custom method (like PATCH), you should uppercase it yourself.
    'mode': 'same-origin',            
    //     The mode you want to use for the request, e.g., cors, no-cors, or same-origin.
    'priority': 'auto',
    //     Specifies the priority of the fetch request relative to other requests of the same type. Must be one of the following strings:
    //     - high: a high priority fetch request relative to other requests of the same type.
    //     - low: a low priority fetch request relative to other requests of the same type.
    //     - auto: automatically determine the priority of the fetch request relative to other requests of the same type (default).
    'redirect': 'follow',
    //     How to handle a redirect response:
    //     - follow: automatically follow redirects. Unless otherwise stated the redirect mode is set to follow.
    //     - error: abort with an error if a redirect occurs.
    //     - manual: caller intends to process the response in another context. See WHATWG fetch standard for more information.
    'referrer': '',
    //     A string specifying the referrer of the request. This can be a same-origin URL, about:client, or an empty string.
    'referrerPolicy': 'same-origin',
    //     Specifies the referrer policy to use for the request.
    //     May be one of no-referrer, no-referrer-when-downgrade, same-origin, origin, strict-origin, origin-when-cross-origin, strict-origin-when-cross-origin, or unsafe-url.
    'signal': null
    //     An AbortSignal object instance; allows you to communicate with a fetch request and abort it if desired via an AbortController.
};
// #endregion

async function fetch(resource, options) {
    for (var oi in defaultOptions_) {
        if (options[oi] == undefined) options[oi] = defaultOptions_[oi];
    }

    var resp = null;
    var url = new URL(resource);
    const filePrefix = 'file:///';
    if (resource.startsWith(filePrefix)) {
        // fetch file
        if (options.method.toUpperCase() == 'GET') {
            if (options.type.mimeType != 'text/javascript') {
                var buf = fs.readFileSync(url.href.substring(filePrefix.length));
                resp = new Response(buf);
            } else {
                resp = await import(url.href);
            }
        } else {
            throw new Error('Only GET methods are supported!');
        }
    } else if (resource.startsWith('http')) {
        resp = await new Promise((resolve, reject) => {
            const req = http.request(
                {
                    headers: options.headers,
                    method: options.method,
                    protocol: url.protocol,
                    host: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    body: options.body
                },
                res => {
                    const chunks = [];
                    res.on('data', chunk => chunks.push(chunk));
                    res.on('end', () => {
                        var totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                        var buffer = new Uint8Array(totalLength);
                    
                        var offset = 0;
                        for (var chunk of chunks) {
                            buffer.set(chunk, offset);
                            offset += chunk.length;
                        }
                        resolve(
                            new Response(buffer, {
                                status: res.statusCode,
                                statusText: res.statusMessage,
                                headers: res.headers
                            })
                        );
                    });
                });
    
            req.on('error', err => {
                reject(err);
            });
            if (options.body) {
                req.write(options.body);
            }        
            req.end();
        });
        // {
        //     var error = null;
        //     const { statusCode } = resp;
        //     const contentType = resp.headers['content-type'];
        //     if (statusCode !== 200) {
        //         options.error = new Error(`Request Failed: Status Code: ${statusCode}`);
        //     } else if (!contentType.startsWith(options.contentType)) {
        //         options.error = new Error(`Invalid content-type.\n: Expected ${options.contentType} but received ${contentType}`);
        //     }
        //     if (options.error) {
        //         debug_('AJX.' + options.error, 2);
        //         resp.resume();
        //         resolve(options);
        //     } else {
        //         resp.setEncoding(options.charSet);
        //         var rawData = '';
        //         resp.on('data', chunk => { rawData += chunk; });
        //         resp.on('end', () => {
        //             try {
        //                 options.resolvedUrl = options.url;
        //                 options.response = _processContent(options.contentType, rawData);
        //             } catch (e) {
        //                 options.error = e.message;
        //             }
        //             resolve(options);
        //         });
        //     }
        // }).on('error', (e) => {
        //     options.error = `Got error: ${e.message}`;
        //     resolve(options);
        // });
    } else {
        throw new Error('Only file, http and https protocols are supported!');
    }

    return resp;
}

export { fetch }