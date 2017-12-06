include('frmwrk/ajax.js');

// load('config.xml');
// load(['user.xml', 'config.xml', 'web.xml']);
// load('config.xml', onload, onerror);
// load(['user.xml', 'config.xml', 'web.xml'], onload, onerror);
// load({ url: 'config.xml', contentType: 'xml' });
// load([{ url: 'user.html', contentType: 'html', method: 'get' }, { url: 'app.cfg', contentType: 'xml', method: 'post' });
// load({ url: 'config.xml', contentType: 'xml' }, onload, onerror);
// load([{ url: 'user.html', contentType: 'html', method: 'get' }, { url: 'app.cfg', contentType: 'xml', method: 'post' }, onload, onerror);


function load(obj, onload, onerror) {
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
        var m = options.url.match(/[^\\\/\.]+\.(.+)$/);
        var ext = m ? m[1] : '';
        switch (ext) {
            case 'css': contentType = 'text/css'; break;
            case 'js': contentType = 'text/javascript'; break;
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

