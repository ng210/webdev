var ajax = {
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
                if (typeof xhr.options.onerror === 'function') {
                    xhr.options.onerror(new Error(xhr.options.url + ' - ' + xhr.statusText + ' (' + xhr.status + ')'), xhr);
                }
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
        xhr.open(options.method.toUpperCase(), options.url, options.async);
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
    * - async
    * - onload
    * - onerror
    * (contentType, responseType)
    ******************************************************************************/
    send: function(options) {
        var res = null;
        var defaultOptions = {
            data: '',
            contentType: 'json',
            responseType: 'json',
            async: true,
            method: 'get'
        };
        for (var k in defaultOptions) {
            if (options[k] === undefined)
                options[k] = defaultOptions[k];
        }

        var xhr = ajax.createXhr(options);
        ajax.setContentType(xhr, options.contentType);
        try {
            xhr.send(options.data);
        } catch (err) {
            xhr.error = err;
            if (options.onerror) {
                options.onerror(err, xhr);
            }
        }
        if (options.async) {
            res = xhr;
        } else {
            xhr.options.onload = [];
            ajax.xmlHttpStateChange(xhr);
            res = xhr.options.responseData;
        }
        return res;
    }
};
var module = module || {};
module.ajax = ajax;