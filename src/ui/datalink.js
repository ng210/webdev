include('/ui/control.js');

(function() {
	Ui.DataLink = function(obj) {
        Object.defineProperty(this, 'obj', { value: obj });
    }
    Ui.DataLink.prototype.add = function(control, field) {
        //var dataSource = control.dataSource || this.obj;
        control.dataField = control.dataField || field;
        field = control.dataField;
        if (Object.keys(this.obj).indexOf(field) != -1) {
            //eval(`Object.defineProperty(this, field, {enumerable:true, set: function(v) { this.obj['${field}'] = v; control.setValue(v); }, get: function() { return this.obj['${field}']; }})`);
            Object.defineProperty(this, field, {
                enumerable:true,
                set: function(v) { this.obj[field] = v; control.setValue(v); },
                get: function() { return this.obj[field]; }
            });
            // add handler as the very first one
            if (control.handlers['change'] === undefined) {
                control.handlers['change'] = [];
            }
            control.handlers['change'].unshift({obj:this, fn: function(control){ this[control.dataField] = control.getValue(); }});
        }
    }
})();
