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
            'transforms': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            },
            'handlers': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            }
        });
    }

    DataLink.prototype.add = function add(field, transform, context, args) {
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
                        var transform = this.transforms[field];
                        this.obj[field] = transform.fn.call(transform.context, value, oldValue, transform.args);
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
                this.transforms[field] = {context: context || this, fn: transform || DataLink.defaultTransform, args: args || [] };
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
        this.add(field1, transformToSource);
        if (!(target instanceof DataLink)) {
            target = new DataLink(target);
        }
        this.addHandler(
            field1,
            DataLink.linkHandler,
            this,
            {target:target.obj, field:field2, fn:transformToTarget || DataLink.defaultTransform}
        );

        target.add(field2, transformToTarget);
        target.addHandler(
            field2,
            DataLink.linkHandler,
            this,
            {target:this.obj, field:field1, fn:transformToSource || DataLink.defaultTransform}
        );

        return target;
    };

    DataLink.linkHandler = function linkHandler(value, oldValue, args) {
        args.target[args.field] = args.fn(value, oldValue);
    };



    // DataLink.prototype.add = function add(field, handler, target, field2) {
    //     if (this.obj[field] != undefined) {
    //         if (!Object.keys(this).includes(field)) {
    //             Object.defineProperty(this, field, {
    //                 enumerable: true,
    //                 configurable: false,
    //                 get: function () {
    //                     return this.obj[field];
    //                 },
    //                 set: function (value) {
    //                     var oldValue = this.obj[field];
    //                     this.obj[field] = value;
    //                     var triggers = this.triggers[field];
    //                     for (var i=0; i<triggers.length; i++) {
    //                         var returns = triggers[i].fn.call(triggers[i].obj, value, oldValue, field);
    //                         var link = triggers[i].link;
    //                         if (returns != undefined && link) {
    //                             if (link.target instanceof DataLink) {
    //                                 link.target.obj[link.field] = returns;
    //                             } else {
    //                                 link.target[link.field] = returns;    
    //                             }
    //                         }
    //                     }
    //                 }
    //             });
    //             this.triggers[field] = [];
    //         };

    //         this.addHandler(field, handler, target, field2);
    //     }
    // };

    // DataLink.prototype.addHandler = function addHandler(field, handler, target, field2) {
    //     if (this[field] != undefined) {
    //         if (typeof handler === 'function') {
    //             var link = target && field2 ? {'target':target, 'field':field2} : null;
    //             var trigger = { 'fn':handler, 'obj': target, 'link': link };
    //             this.triggers[field].push(trigger);
    //         }
    //     }
    // };

    // DataLink.prototype.link = function link(srcField, dst, dstField, srcToDst, dstToSrc) {
    //     this.add(srcField, srcToDst || DataLink.defaultHandler, dst, dstField);
    //     dst.add(dstField, dstToSrc || DataLink.defaultHandler, this, srcField);
    // };
    DataLink.defaultTransform = v => v;

    public(DataLink, 'DataLink');
})();