include('/lib/type/type.js');
(function() {
    function StringType(name, type, args) {
        StringType.base.constructor.call(this, name, type, args);
        this.length = 0;
        if (args) {
            if (args.length) this.length = args.length;
        }
        if (this.default == null) this.default = '';
    }
    extend(Type, StringType);

    StringType.prototype.validate = function validate(value, results, path) {
        results = results || [];
        var isValid = true;
        var messages = [];
        var v = value && value.valueOf();
        if (value != null && typeof v === 'string') {
            if (this.length && this.length < v.length) {
                messages.push(`Value too long! (${this.length} < ${v.length})!`);
                isValid = false;
            }
        } else {
            messages.push(`Invalid value '${v}' for string!`)
            isValid = false;
        }
        if (!isValid) {
            results.push(new ValidationResult(path || [], messages));
        }
        return isValid;
    };
    StringType.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        if (value === null || value === undefined) {
            var length = this.length || 20;
            var arr = [];
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZWabcdefghijklmnopqrstuvxyzw_";
            for (var i=0; i<length; i++) {
                arr.push(chars[Math.floor(chars.length*Math.random())]);
            }
            value = arr.join('');
            
        } else {
            value = value + '';
        }

        if (!isPrimitive) {
            value = new String(value);
            this.setType(value);
        }
        return value;
    };
    // StringType.prototype.createPrimitiveValue = function createPrimitiveValue(value) {
    //     var v = '';
    //     if (value === null) v = null;
    //     else {
    //         if (value === undefined) {
    //             var length = this.length || 20;
    //             var arr = [];
    //             var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZWabcdefghijklmnopqrstuvxyzw_";
    //             for (var i=0; i<length; i++) {
    //                 arr.push(chars[Math.floor(chars.length*Math.random())]);
    //             }
    //             v = arr.join('');
                
    //         } else {
    //             v = value + '';
    //         }
    //     }
    //     return v;
    // };
    // StringType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
    //     return this.createValue('', tracking, isPrimitive);
    // };
    StringType.prototype.compare = function compare(a, b) {
        //return a.localeCompare(b);
        var result = 0;
        if (a < b) result = -1;
        else if (a > b) result = 1;
        return result;
    };

    publish(StringType, 'StringType');
})();