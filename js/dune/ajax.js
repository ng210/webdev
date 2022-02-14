var ajax = {
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
        // open XHR connection
        xhr.open(options.method.toUpperCase(), options.url, options.async);
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
        for (var i in options.headers) {
            xhr.setRequestHeader(i, options.headers[i]);
        }
        return xhr;
    },
    onReadyStateChange: function() {
        if (this.readyState == XMLHttpRequest.DONE) {
            this.options.response = this.response;
            this.options.statusCode = this.status;
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