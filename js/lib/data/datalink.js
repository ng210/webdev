(function() {
    // 1. datalink transparent: accessing datalink.field is equal to accessing datalink.obj.field
    // 2. subscribe for changes: changing datalink.field triggers handlers
    // 3. synchronization
    //  - writing a.field also writes into b.field using an optional transform functionA2B
    //  - writing b.field also writes into a.field using an optional transform functionB2A

    function DataLink(obj) {
        this.__obj = obj;
        this.__fields = [];
        this.__handlers = {};
    }

    DataLink.create = function create(obj) {
        var res = null;
        if (typeof obj === 'object') {
            res = new DataLink(obj);
        } else {
            console.warn('Only objects can have DataLink features!')
        }
        return res;
    };

    DataLink.defaultHandlers = {
        'none': function none(fieldName) {
            return this[fieldName];
        },
        'set': (context, fieldName, value, xform, args) => {
            var oldValue = context[fieldName];
            var newValue = typeof xform === 'function' ? xform.call(context, value, args) : value;
            if (context instanceof DataLink) {
                context.__obj[fieldName] = newValue;
            } else {
                context[fieldName] = newValue;
            }
            return oldValue;
        }
    };

    DataLink.defaultXform = v => v;

    DataLink.prototype.obj = function obj() {
        return this.__obj;
    };

    DataLink.prototype.addField = function addField(fieldName, context, xform, args) {
        if (this.__obj[fieldName] !== undefined) {
            if (this.__fields.indexOf(fieldName)) {
                this.__fields.push(fieldName);
                xform = xform || DataLink.defaultXform;
                Object.defineProperty(this, fieldName,
                    {
                        enumerable: true,
                        configurable: false,
                        get: function () {
                            return this.__obj[fieldName];
                        },
                        set: function(value) {
                            var result = this.callHandlers(fieldName, [value], []);
                            return result;
                        }
                    }
                );
                this.addHandler(fieldName, context, fieldName, DataLink.defaultHandlers.set, [xform || DataLink.defaultXform].concat(args), true);
            } else {
                console.warn(`Object already has link to field '${fieldName}'!`);
            }
        } else {
            console.warn(`Linked object has no field '${fieldName}'!`);
        }
    };

    DataLink.prototype.addHandler = function addHandler(sourceField, context, targetField, handler, args, asFirst) {
        var handlers = this.__handlers[sourceField];
        if (!handlers) {
            handlers = this.__handlers[sourceField] = [];
        }
        var handler = { 'field': targetField || sourceField, 'context':context || this, 'fn':handler || DataLink.defaultHandlers.set, 'args': args || [] };        
        asFirst ? handlers.unshift(handler) : handlers.push(handler);
    };

    DataLink.prototype.removeHandler = function removeHandler(fieldName, handler, context) {
        var handlers = this.__handlers[fieldName];
        if (handlers) {
            context = context || this;
            var ix = handlers.findIndex(h => h.context == context && h.fn == handler && fn.fieldName == fieldName);
            handlers.splice(ix, 1);
        } else {
            console.warn(`No handler for '${fieldName}' found!`);
        }
    };

    DataLink.prototype.callHandlers = function callHandlers(fieldName, args, sources) {
        var result = null;
        var handlers = this.__handlers[fieldName];
        if (handlers) {
            if (sources.find(s => s.context == handler.context && s.field == fieldName) == null) {
                sources.push({ 'context':this, 'field':fieldName });
                for (var i=0; i<handlers.length; i++) {
                    var handler = handlers[i];
                    var ret = handler.fn(handler.context, handler.field, ...args, ...handler.args, sources);
                    if (ret != undefined) result = ret;
                }
            }
        }
        return result;
    };

    DataLink.prototype.addLink = function addLink(sourceField, dataLink, targetField, xform, args) {
        this.addHandler(sourceField, dataLink, targetField, null, [xform || DataLink.defaultXform].concat(args));
    };

    DataLink.prototype.addSync = function sync(sourceField, dataLink, targetField, xform1, xform2, args) {
        this.addHandler(sourceField, dataLink, targetField, null, [xform1 || DataLink.defaultXform].concat(args));
        dataLink.addHandler(targetField, this, sourceField, null, [xform2 || DataLink.defaultXform].concat(args));
    };

    publish(DataLink, 'DataLink');
})();
