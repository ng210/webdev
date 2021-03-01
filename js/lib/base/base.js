'use strict';

self.DBGLVL = self.DBGLVL || 0;
self.ISWORKER = self.document == undefined;
self.ISNODEAPP = self.jsLib != undefined;

self.extend = function extend(b, e) {
    debug_('EXTEND @' + (b ? b.name :'?') + ' by ' + (e ? e.name : '?'), 1);
    e.prototype = Reflect.construct(b, []);
    e.prototype.constructor = e;
    e.base = b.prototype;
};
self.inherits = function inherits(d, b) {
    var res = false;
    var c = d;
    while (c != Object && c != null) {
        if (c.constructor == b) {
            res = true;
            break;
        }
        c = c.__proto__;
    };
    return res;
};

 //#region AJAX
 self.ajax = {
    ExtToMimeTypeResponseTypeMap: {
        'css':   { mimeType: 'text/css', responseType: 'text', charSet: 'utf-8' },
        'js':    { mimeType: 'text/javascript', responseType: 'text', charSet: 'utf-8' },
        'html':  { mimeType: 'text/html', responseType: 'document', charSet: 'utf-8' },
        'xml':   { mimeType: 'text/xml', responseType: 'document', charSet: 'utf-8' },
        'glsl':  { mimeType: 'x-shader/*', responseType: 'text', charSet: 'utf-8' },
        'gif':   { mimeType: 'image/gif', responseType: 'blob', charSet: 'binary' },
        'bmp':   { mimeType: 'image/bmp', responseType: 'blob', charSet: 'binary' },
        'jpg':   { mimeType: 'image/jpg', responseType: 'blob', charSet: 'binary' },
        'png':   { mimeType: 'image/png', responseType: 'blob', charSet: 'binary' },
        'json':  { mimeType: 'application/json', responseType: 'json', charSet: 'utf-8' },
        'bin':   { mimeType: 'application/octet-stream', responseType: 'arraybuffer', charSet: 'binary' }
    },
    getTypeByExtension: function(url) {
        var m = url.match(/[^\\\/\.]+\.([^.]+)$/);
        var ext = m ? m[1].toLowerCase() : '';
        var type = ajax.ExtToMimeTypeResponseTypeMap[ext] || { mimeType: 'text/plain', responseType: 'text', charSet: 'utf-8'};
        return type;
    },
    createXhr: function(options) {
        // create XHR object
        var xhr = null;
        if (XMLHttpRequest !== undefined) {
            xhr = new XMLHttpRequest();
        } else {
            if (ActiveXObject !== undefined) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            } else {
                throw new Error('Could not create XmlHttpRequest object!');
            }
        }
        // get URL
        var url = new Url(options.url);
        // open XHR connection
        options.resolvedUrl = url.toString();
        xhr.open(options.method.toUpperCase(), options.resolvedUrl, options.async);
        xhr.error = null;
        xhr.options = options;
        // set content and response types
        var type = ajax.getTypeByExtension(options.url);
        options.contentType = options.contentType || type.mimeType;
        options.responseType = options.responseType || type.responseType;
        options.charSet = options.charSet || type.charSet;
        xhr.responseType = options.responseType;
        xhr.setRequestHeader('Content-Type', options.contentType + '; charset=' + options.charSet);
        xhr.overrideMimeType(options.contentType + '; charset=' + options.charSet);
        return xhr;
    },
    onReadyStateChange: function() {
        if (this.readyState == XMLHttpRequest.DONE) {
            this.options.response = this.response;
            if (this.status < 200 || this.status >= 400) {
                // create error object
                var sb = [this.options.url];
                var statusText = this.statusText ? this.statusText : 'Network error';
                sb.push(' - ' + statusText);
                if (this.status) sb.push(`(${this.status})`);
                this.options.error = new Error(sb.join(''));
            }
            this.resolve(this.options);
        }
    },
    /******************************************************************************
    * Send data to server and read response.
    * Options:
    * - url*
    * - data
    * - method
    * - contentType
    * - responseType
    * - charSet
    ******************************************************************************/
    send: function(options) {
        if (options.async === undefined) {
            options.async = true;
        }
        options.method = options.method || 'GET';
        return new Promise(resolve => {
            try {
                var xhr = ajax.createXhr(options);
                xhr.resolve = resolve;
                xhr.onreadystatechange = ajax.onReadyStateChange;
                xhr.send(options.data);
            } catch (err) {
                options.error = err;
                options.response = null;
                resolve(options);
            }
        });
    },
    processContent: async function(options) {
        var data = options.response;
        var res = null;
        switch (options.contentType) {
            // case 'x-shader/*':
            // case 'x-shader/x-vertex':
            // case 'x-shader/x-fragment':
            // case 'text/xml':
            // case 'application/json':
            // case 'text/html':
            // case 'text/css':
            //     this.node = data;
            //     break;
            case 'image/bmp':
            case 'image/gif':
            case 'image/jpg':
            case 'image/png':
                var res = new Image();
                res.src = self.URL.createObjectURL(data);
                await res.decode();
                break;
            default: res = data; break;
        }
        return res;
    }
};
//#endregion

