// (function() {
//     var Ui = window.Ui || {};
// 	function DataLink(obj) {
//         this.obj = obj;
//     }
//     DataLink.prototype.add = function(control, field) {
//         control.dataField = control.dataField || field;
//         field = control.dataField;
//         if (Object.keys(this.obj).includes(field)) {
//             Object.defineProperty(this, field, {
//                 enumerable:true,
//                 set: function set(v) {
//                     if (this.obj[field] !== v) {
//                         //console.log(`set ${this.obj[field]} to ${v}`);
//                         this.obj[field] = v;
//                         control.setValue(v);
//                     }
//                 },
//                 get: function() { return this.obj[field]; }
//             });
//             // add handler as the very first one
//             if (control.handlers['change'] === undefined) {
//                 control.handlers['change'] = [];
//             }
//             control.handlers['change'].unshift(
//                 {
//                     obj: this,
//                     fn: function(e) {
//                         var v = e.control.getValue();
//                         if (this[e.control.dataField] !== v) {
//                             this[e.control.dataField] = v;
//                         }
//                     }
//                 }
//             );
//         }
//     }
//     Ui.DataLink = DataLink;
//     public(Ui, 'Ui');
// })();



(function() {
    // 1. datalink transparent: accessing datalink.field is equal to accessing datalink.obj.field
    // 2. subscribe for changes: datalink.field changed triggers handlers
    // 3. way for direct write access without triggering handlers => synchronization
    //      A subscribes on B, B subscribes on A => values of A and B are kept synchronized
    //      Changing A triggers handler of B that changes B, this must not trigger the handler of A or it gets into an infinite loop

    function DataLink(obj) {
        this.obj = obj;
        Object.defineProperties(this, {
            'obj': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: obj
            },
            'triggers': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            }
        });
    }
    DataLink.prototype.add = function add(field, handler, dataLink, field2) {
        var link = null;
        //console.log('bind ' + field + (field2 ? ' to ' + field2 : ''));
        if (Object.keys(this.obj).includes(field)) {
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
                        var triggers = this.triggers[field];
                        for (var i=0; i<triggers.length; i++) {
                            var returns = triggers[i].fn.call(triggers[i].obj, value, oldValue, field);
                            var link = triggers[i].link;
                            if (link) {
                                if (link.obj instanceof DataLink) {
                                    link.obj.obj[link.field] = returns;
                                } else {
                                    link.obj[link.field] = returns;    
                                }
                            }
                        }
                    }
                });
                this.triggers[field] = [];
            };
            link = this.triggers[field];
            if (typeof handler === 'function') {
                var trigger = {'fn':handler, 'link': null};
                if (dataLink && field2) {
                    trigger.link = {'obj':dataLink, 'field':field2};
                }
                this.triggers[field].push(trigger);
            }
        }
        return link;
    };

    DataLink.prototype.link = function link(srcField, dst, dstField, srcToDst, dstToSrc) {
        this.add(srcField, srcToDst || DataLink.defaultHandler, dst, dstField);
        dst.add(dstField, dstToSrc || DataLink.defaultHandler, this, srcField);
    };
    DataLink.defaultHandler = v => v;

    var Ui = window.Ui || { DataLink: DataLink};
    public(Ui, 'Ui');
})();