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
                                handler.fn.call(handler.context, value, oldValue, handler.args);
                            }
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
        if (this.obj[field] !== undefined) {
            if (this.handlers[field] === undefined) {
                this.handlers[field] = [];
            }
            if (this.handlers[field].findIndex( x => (x.context == context && x.fn == handler && x.args == args)) == -1) {
                this.handlers[field].push({context: context || window, fn: handler, args: args || [] });
            }
        }
    };

    DataLink.prototype.link = function link(field1, target, field2, transformToSource, transformToTarget) {
        this.add(field1);
        if (!(target instanceof DataLink)) {
            target = new DataLink(target);
        }
        this.addHandler(
            field1,
            transformToTarget || DataLink.defaultTransform,
            this.obj,
            {target:target.obj, field:field2}
        );

        target.add(field2);
        target.addHandler(
            field2,
            transformToSource || DataLink.defaultTransform,
            target.obj,
            {target:this.obj, field:field1}
        );
        return target;
    };

    DataLink.defaultTransform = function defaultTransform(value, oldValue, args) {
        args.target[args.field] = value;
        return value;
    };

    public(DataLink, 'DataLink');
})();