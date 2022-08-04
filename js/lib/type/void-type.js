include('/lib/type/type.js');
(function() {    
    function VoidType(name, type, args) {
        VoidType.base.constructor.call(this, name, type, args);
    }
    extend(Type, VoidType);

    VoidType.prototype.validate = function validate(value, results, path) {
        var isValid = true;
        return isValid;
    };
    VoidType.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        return value;
    };
    // VoidType.prototype.createPrimitiveValue = function createPrimitiveValue(value) {
    //     return this.createValue(value);
    // };
    // VoidType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
    //     return this.createValue(null, tracking, isPrimitive);
    // };

    publish(VoidType, 'VoidType');
})();