self.debug_ = function debug_(txt, lvl) {
    //if (txt.indexOf('player.') == -1) return;
    if (DBGLVL >= lvl) {
        var err = new Error();
        var lines = err.stack.split('\n');
        console.log(`${txt} (${lines[2].trim()})`);
    }
};

//#region RESOURCE
self.Resource = function Resource(url) {
    this.url = url;    //.normalize();
    //this.resolvedAddress = '';
    this.resolvedUrl = null;
    // loaded data
    this.data = null;
    // created HTML node from the data
    this.node = null;
    // status of the resource
    this.status = Resource.NEW;
    // in case of error the instance of Error
    this.error = null;
}
Resource.load = async function(options) {
    // check resource cache
    var url = new Url(options.url).toString();
    options.url = url;
    var resource = Resource.cache[url];
    if (!resource) {
        // resource not found in cache
        resource = new Resource(url);
        // it will be loaded
        resource.status = Resource.LOADING;
        Resource.cache[url] = resource;
        // load
        debug_('LOAD ' + resource.toString(), 1);
        await ajax.send(options);
        resource.data = options.response;
        if (options.error != null) {
            resource.error = options.error;
            resource.status = Resource.ERROR;
        } else {
            resource.resolvedUrl = new Url(options.resolvedUrl);
            resource.status = Resource.LOADED;
            if (options.process) {
                await resource.processContent(options);
                // update resource
                resource = Resource.cache[url];
            }
        }
    } else {
        if (resource.status != Resource.COMPLETE && resource.status != Module.RESOLVED) {
            return new Promise( async function(resolve, reject) {
                var timeOut = 100;
                poll( function() {
                    if (timeOut > 30000) {
                        resource.status = Resource.ERROR;
                        resource.error = new Error('Time-out reached!');
                        reject(resource);
                        return true;
                    }
                    if (Resource.cache[resource.url].status != Resource.LOADING) {
                        resolve(resource);
                        return true;
                    } else {
                        timeOut *= 1.8;
                        return false;
                    }
                }, timeOut);
            });
        }
    }
    debug_('CACHED ' + resource.toString(), 1);
    //debug_('Cached\n' + Object.values(Resource.cache).map(x=>'-'+x.toString()).join('\n'), 3);
    return resource;
};
Resource.prototype.processContent = async function(options) {
    debug_('PROCESS @' + this.url, 1);
    var data = await ajax.processContent(options);
    switch (options.contentType) {
        case 'text/javascript':
            // create Module from Resource
            var mdl = Module.fromResource(this);
            if (mdl.error == null) {
                Resource.cache[this.url] = mdl;
                debug_('CHANGED ' + mdl.toString(), 2);
                return mdl.resolveIncludes();
            }
            break;
        case 'x-shader/*':
        case 'x-shader/x-vertex':
        case 'x-shader/x-fragment':
            // if (!ISWORKER) {
            //     this.node = document.createElement('script');
            //     this.node.setAttribute('type', options.contentType);
            //     this.node.innerHTML = data;
            //     this.node.url = options.url;
            //     document.head.appendChild(this.node);
            // } else {
            //     this.node = data;
            // }
            // break;
        case 'text/xml':
            this.node = data;
            break;
        case 'application/json':
            this.node = null;
            break;
        case 'text/html':
            this.node = data
            this.node.url = options.url;
            break;
        case 'text/css':
            if (!ISWORKER) {
                this.node = document.createElement('style');
                this.node.innerHTML = data;
                this.node.url = options.url;
                document.head.appendChild(this.node);
            } else {
                this.node = data;
            }
            break;
        case 'image/bmp':
        case 'image/gif':
        case 'image/jpg':
        case 'image/png':
            this.node = data;
            break;
        default: this.node = data; break;
    }
    this.status = Resource.COMPLETE;
};
Resource.prototype.toString = function() {
    return `RES@(${this.url}) - (${this.status})`;
};

