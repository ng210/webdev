import { Path } from './path.mjs';
import { Url } from './url.mjs';
//import { Module } from './module.js';

if (typeof self === 'undefined') {
    var mod = await import('./fetch-nodejs.mjs');
    globalThis.fetch = mod.fetch;
}

export const IO = {
    Modules: {},

    ExtToMimeTypeResponseTypeMap: {
        '.css':   { streamType:'text', mimeType: 'text/css', responseType: 'text', charSet: 'utf-8' },
        '.js':    { streamType:'text', mimeType: 'text/javascript', responseType: 'text', charSet: 'utf-8' },
        '.mjs':   { streamType:'text', mimeType: 'text/javascript', responseType: 'text', charSet: 'utf-8' },
        '.html':  { streamType:'text', mimeType: 'text/html', responseType: 'document', charSet: 'utf-8' },
        '.xml':   { streamType:'text', mimeType: 'text/xml', responseType: 'document', charSet: 'utf-8' },
        '.glsl':  { streamType:'text', mimeType: 'x-shader/*', responseType: 'text', charSet: 'utf-8' },
        '.gif':   { streamType:'blob', mimeType: 'image/gif', responseType: 'blob', charSet: 'binary' },
        '.bmp':   { streamType:'blob', mimeType: 'image/bmp', responseType: 'blob', charSet: 'binary' },
        '.jpg':   { streamType:'blob', mimeType: 'image/jpg', responseType: 'blob', charSet: 'binary' },
        '.png':   { streamType:'blob', mimeType: 'image/png', responseType: 'blob', charSet: 'binary' },
        '.json':  { streamType:'json', mimeType: 'application/json', responseType: 'json', charSet: 'utf-8' },
        '.bin':   { streamType:'blob', mimeType: 'application/octet-stream', responseType: 'arraybuffer', charSet: 'binary' }
    },
    getTypeByExtension: function getTypeByExtension(url) {
        var ext = Path.extname(url).toLowerCase();
        var type = this.ExtToMimeTypeResponseTypeMap[ext] || { mimeType: 'text/plain', responseType: 'text', charSet: 'utf-8'};
        return type;
    },

    load: async function load(obj, currentPath) {
        // obj can be an url or an object with properties:
        // body, cache, credentials, headers, integrity, keepalive, method, mode, priority, redirect, referrer, referrerPolicy, signal, url
        var basePath = !Url.Base.pathname.startsWith('/') ? Url.Base.pathname : Url.Base.pathname.substring(1);
        if (currentPath) {
            currentPath = Path.resolve(basePath, currentPath);
        } else {
            currentPath = basePath;
        }
        
        var options = {
            'body': null,
            // A string indicating how the request will interact with the browser's HTTP cache.
            // The possible values, default, no-store, reload, no-cache, force-cache, and only-if-cached.
            'cache': 'default',
            // Controls what browsers do with credentials (cookies, HTTP authentication entries, and TLS client certificates).
            // Must be one of the following strings:
            // - omit: Tells browsers to exclude credentials from the request, and ignore any credentials sent back in the response (e.g., any Set-Cookie header).
            // - same-origin: Tells browsers to include credentials with requests to same-origin URLs, and use any credentials sent back in responses from same-origin URLs. This is the default value.
            // - include: Tells browsers to include credentials in both same- and cross-origin requests, and always use any credentials sent back in responses.
            // Note: Credentials may be included in simple and "final" cross-origin requests, but should not be included in CORS preflight requests.
            'credentials': 'omit',
            // Any headers you want to add to your request, contained within a Headers object or an object literal with String values. Note that some names are forbidden.
            // Note: The Authorization HTTP header may be added to a request, but will be removed if the request is redirected cross-origin.
            'headers': {},            
            // Contains the subresource integrity value of the request (e.g., sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=).
            'integrity': '',
            // The keepalive option can be used to allow the request to outlive the page. Fetch with the keepalive flag is a replacement for the Navigator.sendBeacon() API.
            'keepalive': false,
            // The request method, e.g., "GET", "POST". The default is "GET".
            // Note that the Origin header is not set on Fetch requests with a method of HEAD or GET.
            // Any string which is a case-insensitive match for one of the methods in RFC 9110 will be uppercased automatically. If you want to use a custom method (like PATCH), you should uppercase it yourself.
            'method': 'GET',
            // The mode you want to use for the request, e.g., cors, no-cors, or same-origin.
            'mode': 'same-origin',            
            //Specifies the priority of the fetch request relative to other requests of the same type. Must be one of the following strings:
            // - high: a high priority fetch request relative to other requests of the same type.
            // - low: a low priority fetch request relative to other requests of the same type.
            // - auto: automatically determine the priority of the fetch request relative to other requests of the same type (default).
            'priority': 'auto',
            // How to handle a redirect response:
            // - follow: automatically follow redirects. Unless otherwise stated the redirect mode is set to follow.
            // - error: abort with an error if a redirect occurs.
            // - manual: caller intends to process the response in another context. See WHATWG fetch standard for more information.
            'redirect': 'follow',
            // A string specifying the referrer of the request. This can be a same-origin URL, about:client, or an empty string.
            'referrer': '',
            // Specifies the referrer policy to use for the request.
            // May be one of no-referrer, no-referrer-when-downgrade, same-origin, origin, strict-origin, origin-when-cross-origin, strict-origin-when-cross-origin, or unsafe-url.
            'referrerPolicy': 'same-origin',
            'signal': null
            // An AbortSignal object instance; allows you to communicate with a fetch request and abort it if desired via an AbortController.
        };
        var srcUrl = '';
        if (typeof obj === 'string') {
            srcUrl = obj;
        } else {
            srcUrl = obj.url;
            for (var ki in options) {
                if (obj[ki] !== undefined) options[ki] = obj[ki];
            }
        }

        if (srcUrl.match(/^[^:]+:\/\//)) {
            options.url = new Url(srcUrl);
        } else {
            options.url = new Url(Path.resolve(currentPath, srcUrl));
        }
        
        // get resource type
        var contentType = obj.contentType;
        if (contentType) {
            for (var mi in this.ExtToMimeTypeResponseTypeMap) {
                if (this.ExtToMimeTypeResponseTypeMap[mi].mimeType == contentType) {
                    options.type = this.ExtToMimeTypeResponseTypeMap[mi];
                    break;
                }
            }
        }
        if (!options.type) options.type = this.getTypeByExtension(srcUrl);
        if (!contentType) contentType = options.type.mimeType;
        //var responseType = obj.responseType || options.type.responseType;
        var charSet = obj.charSet || options.type.charSet;

        if (contentType == 'text/javascript') {
            var mdl = await import(options.url);
            var name = Object.getOwnPropertyNames(mdl)[0];
            data = mdl[name];
        } else {
            if (options.body && contentType == 'application/json') {
                options.body = JSON.stringify(options.body);
            }
            options.headers['content-type'] = `${contentType}; charset=${charSet}`;
            var resp = await fetch(options.url.toString(), options);

            options.data = null;
            if (!resp.bodyUsed && resp.body != null) {
                switch (options.type.streamType) {
                    case 'blob': options.data = await resp.blob(); break;
                    case 'json': options.data = await resp.json(); break;
                    default:     options.data = await resp.text(); break;
                }
            }

            var data = resp.ok ? await this.processContent(options) : new Error(data || `${resp.statusText} (${resp.status})`);
        }
        return data;
    },

    processContent: async function(options) {
        var res = null;
        switch (options.type.mimeType) {
            // case 'x-shader/*':
            // case 'x-shader/x-vertex':
            // case 'x-shader/x-fragment':
            // case 'text/xml':
            // case 'application/json':
            case 'text/html':
                if (typeof window !== 'undefined') {
                    res = new DocumentFragment();
                    var body = document.createElement('BODY');
                    body.innerHTML = options.data;
                    res.append(body);
                }
                break;
            // case 'text/css':
            //     this.node = data;
            //     break;
            case 'image/bmp':
            case 'image/gif':
            case 'image/jpg':
            case 'image/png':
                if (typeof window !== 'undefined') {
                    res = new Image();
                    res.src = self.URL.createObjectURL(options.data);
                    await res.decode();
                }
                break;
            case 'text/javascript':
                if (typeof window !== 'undefined') {
                    res = document.createElement('SCRIPT');
                    res.setAttribute('type', 'module');
                    res.innerHTML = options.data;
                    res.src = options.url.toString();
                }
                // var mod = this.Modules[options.url];
                // if (!mod) {
                //     mod = this.Modules[options.url] = new Module(options);
                //     await mod.resolveIncludes();
                // }
                // res = mod.node;
                break;
        }
        return res || options.data;
    },

//     resolveIncludes: async function(options) {
//         var includes = [];
//         var re = /include\('(?<src>[^']+)'\)|include\("(?<src>[^"]+)"\)/g;
//         var m = null;
//         while (true) {
//             m = re.exec(options.data);
//             if (!m) break;
//             var src = Path.resolve(m.groups.src, Path.dirname(options.url.path));
//             if (includes.indexOf(src) == -1) {
//                 includes.push(src);
//             }
//         }
// console.log(includes);
//     },

    // include: async function include(url) {
    //     if (self.Module === undefined) console.error('Module not defined!');
    //     else {
    //         if (!ISWORKER) {
    //             var script = document.currentScript;
    //             url = Path.resolve(url, script.src || script.url);
    //         }
    //         console.log(`Module requested ${url}`)
    //         if (this.Modules[url] === undefined) console.error('Requested module not loaded!')
    //     }
    // }
};

//self.include = this.include;

// self.load = function load(obj, currentPath) {
//     if (!Array.isArray(obj)) {
//         var options = { error: null, currentPath: currentPath || self.appUrl.path };
//         if (typeof obj === 'string') {
//             options.url = obj;
//         } else {
//             for (var i in obj) {
//                 options[i] = obj[i];
//             }
//         }
//         if (options.process === undefined) {
//             options.process = true;
//         }
//         return Resource.load(options);
//     } else {
//         var loads = [];
//         for (var i=0; i<obj.length; i++) {
//             var item = obj[i];
//             var options = typeof item === 'string' ? { url: item } : item;
//             if (options.currentPath == undefined) options.currentPath = currentPath || self.appUrl.path;
//             // process response by default
//             if (options.process === undefined) {
//                 options.process = true;
//             }
//             loads.push(Resource.load(options));
//         }
//         return Promise.all(loads);
//     }
// };
// // self.inherits = function inherits(d, b) {
// //     var res = false;
// //     var c = d;
// //     while (c != Object && c != null) {
// //         if (c.constructor == b) {
// //             res = true;
// //             break;
// //         }
// //         c = c.__proto__;
// //     };
// //     return res;
// // };
// self.publish = function publish(obj, name, context, url) {
//     if (typeof name !== 'string') throw new Error(`Second argument has to be a string! (${name})`);

//     if (!ISWORKER) {
//         var script = document.currentScript;
//         url = script.src || script.url;
//     }
//     var mdl = Resource.cache[url];
//     if (mdl === undefined) throw new Error('Module \'' + url + '\' not found!');
    
//     context = context || self;
//     mdl.symbols[name] = obj;
//     context[name] = obj;
// };
// self.include = async function include(path, currentPath) {
//     debug_('INCLUDE @' + path, 3);
//     currentPath = currentPath || appUrl.path;

//     var mdl = null;
//     if (!path.startsWith('.') && !path.startsWith('/')) {
//         var searchPath = [currentPath, self.appUrl.path, self.baseUrl.path];
//         searchPath.push(...Resource.searchPath)
//         var attempts = [];
//         for (var i=0; i<searchPath.length; i++) {
//             mdl = await load(path, currentPath);
//             if (!mdl.error) {
//                 for (var j=0; j<attempts.length; j++) {
//                     attempts[j].status = Resource.ALIAS;
//                     attempts[j].alias = mdl;
//                 }
//                 break;
//             } else {
//                 attempts.push(mdl);
//             }
//         }
//     } else {
//         mdl = await load(path, currentPath);
//     }
//     debug_('INCLUDED @' + mdl.toString(), 2);
//     return mdl;
// };
// self.addToSearchPath = function addToSearchPath(url) {
//     if (url === undefined) {
//         url = !ISWORKER ? document.currentScript.src || document.currentScript.url : self.location.href;
//         url = url.substring(0, url.lastIndexOf('/'));
//     }
//     Resource.searchPath.push(url);
// };
// self.save = function save(data, fileName) {
//     if (typeof data === 'string') {
//         var buffer = new Uint16Array(data.length);
//         for (var i=0; i<data.length; i++) buffer[i] = data.charCodeAt(i);
//         data = new Blob([buffer], {'type': 'text/plain'});
//     }
//     var url = window.URL.createObjectURL(data);
//     var link = document.createElement('a');
//     link.style.display = 'none';
//     document.body.appendChild(link);
//     link.setAttribute('download', fileName);
//     link.href = url;
//     link.click();
//     window.URL.revokeObjectURL(url);
//     document.body.removeChild(link);
//     link = undefined;
// };