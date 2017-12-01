include('frmwrk/ajax.js');

function load(obj, onload, onerror) {
    var async = typeof onload === 'function';
    var res;
    var context = {
        result: []
    };
    if (Array.isArray(obj)) {
        context.counter = obj.length;
        context.onload = onload;
        context.onerror = onerror;
        context.error = false;
        res = [];
        for (var i=0; i<obj.length; i++) {
            res[i] = load.load_(obj[i], async, load.onload_, load.onerror_, context, i);
        }
    } else {
        res = load.load_(obj, async, onload, onerror, context);
    }
    return res;
}
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

load.load_ = function load_(path, async, onload, onerror, context, ix) {
    // get extension
    // var tokens = path.match(/\.([^\.]+)$/);
    // if (tokens == null) {
    //     // load data
    // }
    // var content = null;
    // if (tokens != null) {
    //     content = load.contentTypes_[tokens[1]];
    // }
    // var node = document.createElement()
    // ajax.send({url:path, async:})
    // script.innerHTML = ajax.send( {url:'dummy.js', async:false} );
    // document.head.appendChild(script);
    var res = ajax.send({
        url: path,
        data: null,
        method: 'GET',
        async: async,
        onload: onload,
        onerror: onerror,
        context: context,
        index: ix
    });
    return res;
};