Resource.cache = {};

Resource.NEW = 'new';
Resource.LOADING = 'loading';
Resource.LOADED = 'loading';
Resource.COMPLETE = 'complete';
Resource.ERROR = 'error';
Resource.ALIAS = 'alias';

Resource.searchPath = [];
//#endregion

//#region MODULE
self.Module = function Module(url) {
    Resource.call(this, url);
    // array of included modules
    this.includes = {};
    // published symbols
    this.symbols = {};
    Resource.call(this, url);
}
extend(Resource, Module);

Module.prototype.resolveIncludes = async function() {
    debug_('RESOLVE @' + this.url);
    // replace #include '...' and trigger loading of the resource
    //var re = /include\('([^']+)'\)/g;
    var re = /\/\/.*include\('([^']+)'\)|include\('([^']+)'\)/g;
    var loads = [];
    //var mdl = this;
    var currentPath = this.resolvedUrl.toString();
    currentPath = currentPath.substr(0, currentPath.lastIndexOf('/'));
    this.data = this.data.replace(re, (match, p1, p2) => {
        if (p1 != undefined) {
            return `${match} // skipped`;
        }
        if (p2 != undefined) {
            loads.push(include(p2, currentPath));
            return `// ${match} // included`;
        }
        return p2;
    });
    // load every includes
    var includes = await Promise.all(loads);
    debug_('DEPENDS @'+this.toString()+'\n' + includes.map(x=>`-${x.toString()}\n`).join(''), 2);
    debug_('CACHE\n' + Object.values(Resource.cache).map(x=>`-${x.toString()}\n`).join(''), 3);
    this.includes = [];
    for (var i=0; i<includes.length; i++) {
        var im = includes[i];
        if (im.status == Resource.ERROR) {
            this.error = new Error(`Could not load dependency: ${im.url}`);
            this.status = Resource.ERROR;
            return;
        }
        this.includes.push(im.url);
    }
    this.includes = includes.map(x=>x.url);
    // at this point every included module should be loaded and resolved

    this.status = Module.RESOLVED;
    debug_('ADD @' + this.toString() + '\n' + this.includes.map(x=>`-${x}\n`).join(''), 2);

    debug_('ADD INCLUDE ' + this.url, 1);
    if (!ISWORKER) {
        this.node = document.createElement('script');
        this.node.url = this.url;
        this.node.innerHTML = this.data;
        document.head.appendChild(this.node);
    } else {
        var lines = this.data.split('\n');
        for (var i=0; i<lines.length; i++) {
            var match = lines[i].match(/^(\s*publish\s*)\(\s*([^)]+)\s*\)\s*;?.*\r?$/);
            if (match != null) {
                var args = match[2].split(',');
                if (args.length < 3) args.push(' null');
                args.push(` '${this.url.replace(/\\/g, '\\\\')}'`);
                lines[i] = `${match[1]}(${args.join(',')});`;
                debug_('MATCH @:' + this.toString() + '\n' + lines[i], 1);
            }
        }
        this.data = lines.join('\n');
        eval(this.data);
    }
};

Module.prototype.toString = function() {
    return `MDL@(${this.url}) - (${this.status})`;
};

