if (window.top) {
    Object.defineProperties(window.top, {
        "module": {
            "enumerable": false,
            "configurable": false,
            "writable": false,
            "value": {}
        },
        "global": {
            "enumerable": false,
            "configurable": false,
            "writable": false,
            "value": window.top
        }
    });
}
Object.defineProperties(global, {
    "include": {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function(path) {}
    }
});