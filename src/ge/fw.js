(function() {
    var fw = fw || {
        Array: function(arr) {
            Array.apply(this.arguments);
        },
        Map: function(keys, values) {
            if (keys && typeof keys === 'object' && !values) {
                ;
            }

        }
    };
    fw.Array.prototype = new Array;
    fw.Map.prototype = new Object;

    return fw;

});