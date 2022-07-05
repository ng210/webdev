(function() {
    // 1. datalink transparent: accessing datalink.field is equal to accessing datalink.obj.field
    // 2. subscribe for changes: changing datalink.field triggers handlers
    // 3. way for direct write access without triggering handlers => synchronization
    //      A subscribes on B, B subscribes on A => values of A and B are kept synchronized
    //      Changing A triggers handler of B that changes B, this must not trigger the handler of A or it gets into an infinite loop

    function DataLink(obj) {
        Object.defineProperties(this, {
            'obj': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: obj
            },
            'handlers': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            }
        });
    }

    DataLink.prototype.callHandlers = function callHandlers(key, value) {
        var result = null;
        var handlers = this.handlers[key];
        if (handlers) {
            for (var i=0; i<handlers.length; i++) {
                var handler = handlers[i];
                var ret = handler.fn.call(handler.target, handler.field, value, handler.args);
                if (ret != undefined) result = ret;
            }
        }
        return result;
    };

    DataLink.prototype.addField = function addField(field, setter) {
        var key = field.toString();
        if (this.obj[key] !== undefined) {
            if (!Object.keys(this).includes(key)) {
                Object.defineProperty(this, key, {
                    enumerable: true,
                    configurable: false,
                    get: function () {
                        return this.obj[key];
                    },
                    set: function(value) {
                        var result = this.callHandlers(key, value);
                        return result;
                    }
                });
    
                if (setter !== null) {
                    setter = setter || {};
                    this.addHandler(key, setter, true);
                }
            } else {
                console.warn(`Object already has field '${field}'!`);
            }
        } else {
            console.warn(`Object is invalid!`);
        }
    };

    DataLink.prototype.addHandler = function addHandler(key, handler, asFirst) {
        if (!this.handlers[key]) this.handlers[key] = [];
        var handlers = this.handlers[key];
        if (typeof handler !== 'object') {
            if (typeof handler === 'function') {
                handler = { 'fn':handler };
            } else {
                throw new Error('Invalid handler as parameter!');
            }
        }
        handler.target = handler.target || this.obj;
        handler.field = handler.field || key;
        handler.fn = handler.fn || DataLink.defaultHandlers.set;
        handler.args = handler.args || DataLink.defaultXform;
        asFirst ? handlers.unshift(handler) : handlers.push(handler);
    };

    DataLink.prototype.addLink = function addLink(key, target, field, xform) {
        // initialize field from target
        this.obj[key] = target[field];
        // add handler to update target[field]
        this.addHandler(key, {
            'target':target,
            'field':field,
            'fn':DataLink.defaultHandlers.set,
            'args': xform || DataLink.defaultXform
        });
    };

    DataLink.addLink2 = function addLink2(dataLink1, key1, dataLink2, key2, xform1, xform2) {
        if (dataLink1[key1] === undefined) {
            // add handler for dataLink1[key1]
            dataLink1.addField(key1, {
                'fn':DataLink.defaultHandlers.set,
                'args':xform1
            });
        }
        dataLink1.addHandler(key1, {
            'target':dataLink2.obj,
            'field':key2,
            'fn':DataLink.defaultHandlers.set,
            'args':xform2 || DataLink.defaultXform
        });

        if (dataLink2[key2] === undefined) {
            // add handler for dataLink2[key2]
            dataLink2.addField(key2, {
                'fn':DataLink.defaultHandlers.set,
                'args':xform2
            });
        }
        dataLink2.addHandler(key2, {
            'target':dataLink1.obj,
            'field':key1,
            'fn':DataLink.defaultHandlers.set,
            'args':xform1 || DataLink.defaultXform
        });
    };

    DataLink.defaultXform = v => v;

    DataLink.defaultHandlers = {
        'none': function(field, value, xform) {
            return this[field];
        },
        'set': function(field, value, xform) {
            var oldValue = this[field];
            this[field] = xform.call(this, value);
            return oldValue;
        }
    };

    publish(DataLink, 'DataLink');
})();
