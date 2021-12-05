(function() {
    function ValidationResult(field, messages) {
        this.field = Array.isArray(field) ? field : field.split('.');
        this.messages = messages || [];
    }

    ValidationResult.prototype.toString = function toString() {
        return `[${this.field.join('.')}]: ${this.messages.join('\n')}`;
    };

    publish(ValidationResult, 'ValidationResult');
})();