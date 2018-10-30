try {


// MODULE *********************************************************************
Object.defineProperties(window, {
    '_modules': {
        writeable: false,
        enumerable: false,
        value: {}
    },
    '_searchPath': {
        writeable: false,
        enumerable: false,
        value: []
    },
    'include': {
        writeable: false,
        enumerable: false,
        value: (path) => {
            var url = new Url(path);
            var urlText = url.toString();
            var key = Object.keys(_modules).find( v => v.split('#')[0] == urlText );
            if (key == undefined) {
                var res = load(urlText);
                if (res instanceof Error) {
                    if (!path.startsWith('/')) {
                        // try to load from search path directories
                        for (var i=0; i<_searchPath.length; i++) {
                            var p = _searchPath[i] + '/' + path;
                            url.path = p;
                            urlText = url.toString();
                            res = load(urlText);
                            if (!(res instanceof Error)) break;
                        }
                    }
                    if (res instanceof Error) throw new Error('Could not load "'+path+'"!');
                } 
                
            }
        }
    },
    'public': {
        writeable: false,
        enumerable: false,
        value: (obj, name) => {
            var script = document.currentScript
            var url = (script.src || script.url) + '#' + name;
            window[name] = _modules[url] = obj;
        }
    },
    'ajax': {
        writeable: false,
        enumerable: false,
        value: {
            xmlHttpStateChange: function(xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status != 404 && xhr.responseText) {
                        var data = xhr.responseText || xhr.responseBody;
                        if (xhr.options.async) {
                            var onload = xhr.options.onload;
                            if (typeof onload === 'function') {
                                onload(data, xhr);
                            }
                        } else {
                            xhr.options.responseData = data;
                        }
                    } else {
                    	var error = new Error(xhr.options.url + ' - ' + xhr.statusText + ' (' + xhr.status + ')');
                        if (typeof xhr.options.onerror === 'function') {
                            xhr.options.onerror(error, xhr);
                        } else {
                        	xhr.options.responseData = error;
                        }
                    }
                } else {
                    var error = new Error(xhr.options.url + ' - ' + xhr.statusText + ' (' + xhr.status + ')');
                    if (typeof xhr.options.onerror === 'function') {
                        xhr.options.onerror(error, xhr);
                    } else {
                        xhr.options.responseData = error;
                    }
                }
            },
            createXhr: function(options) {
                var xhr = null;
                if (window.XMLHttpRequest !== undefined) {
                    xhr = new XMLHttpRequest();
                } else {
                    if (window.ActiveXObject !== undefined) {
                        xhr = new ActiveXObject("Microsoft.XMLHTTP");
                    } else {
                        throw new Error('Could not create XmlHttpRequest object!');
                    }
                }
                var url = new Url(options.url);
                xhr.open(options.method.toUpperCase(), url.toString(), options.async);
                xhr.error = null;
                xhr.options = options;
                if (options.async) {
                    xhr.onreadystatechange = function() {
                        return ajax.xmlHttpStateChange(xhr);
                    };
                }
                return xhr;
            },
            setContentType: function(xhr, type) {
                // TODO: handle content types
                // switch (type) {
                //     case 'json':
                //         xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
                //         xhr.overrideMimeType('application/json; charset=utf-8');
                //         break;
                //     default:
                //     case 'bin':
                        xhr.setRequestHeader('Content-Type', 'text/plain; charset=x-user-defined');
                        xhr.overrideMimeType('text/plain; charset=x-user-defined');
                //         break;
                // }
            },
            /******************************************************************************
            * Send data to server and read response.
            * Options:
            * - url
            * - data
            * - method
            * - onload
            * - onerror
            * (contentType, responseType)
            ******************************************************************************/
            send: function(options) {
                var res = null;
                var defaultOptions = {
                    data: '',
                    method: 'GET',
                    contentType: 'json',
                    responseType: 'json'
                };
                for (var k in defaultOptions) {
                    if (options[k] === undefined)
                        options[k] = defaultOptions[k];
                }
                options.async = typeof options.onload === 'function';
                var xhr = ajax.createXhr(options);
                ajax.setContentType(xhr, options.contentType);
                try {
                    xhr.send(options.data);

                    if (options.async) {
                        res = xhr;
                    } else {
                        xhr.options.onload = [];
                        ajax.xmlHttpStateChange(xhr);
                        res = xhr.options.responseData;
                    }
   
                } catch (err) {
                    xhr.error = err;
                    if (typeof options.onerror === 'function') {
                        options.onerror(err, xhr);
                    } else {
                        res = err;
                    }
                }
                return res;
            }
        }
    },
    'load': {
        writeable: false,
        enumerable: false,
        value: (function() {
            var load = function(obj, onload, onerror) {
                var res = null;
                if (!Array.isArray(obj)) {
                    res = load.load_(obj, null, -1, onload, onerror);
                } else {
                    res = [];
                    context = {
                        counter: obj.length,
                        onload: onload,
                        onerror: onerror,
                        error: false,
                        result: []
                    };
                    for (var i=0; i<obj.length; i++) {
                        res[i] = load.load_(obj[i], context, i, onload, onerror);
                    }
                }
                return res;
            };
            //  load('config.xml');
            //  load(['user.xml', 'config.xml', 'web.xml']);
            //  load('config.xml', onload, onerror);
            //  load(['user.xml', 'config.xml', 'web.xml'], onload, onerror);
            //  load({ url: 'config.xml', contentType: 'xml' });
            //  load([{ url: 'user.html', contentType: 'html', method: 'get' }, { url: 'app.cfg', contentType: 'xml', method: 'post' });
            //  load({ url: 'config.xml', contentType: 'xml' }, onload, onerror);
            //  load([{ url: 'user.html', contentType: 'html', method: 'get' }, { url: 'app.cfg', contentType: 'xml', method: 'post' }, onload, onerror);
            load.load_ = function(item, context, ix, onload, onerror) {
                var res = null;
                var options = null;
                if (typeof item === 'string') {
                    options = { url: item, onload:onload, onerror:onerror };
                } else {
                    options = item;
                }
                if (context && typeof context.onload === 'function') {
                    options.onload = load.onload_;
                    options.onerror = load.onerror_;
                }
                for (k in load.requiredOptions_) {
                    if (options[k] === undefined) {
                        options[k] = load.requiredOptions_[k];
                    }
                }

                options.url = new Url(options.url).toString();


                options.context = context;
                options.index = ix;
                res = ajax.send(options);
                if (!(res instanceof Error) && typeof options.onload !== 'function') {
                    res = load.processContent(res, options);
                }
                return res;
            };
            load.requiredOptions_ = {
                url: '',
                data: '',
                method: 'GET',
                contentType: 'auto'
            };
            load.processContent = function(data, options) {
                var contentType = options.contentType;
                if (contentType == 'auto') {
                    // get content type by extension
                    var m = options.url.match(/[^\\\/\.]+\.([^.]+)$/);
                    var ext = m ? m[1] : '';
                    switch (ext) {
                        case 'css': contentType = 'text/css'; break;
                        case 'js': contentType = 'text/javascript'; break;
                        case 'html': contentType = 'text/html'; break;
                        case 'xml': contentType = 'text/xml'; break;
                        case 'glsl': contentType = 'x-shader/*'; break;
                        default: contentType = 'text/plain'; break;
                    }
                }
                var res = null;
                var isNode = false;
                switch (contentType) {
                    case 'text/javascript':
                        isNode = true;
                        res = document.createElement('script');
                        res.innerHTML = data;
                        res.url = options.url;
                        document.head.appendChild(res);
                        //res.src = options.url;
                        break;
                    case 'x-shader/*':
                    case 'x-shader/x-vertex':
                    case 'x-shader/x-fragment':
                        res = document.createElement('script');
                        res.setAttribute('type', contentType);
                        res.innerHTML = data;
                        res.url = options.url;
                        document.head.appendChild(res);
                        break;
                    case 'text/xml':
                        var el = document.createElement('div');
                        el.innerHTML = data;
                        res = parseElement(el);
                        break;
                    case 'text/json':
                        res = JSON.parse(data);
                        break;
                    case 'text/html':
                        res = document.createElement('div');
                        res.innerHTML = data;
                        res.url = options.url;
                        break;
                    case 'text':
                    default: res = data; break;
                }
                return res;
            };    
            load.onload_ = function(data, xhr) {
                var context = xhr.options.context;
                context.result[xhr.options.index] = load.processContent(data, xhr.options);
                context.counter--;
                if (context.counter == 0) {
                    if (!context.error || typeof context.onerror !== 'function') {
                        context.onload(context.result)
                    } else {
                        context.onerror(context.result);
                    }
                }
            };
            load.onerror_ = function(error, xhr) {
                var context = xhr.options.context;
                context.result[xhr.options.index] = error;
                context.error = true;
                context.counter--;
                if (context.counter == 0) {
                    if (typeof context.onerror === 'function') {
                        context.onerror(context.result);
                    } else {
                        context.onload(context.result);
                    }
                }
            };
            load.normalizePath = function(path, base) {
                var base = base || baseUrl.path;
                var pathParts = base.split('/');
                if (pathParts[pathParts.length-1].length == 0) pathParts.pop();
                var arr = path.split('/');
                for (var i=0; i<arr.length; i++) {
                    var part = arr[i];
                    if (part == '' && i == 0) {
                        pathParts = [''];
                        continue;
                    }
                    if (part == '.') continue;
                    if (part == '..') {
                        if (pathParts.length > 1) pathParts.pop();
                        else throw new Error('Invalid path!');
                    } else pathParts.push(part);
                }
                return pathParts.join('/');
            };
            return load;
        })()
    },
    'Url': {
        writeable: false,
        enumerable: false,
        value: (function(){
			var ctor = function(url) {
	            this.schema = '';
	            this.user = '';
	            this.password = '';
	            this.host = '';
	            this.port = '';
	            this.path = '';
	            this.query = {};
                this.fragment = '';
                if (window.baseUrl != undefined) {
                    this.schema = baseUrl.schema;
                    this.user = baseUrl.user;
                    this.password = baseUrl.password;
                    this.host = baseUrl.host;
                    this.port = baseUrl.port;
                    this.path = baseUrl.path;
                    Object.keys(baseUrl.query).forEach(k=>this.query[k]=baseUrl[k]);
                    this.fragment = baseUrl.fragment;
                }
                this.parse(url);
			};
			ctor.prototype.parse = function(url) {
                // 1. full schema: https://max:muster@www.example.com:8080/directory/index.html?p1=A&p2=B#ressource
                // 2. path: /directory/file /(. and .. are supported)
                // check schema
                var position = -1;
                var normalizePath = false;
                var schemas = [ 'http://', 'https://', 'file://', 'ftp://', 'mailto:' ];
                for (var i=0; i<schemas.length; i++) {
                    // case #1: full schema expected
                    var schema = schemas[i];
                    if (url.indexOf(schema) == 0) {
                        // set position after the schema
                        this.schema = schema;
                        position = schema.length;
                        url = url.substring(position);
                        break;
                    }
                }
                if (position != -1) {
                    // check user and password
                    if (url.indexOf('@') != -1) {
                        var tokens = url.split('@');
                        url = tokens[1];
                        tokens = tokens[0].split(':');
                        this.user = tokens[0];
                        this.password = tokens[1] || '';
                    }
                    // check host
                    position = url.indexOf('/');
                    if (position == -1) position = url.length;
                    this.host = url.substring(0, position);
                    var tokens = this.host.split(':');
                    if (tokens.length > 1) {
                        this.host = tokens[0];
                        if (tokens[1] != '') {
                            this.port = parseInt(tokens[1]);
                            if (isNaN(this.port)) throw 'Invalid port number!';
                        }
                    }
                } else {
                    // case #2: direct path expected
                    position = 0;
                    normalizePath = true;
                }
                if (position != -1) {
                    url = url.substring(position);
                    // check path
                    // path ends with '?', '#', or EOS
                    position = url.indexOf('?');
                    if (position == -1) position = url.indexOf('#');
                    if (position == -1) position = url.length;
                    this.path = url.substring(0, position);
                    if (normalizePath) this.path = load.normalizePath(this.path);
                    url = url.substring(position);
                    // check query
                    if ((position = url.indexOf('?')) != -1) {
                        var tokens = url.split('?');
                        this.path = tokens[0];
                        tokens = tokens[1].split('&');
                        for (var i=0; i<tokens.length; i++) {
                            var keyValue = tokens[i].split('=');
                            this.query[keyValue[0]] = keyValue[1];
                        }
                    }
                    url = url.substring(position);
                    // check fragment
                    if ((position = url.indexOf('#')) != -1) {
                        var tokens = url.split('#');
                        url = tokens[0];
                        this.fragment = tokens[1];
                    }
                } else {
                    this.host = url;
                }
            };
            ctor.prototype.normalize = function() {
                for (var i in baseUrl) {
                    if (baseUrl.hasOwnProperty(i) && typeof baseUrl[i] !== 'function') {
                        this[i] = this[i] || baseUrl[i];
                    }
                }
                //this.path = load.normalizePath(this.path);
                return this.toString();
            };
			ctor.prototype.toString = function() {
				// https://max:muster@www.example.com:8080/index.html?p1=A&p2=B#ressource
				var sb = [this.schema];
	            if (this.user) {
					sb.push(this.user);
		            if (this.password) sb.push(':', this.password);
					sb.push('@');
				}
		        sb.push(this.host);
				if (this.schema != 'file' && this.schema != 'mailto' && this.port != '') {
					 sb.push(':', this.port);
				}
				sb.push(this.path);
				var qk = Object.keys(this.query);
				if (qk.length > 0) {
					sb.push('?');
					var qkv = [];
					for (var k in this.query) {
						qkv.push(k + '=' + this.query[k]);
					}
					sb.push(qkv.join('&'));
				}
	            if (this.fragment) sb.push('#', this.fragment);
				return sb.join('');
			};
			return ctor;
		})()
    }
});
Object.defineProperties(window, {
    'baseUrl': {
        writeable: false,
        enumerable: false,
        value:(function(){
            var url = document.URL;
            var pos = url.lastIndexOf('/');
            if (pos == -1) pos == undefined;
            url = url.substring(0, pos);
            return new Url(url);
        })()
    },
    'addToSearchPath': {
        writeable: false,
        enumerable: false,
        value: function(url) {
            if (url === undefined) {
                url = document.currentScript.src || document.currentScript.url;
                url = url.substring(0, url.lastIndexOf('/'));
            }
            var path = new Url(url).path;
            _searchPath.push(path);
        }
    }
});

addToSearchPath();
addToSearchPath( (function(){
    var tokens = new Url(document.currentScript.src).path.split('/');
    tokens.pop(); tokens.pop();
    var path = tokens.join('/');
    return path;
})()
    
);

public(ajax, 'ajax');
public(load, 'load');
public(Url, 'Url');

} catch (error) {
	alert(error.message + '\n' + error.stack);
}