Module.fromResource = function(resource) {
    var mdl = new Module();
    for (var i in resource) {
        if (resource.hasOwnProperty(i)) {
            mdl[i] = resource[i];
        }
    }
    return mdl;
};

Module.RESOLVED = 'resolved';
//#endregion

//#region URL
self.Url = function Url(url) {
    this.hasQuery = false;
    this.schema = '';
    this.user = '';
    this.password = '';
    this.host = '';
    this.port = '';
    this.path = '';
    this.query = {};
    this.fragment = '';
    if (url) {
        if (url instanceof Url) {
            this.hasQuery = url.hasQuery;
            this.schema = url.schema;
            this.user = url.user;
            this.password = url.password;
            this.host = url.host;
            this.port = url.port;
            this.path = url.path;
            this.query = mergeObjects(url.query);
            this.fragment = url.fragment;
        } else if (typeof url === 'string') {
            var pos = this.getSchema(url, 0);
            pos = this.getLogin(url, pos);
            pos = this.getHostAndPort(url, pos);
            pos = this.getPath(url, pos);
            pos = this.getQuery(url, pos);
            pos = this.getFragment(url, pos);
        }
    }
    // ensure a full URL
    if (self.baseUrl) {
        this.schema = this.schema || baseUrl.schema;
        if (this.schema.startsWith('http')) {
            this.host = this.host || baseUrl.host;
            this.port = this.port || baseUrl.port;
            this.user = this.user || baseUrl.user;
            this.password = this.password || baseUrl.password;
        }
    }
};
Url.prototype.getSchema = function getSchema(str, pos) {
    var schemas = [ 'http://', 'https://', 'file://', 'ftp://', 'mailto:' ];
    for (var i=0; i<schemas.length; i++) {
        if (str.indexOf(schemas[i]) == 0) {
            var sch = schemas[i];
            this.schema = sch;
            pos =+ sch.length;
            break;
        }
    }
    return pos;
};
Url.prototype.getLogin = function getLogin(str, pos) {
    var ix = str.indexOf('@', pos);
    if (ix != -1) {
        var tokens = str.substring(pos, ix).split(':');
        this.schema = 'http://';
        this.user = tokens[0];
        this.password = tokens[1];
        pos = ix + 1;
    }
    return pos;
};
Url.prototype.getHostAndPort = function getHost(str, pos) {
    if (this.schema.startsWith('http')) {
        var ix = str.indexOf('/', pos);
        if (ix != -1) {
            var tokens = str.substring(pos, ix).split(':');
            this.host = tokens[0];
            this.port = tokens[1];
            pos = ix + 1;
        } else {
            ix = str.length;
        }
    }
    return pos;
};
Url.prototype.getPath = function getPath(str, pos) {
    var ix = str.indexOf('?', pos);
    if (ix == -1) ix = str.indexOf('#', pos);
    if (ix == -1) ix = str.length;
    var pth = str.substring(pos, ix);
    pos = ix;
    if (pth.charAt(0) == '.' || pth.charAt(0) == '/') {
        // allow path.resolve
        var basePathParts = (pth.charAt(0) == '/' ? baseUrl.path : appUrl.path).split('/');
        var pathParts = pth.split('/');
        for (var i=0; i<pathParts.length; i++) {
            var part = pathParts[i];
            if (part == '' || part == '.') continue;
            else if (part == '..') basePathParts.pop();
            else basePathParts.push(part);
        }
        this.path = basePathParts.join('/');
    } else {
        if (this.schema.startsWith('http')) pth = '/' + pth;
        this.path = pth;
    }
    return pos;
};
Url.prototype.getQuery = function getQuery(str, pos) {
    if (str.charAt(pos) == '?') {
        this.hasQuery = true;
        pos++;
        var ix = str.indexOf('#', pos);
        if (ix == -1) ix = str.length;
        var query = str.substring(pos, ix).split('&');
        for (var i=0; i<query.length; i++) {
            var tokens = query[i].split('=');
            this.query[tokens[0]] = tokens.length > 1 ? tokens[1] : true;
        }
        pos = ix;
    }
    return pos;
};
Url.prototype.getFragment = function getFragment(str, pos) {
    if (str.charAt(pos) == '#') {
        this.fragment = str.substring(pos+1);
        pos += this.fragment.length;
    }
    return pos;
};
Url.prototype.toString = function toString() {
    var sb = [this.schema];
    if (this.user) sb.push(this.user);
    if (this.password) sb.push(':', this.password);
    if (sb.length > 1) sb.push('@')
    if (this.host) sb.push(this.host);
    if (this.port) sb.push(':', this.port);
    if (this.path) sb.push(this.path);
    if (this.hasQuery) {
        var query = [];
        for (var key in this.query) {
            var term = key;
            if (this.query[key] !== true) term += `=${this.query[key]}`;
            query.push(term);
        }
        sb.push('?', query.join('&'));
    }
    if (this.fragment) sb.push('#', this.fragment);
    return sb.join('');
};
Url.relative = function toString(base, target) {
    if (base instanceof Url) base = base.toString();
    if (target instanceof Url) target = target.toString();
    return target.startsWith(base) ? target.substring(base.length) : '';
};
self.baseUrl = (function() {
    // http://<host>/<path>/lib/base/base.js
    var address = !ISWORKER ? document.currentScript.src : self.location ? self.location.href : '';
    var tokens = address.split('/');
    tokens.pop(); // base.js
    tokens.pop(); // base
    Resource.searchPath.push(tokens.join('/'));
    tokens.pop(); // lib
    return new Url(tokens.join('/'));
})();
self.appUrl = (function(){
    var url = !ISWORKER ? document.URL : self.location ? self.location.href : '';
    var address = url.split('#')[0];
    var pos = address.lastIndexOf('/');
    if (pos == -1) pos == undefined;
    url = url.substring(0, pos);
    return new Url(url);
})();
//#endregion

