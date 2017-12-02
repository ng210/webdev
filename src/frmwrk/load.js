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
            res[i] = ajax.send({
                url: obj[i],
                data: null,
                method: 'GET',
                async: async,
                onload: load.onload_,
                onerror: load.onerror_,
                context: context,
                index: i
            });
        }
    } else {
        res = ajax.send({
            url: obj,
            data: null,
            method: 'GET',
            async: async,
            onload: onload,
            onerror: onerror,
            context: context
        });
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

