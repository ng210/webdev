class ValidationResult {
    constructor(field, messages) {
        this.field = Array.isArray(field) ? field : field.split('.');
        this.messages = [];
        if (Array.isArray(messages)) {
            this.messages.push(...messages);
        } else if (typeof messages === 'string') {
            this.messages.push(messages);
        }
    }

    toString() {
        return `[${this.field.join('.')}]: ${this.messages.join('\n')}`;
    }
}

export { ValidationResult }