(function() {
    // 1. datalink transparent: accessing datalink.field is equal to accessing datalink.obj.field
    // 2. subscribe for changes: changing datalink.field triggers handlers
    // 3. synchronization
    //  - writing a.field also writes into b.field using an optional transform functionA2B
    //  - writing b.field also writes into a.field using an optional transform functionB2A

    function DataLink(obj) {
        if (typeof obj === 'object') {
            if (!DataLink.is(obj)) {
                Object.defineProperties(
                    obj,
                    {
                        'handlers_': {
                            enumerable: false,
                            configurable: false,
                            writable: false,
                            value: {}
                        }
                    }
                );
            }
        } else {
            console.warn('Only objects can have DataLink features!')
            obj = null;
        }
        return obj;
    }

    DataLink.addField = function addField(obj, field) {
        if (field) {
            var pField = field + '_';
            if (obj[field] !== undefined) {
                if (!Object.hasOwn(obj, pField)) {
                    //obj[pField] = obj[field];
                    Object.defineProperty(obj, pField, 
                        {
                            enumerable: false,
                            configurable: false,
                            writable: true,
                            value: obj[field]
                        }
                    );
                    Object.defineProperty(obj, field,
                        {
                            enumerable: true,
                            configurable: false,
                            get: function () {
                                return obj[pField];
                            },
                            set: function(value) {
                                var result = DataLink.callHandlers(obj, field, value, []);
                                return result;
                            }
                        }
                    );
                    // if (handler) {
                    //     obj.addHandler(key, handler, true);
                    // }
                } else {
                    console.warn(`Object already has field '${field}'!`);
                }
            } else {
                console.warn(`Object has no field '${field}'!`);
            }
            DataLink.addHandler(obj, field, { 'field':pField }, true);
        }
    };
    // handler = { 'target', 'field', 'fn', 'args' }
    DataLink.addHandler = function addHandler(obj, field, handler, asFirst) {
        var pField = field + '_';
        if (!Object.hasOwn(obj, pField)) {
            DataLink.addField(obj, field);
        }
if (!obj.handlers_) debugger
        if (!obj.handlers_[field]) obj.handlers_[field] = [];
        var handlers = obj.handlers_[field];
        if (typeof handler !== 'object') {
            if (typeof handler === 'function') {
                handler = { 'fn':handler };
            } else {
                throw new Error('Invalid handler as parameter!');
            }
        }
        handler.target = handler.target || obj;
        handler.field = handler.field || field;
        handler.fn = handler.fn || DataLink.defaultHandlers.set;
        handler.args = handler.args || DataLink.defaultXform;
        asFirst ? handlers.unshift(handler) : handlers.push(handler);
    };
    DataLink.removeHandler = function removeHandler(obj, filter) {
        if (Object.hasOwn(obj, 'handlers_')) {
            for (var i in obj.handlers_) {
                var handlers = [];
                for (var j=0; j<obj.handlers_[i].length; j++) {
                    if (!filter(obj.handlers_[i][j])) {
                        handlers.push(obj.handlers_[i][j]);
                    }
                }
                obj.handlers_[i] = handlers;
            }
        }
    };
    DataLink.callHandlers = function callHandlers(obj, field, value, sources) {
        var result = null;
        var handlers = obj.handlers_[field];
        if (handlers) {
            sources.push({ 'obj':obj, 'field':field });
            for (var i=0; i<handlers.length; i++) {
                var handler = handlers[i];
                if (sources.find(s => s.obj == handler.target && s.field == handler.field) == null) {
                    var ret = handler.fn.call(handler.target, handler.field, value, handler.args, sources);
                    if (ret != undefined) result = ret;
                }
            }
        }
        return result;
    };
    DataLink.setField = function setField(obj, field, value, sources) {
        if (obj.handlers_[field]) {
            DataLink.callHandlers(obj, field, value, sources);
        } else {
            obj[field] = value;
        }
    };

    DataLink.link = function link(objA, fieldA, objB, fieldB, a2b) {
        DataLink(objA);
        DataLink.addHandler(objA, fieldA, { 'target':objB, 'field':fieldB, 'args': a2b })
    };

    DataLink.sync = function sync(objA, fieldA, objB, fieldB, a2b, b2a) {
        DataLink.link(objA, fieldA, objB, fieldB, a2b);
        DataLink.link(objB, fieldB, objA, fieldA, b2a);
    };

    DataLink.is = function is(obj) {
        return Object.hasOwn(obj, 'handlers_');
    };

    DataLink.defaultXform = v => v;

    DataLink.defaultHandlers = {
        'none': function(field, value, xform, source) {
            return this[field];
        },
        'set': function(field, value, xform, sources) {
            var oldValue = this[field];
            var newValue = xform.call(this, value);
            if (DataLink.is(this)) DataLink.setField(this, field, newValue, sources);
            else this[field] = newValue;
            return oldValue;
        }
    };

    // DataLink.prototype.addLink = function addLink(key, target, field, xform) {
    //     // initialize field from target
    //     this.obj[key] = target[field];
    //     // add handler to update target[field]
    //     this.addHandler(key, {
    //         'target':target,
    //         'field':field,
    //         'fn':DataLink.defaultHandlers.set,
    //         'args': xform || DataLink.defaultXform
    //     });
    // };

    // DataLink.addLink2 = function addLink2(dataLink1, key1, dataLink2, key2, xform1, xform2) {
    //     if (!dataLink1.hasOwn(key1)) {
    //         // add handler for dataLink1[key1]
    //         dataLink1.addField(key1, {
    //             'fn':DataLink.defaultHandlers.set,
    //             'args':xform1
    //         });
    //     }
    //     dataLink1.addHandler(key1, {
    //         'target':dataLink2.obj,
    //         'field':key2,
    //         'fn':DataLink.defaultHandlers.set,
    //         'args':xform2 || DataLink.defaultXform
    //     });

    //     if (!dataLink2.hasOwn(key2)) {
    //         // add handler for dataLink2[key2]
    //         dataLink2.addField(key2, {
    //             'fn':DataLink.defaultHandlers.set,
    //             'args':xform2
    //         });
    //     }
    //     dataLink2.addHandler(key2, {
    //         'target':dataLink1.obj,
    //         'field':key1,
    //         'fn':DataLink.defaultHandlers.set,
    //         'args':xform1 || DataLink.defaultXform
    //     });
    // };

    publish(DataLink, 'DataLink');
})();