//#region LOAD, INCLUDE, PUBLISH
/******************************************************************************
 * Examples
 *  - load('config.xml');
 *  - load(['user.xml', 'config.xml', 'web.xml']);
 *  - load({ url: 'config.xml', contentType: 'xml' });
 *  - load([ { url: 'user.html', contentType: 'html', method: 'get' },
 *              { url: 'app.cfg', contentType: 'xml', method: 'post' } ]);
 ******************************************************************************/
self.load = function load(obj) {
    if (!Array.isArray(obj)) {
        var options = { error: null };
        if (typeof obj === 'string') {
            options.url = obj;
        } else {
            for (var i in obj) {
                options[i] = obj[i];
            }
        }
        if (options.process === undefined) {
            options.process = true;
        }
        return Resource.load(options);
    } else {
        var loads = [];
        for (var i=0; i<obj.length; i++) {
            var item = obj[i];
            var options = typeof item === 'string' ? { url: item } : item;
            // process response by default
            if (options.process === undefined) {
                options.process = true;
            }
            loads.push(Resource.load(options));
        }
        return Promise.all(loads);
    }
};
// self.inherits = function inherits(d, b) {
//     var res = false;
//     var c = d;
//     while (c != Object && c != null) {
//         if (c.constructor == b) {
//             res = true;
//             break;
//         }
//         c = c.__proto__;
//     };
//     return res;
// };
self.publish = function publish(obj, name, context, url) {
    if (!ISWORKER) {
        var script = document.currentScript;
        url = script.src || script.url;
    }
    var mdl = Resource.cache[url];
    if (mdl === undefined) {
        throw new Error('Module \'' + url + '\' not found!');
    }
    context = context || self;
    mdl.symbols[name] = obj;
    context[name] = obj;
};
self.include = async function include(path, parentPath) {
    debug_('INCLUDE @' + path, 1);
    parentPath = parentPath || appUrl.toString();
    var mdl = null;
    var searchPath = null;
    if (path.startsWith('/')) {
        searchPath = [self.baseUrl];
        path = path.substr(1);
    } else {
        searchPath = [parentPath, self.baseUrl.toString()];
        searchPath.push(...Resource.searchPath);
    }
    var attempts = [];
    for (var i=0; i<searchPath.length; i++) {
        var url = searchPath[i] + '/' + path;
        mdl = await load(url);
        if (!mdl.error) {
            for (var j=0; j<attempts.length; j++) {
                attempts[j].status = Resource.ALIAS;
                attempts[j].alias = mdl;
            }
            break;
        } else {
            attempts.push(mdl);
        }
    }
    debug_('INCLUDED @' + mdl.toString()), 2;
    return mdl;
};
self.addToSearchPath = function addToSearchPath(url) {
    if (url === undefined) {
        url = !ISWORKER ? document.currentScript.src || document.currentScript.url : self.location.href;
        url = url.substring(0, url.lastIndexOf('/'));
    }
    Resource.searchPath.push(url);
};
//#endregion

