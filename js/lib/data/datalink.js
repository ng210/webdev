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
            },
            'links': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            }
        });
    }

    DataLink.prototype.add = function add(field) {
        if (this.obj[field] !== undefined) {
            if (!Object.keys(this).includes(field)) {
                Object.defineProperty(this, field, {
                    enumerable: true,
                    configurable: false,
                    get: function () {
                        return this.obj[field];
                    },
                    set: function (value) {
                        var oldValue = this.obj[field];
                        this.obj[field] = value;
                        var handlers = this.handlers[field];
                        if (handlers) {
                            for (var i=0; i<handlers.length; i++) {
                                var handler = handlers[i];
                                var result = handler.fn.call(handler.context, value, oldValue, handler.args);
                                if (result != undefined) {
                                    this.obj[field] = result;
                                }
                            }
                        }
                        var link = this.links[field];
                        if (link) {
                            DataLink.updateLinkedValue(this.obj[field], oldValue, link);
                        }
                        return oldValue;
                    }
                });
            }
        } else {
            console.warn(`Object does not have field '${field}'!`);
        }
    };

    DataLink.prototype.addHandler = function addHandler(field, handler, context, args) {
        var storedHandler = null;
        if (this.obj[field] !== undefined) {
            if (this.handlers[field] === undefined) {
                this.handlers[field] = [];
            }
            var storedHandler = this.handlers[field].find(x => (x.context == context && x.fn == handler && x.args == args));
            if (!storedHandler) {
                storedHandler = { context: context || window, fn: handler, args: args || [] };
                this.handlers[field].push(storedHandler);
            }
        }
        return storedHandler;
    };

    DataLink.prototype.link = function link(field1, target, field2, transformToSource, transformToTarget) {
        this.add(field1);
        if (!(target instanceof DataLink)) {
            target = new DataLink(target);
        }
        this.links[field1] = {
            fn: transformToTarget || DataLink.defaultTransform,
            context: this.obj,
            target: target.obj,
            field: field2
        }

        target.add(field2);
        target.links[field2] = {
            fn: transformToSource || DataLink.defaultTransform,
            context: target.obj,
            target: this.obj,
            field: field1
        };
        return target;
    };

    DataLink.defaultTransform = (value, oldValue, args) => value;
    DataLink.updateLinkedValue = function updateLinkedValue(value, oldValue, link) {
        var result = link.fn.call(link.context, value, oldValue);
        if (result == undefined) result = value;
        link.target[link.field] = result;
    };

    publish(DataLink, 'DataLink');
})();