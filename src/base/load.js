include('base/globals.js');
include('base/ajax.js');
(function() {
    // directly require('/base/ajax.js') to avoid circular reference
    var ajax = module['/base/ajax.js'];

    Object.defineProperties(window.top, {
        load: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function(obj, onload, onerror) {
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
            }
        }
    });

    // load('config.xml');
    // load(['user.xml', 'config.xml', 'web.xml']);
    // load('config.xml', onload, onerror);
    // load(['user.xml', 'config.xml', 'web.xml'], onload, onerror);
    // load({ url: 'config.xml', contentType: 'xml' });
    // load([{ url: 'user.html', contentType: 'html', method: 'get' }, { url: 'app.cfg', contentType: 'xml', method: 'post' });
    // load({ url: 'config.xml', contentType: 'xml' }, onload, onerror);
    // load([{ url: 'user.html', contentType: 'html', method: 'get' }, { url: 'app.cfg', contentType: 'xml', method: 'post' }, onload, onerror);

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
        options.context = context;
        options.index = ix;
        res = ajax.send(options);
        if (typeof options.onload !== 'function') {
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
                default: contentType = 'text/plain'; break;
            }
        }
        var res = null;
        switch (contentType) {
            case 'text/javascript':
                res = document.createElement('script');
                res.innerHTML = data;
                document.head.appendChild(res);
                break;
            case 'text/xml':
                var el = document.createElement('div');
                el.innerHTML = data;
                res = parseElement(el);
                break;
            case 'text/html':
                var el = document.createElement('div');
                el.innerHTML = data;
                res = el;
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
        //console.log('Path='+path);
        var base = base || load.urlInfo.path;
        var pathParts = base.split('/');
        if (pathParts[pathParts.length-1].length == 0) pathParts.pop();
        var arr = path.split('/');
        for (var i=0; i<arr.length; i++) {
            var part = arr[i];
            if (part == '') {
                if (i == 0) {
                    pathParts = [];
                } else {
                    continue;
                }
            } else
            if (part == '.') continue;
            if (part == '..') {
                if (pathParts.length > 1) {
                    pathParts.pop();
                } else {
                    throw new Error('Invalid path!');
                }
            } else {
                pathParts.push(part);
            }
        }
        //console.log(pathParts);
        return pathParts.join('/');
    };
    load.UrlObject = function(url, force) {
        // https://max:muster@www.example.com:8080/index.html?p1=A&p2=B#ressource
        //console.log('URL='+url);
        this.schema = 'http';
        this.user = '';
        this.password = '';
        this.host = '';
        this.port = 80;
        this.path = '';
        this.query = {};
        this.fragment = '';
        // check schema
        var position = -1;
        if ((position = url.indexOf(':')) != -1) {
            var schemas = {
                'http': 2, 'https': 2, 
                'file': 3, 'ftp': 2, 
                'mailto': 0
            };
            var schema = url.substring(0, position);
            var skip = schemas[schema];
            if (skip != undefined) {
                this.schema = schema;
                url = url.substring(position + 1 + skip);
            }
        }
        // check user and password
        if (url.indexOf('@') != -1) {
            var tokens = url.split('@');
            url = tokens[1];
            tokens = tokens[0].split(':');
            this.user = tokens[0];
            this.password = tokens[1] || '';
        }
        // check host
        if ((position = url.indexOf('/')) != -1) {
            if (position > 0 && url.charAt(position-1) == '.') {
                position--;
                if (position > 0 && url.charAt(position-1) == '.') {
                    position--;
                }
            }
            this.path = force ? url.substring(position) : load.normalizePath(url.substring(position));
        } else {
            position = url.length;
        }
        this.host = url.substring(0, position);
        if (this.host.length > 0) {
            var tokens = this.host.split(':');
            this.host = tokens[0];
            var port = parseInt(tokens[1]);
            if (!isNaN(port)) this.port = port;
        }
        url = url.substring(position);
        // check fragment
        if ((position = url.indexOf('#')) != -1) {
            var tokens = url.split('#');
            url = tokens[0];
            this.fragment = tokens[1];
        }
        // check query
        if ((position = url.indexOf('?')) != -1) {
            var tokens = url.split('?');
            this.path = tokens[0];
            //console.log('Path2='+this.path);
            tokens = tokens[1].split('&');
            for (var i=0; i<tokens.length; i++) {
                var keyValue = tokens[i].split('=');
                this.query[keyValue[0]] = keyValue[1];
            }
        }
    };
    Object.defineProperty(load, 'urlInfo', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: new load.UrlObject(location.href, true)
    });
    module.exports=load;
})();