Array.prototype.binSearch = function binSearch(item, cmp, min, max) {
    if (this.length == 0) {
        return 0;
    }
	if (min == undefined) min = 0;
    if (max == undefined) max = this.length;
    var obj = this;
    if (cmp == undefined) {
        cmp = typeof item.compare === 'function' ? item.compare : (a, b) => a - b;
    } else if (typeof cmp === 'object') {
        obj = cmp.context;
        cmp = cmp.method;
    }
	while (min < max) {
		var mid = (min + max)>>1;
        var i = this[mid] != undefined ? cmp.call(obj, item, this[mid]) : -1;
		if (i == 0) return mid;
		if (i < 0) { // continue with the first half-range: [min, mid]
			max = mid;
		} else { // continue with the second half-range: [mid+1, max]
			min = mid + 1;
		}
	}
	return -max-1;
};
Array.prototype.select = function select(filter) {
    var res = [];
    for (var i=0; i<this.length; i++) {
        if (filter(this[i], i, this)) {
            res.push(this[i]);
        }
    }
    return res;
};

//#region UTILITIES: POLL,LOCK,MERGEOBJECTS,OBJECT-PATH
self.poll = function poll(action, timeout) {
    async function poll_(action, timeout, resolve, args) {
        clearTimeout(action.timer);
        var result = await action(...args);
        if (result) resolve(result);
        else action.timer = setTimeout(poll_, timeout, action, timeout, resolve, args);
    }

    var args_ = [];
    for (var i=2; i<arguments.length; i++) {
        args_.push(arguments [i]);
    }
    return new Promise( resolve => {
        poll_(action, timeout || 100, resolve, args_);
    });
};
self.locks__ = {};
self.lock = function lock(token, action) {
    if (locks__[token] == undefined) {
        locks__[token] = [0, 0];
    }
    return new Promise( resolve => {
        poll( function() {
            var request = locks__[token][0];
            if (request == locks__[token][1]) {
                locks__[token][0]++;
                if (locks__[token][0] == request + 1) {
                    debug_('locked: ' + locks__[token], 4);
                    return true;
                }
            }
            return false;
        }).then(async function() {
            await action();
            locks__[token][1] = locks__[token][0];
            resolve();
            debug_('unlocked: ' + locks__[token], 4);
        });
    });
};
self.mergeObjects = function mergeObjects(src, dst, sourceOnly) {
    var res = {};
    if (src == undefined || src == null) {
        src = {};
    }
    var isArraySource = Array.isArray(src);
    var isArrayDestination = Array.isArray(dst);
    if (isArraySource && isArrayDestination) {
        res = [];
        for (var i=0; i<src.length; i++) res[i] = mergeObjects(src[i], dst[i]);
        for (var i=src.length; i<dst.length; i++) res[i] = mergeObjects(dst[i]);
    } else if (isArraySource && !isArrayDestination) {
        if (dst == undefined) {
            res = [];
            for (var i=0; i<src.length; i++) res[i] = mergeObjects(src[i]);
        } else {
            res = mergeObjects(dst);
        }
    } else if (!isArraySource && isArrayDestination) {
        res = mergeObjects(d);
    } else {
        var isObjectSource = src != null && typeof src === 'object';
        var isObjectDestination = dst != null && typeof dst === 'object';
        if (!isObjectSource && !isObjectDestination) {
            res = dst != undefined ? dst : src;
        } else {
            var srcKeys = Object.keys(src);
            if (dst == undefined || dst == null) {
                dst = {};
            }
            var dstKeys = Object.keys(dst);
            // add src
            for (var i=0; i<srcKeys.length; i++) {
                var key = srcKeys[i];
                var s = src[key];
                var d = dst[key];
                if (d != undefined) {
                    var ix = dstKeys.findIndex(x => x == key);
                    dstKeys.splice(ix, 1);
                }
                isObjectSource = s != null && typeof s === 'object';
                isObjectDestination = d != null && typeof d === 'object';
                if (isObjectSource && isObjectDestination) {
                    res[key] = mergeObjects(s, d);
                } else if (isObjectSource && !isObjectDestination) {
                    res[key] = d != undefined ? d : mergeObjects(s, null);
                } else if (!isObjectSource && isObjectDestination) {
                    res[key] = mergeObjects(d, null);
                } else {
                    res[key] = d != undefined ? d : s;
                }
            }
            if (!sourceOnly) {
                // add dst
                for (var i=0; i<dstKeys.length; i++) {
                    var key = dstKeys[i];
                    var d = dst[key];
                    if (typeof d === 'object') {
                        res[key] = mergeObjects(d, null);
                    } else {
                        res[key] = d;
                    }
                }
            }
        }
    }
    return res;
};
self.getCommonParent = function getCommonParent(obj1, obj2, parentAttributeName) {
    var p1 = obj1;
    var p2 = obj2;
    var path1 = [];
    var res = null;
    while (p1 != null) {
        path1.push(p1);
        p1 = p1[parentAttributeName];
    }
    while (p2 != null) {
        if (path1.includes(p2)) {
            res = p2;
            break;
        }
        p2 = p2[parentAttributeName];
    }
    return res;
};
self.getObjectPath = function getObjectPath(obj, parentAttributeName, ancestor) {
    var res = [];
    ancestor = ancestor || self;
    while (obj != null) {
        res.unshift(obj);
        if (obj == ancestor) break;
        obj = obj[parentAttributeName];
    }
    return res;
};
self.getObjectAt = function getObjectAt(path, obj) {
    obj = obj || self;
    var tokens = path.split('.');
    for (var i=0; i<tokens.length; i++) {
        obj = obj[tokens[i]];
        if (typeof obj !== 'object' && typeof obj !== 'function' || obj == null) {
            if (i != tokens.length-1) obj = null;
            break;
        }
    }
    return obj;
};
//#endregion

