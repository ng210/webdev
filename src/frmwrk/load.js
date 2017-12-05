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
            res[i] = load.load_(obj[i], context, i, load.onload_, load.onerror_);
        }
    }
    return res;
}
load.load_ = function(item, context, ix, onload, onerror) {
    var res = null;
    var options = null;
    if (typeof item === 'string') {
        options = { url: item };
    } else {
        options = item;
    }
    for (k in load.requiredOptions_) {
        if (options[k] === undefined) {
            options[k] = load.requiredOptions_[k];
        }
    }
    options.context = context;
    options.index = ix;
    res = ajax.send(options);
    return res;
};
load.requiredOptions_ = {
    url: '',
    data: '',
    method: 'GET',
    contentType: 'text'
};
load.onload_ = function(data, xhr) {
    var context = xhr.options.context;
    context.result[xhr.options.index] = data;
    context.counter--;
    if (context.counter == 0) {
        if (!context.error) {
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
        context.onerror(context.result);
    }
};