if (!ISWORKER || ISNODEAPP) {
// APPLICATION
self.onload = e => poll(async function() {
    var errors = [];
    for (var i in Resource.cache) {
        var res = Resource.cache[i];
        if (res.status == Resource.ERROR) {
            errors.push(res.error);
        } else if (res.status != Resource.COMPLETE && res.status != Resource.ERROR && res.status != Module.RESOLVED && res.status != Resource.ALIAS) {
            return false;
        }
    }
    debug_('onload - resource loading complete');
    if (!ISNODEAPP) onpageload(errors);
    return true;
});

} else {

// WORKER
self.onmessage = async function(e) {
    var msg = e.data;
    var body = msg.body;
    switch (msg.code) {
        case 'startup':
            if (body.root) {
                rootUrl = new Url(body.root);
            }
            if (body.path) {
                Resource.searchPath.push(...body.path);
            }
            var res = await load(body.module);
            if (res.error instanceof Error) {
                console.log('Sending kill signal');
                self.postMessage({'code':'kill', 'id':msg.id, 'body':res.error.message});
            } else {
                if (typeof res.symbols.main !== 'function') {
                    self.postMessage({'code':'kill', 'id':msg.id, 'body':`Entry point static function 'main' missing!`});
                }
            }
            break;
    }
    var resp = await main(msg);
    if (resp != undefined) {
        self.postMessage({code:'startup', id:msg.id, body:resp});
    }
};
//console.log(ISWORKER);
}