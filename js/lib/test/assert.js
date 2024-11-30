import Test from './test.js'

class Assert {
    static #_operators = {

    };

    static addOperator(sign, predicate) {
        Assert.#_operators[sign] = predicate;
    }

    static check(a, b, arg) {
        var predicate = null;
        if (typeof arg === 'string') predicate = Assert.#_operators[arg];
        else if (typeof arg === 'function') predicate = arg;
        else predicate = Assert.#_operators['='];
        return predicate(a, b);
    }

    static isEqual(a, b) {
        return Assert.check(a, b, Assert.compare);
    }

    static isNotEqual(a, b) {
        return !Assert.check(a, b, Assert.compare);
    }

    static isTrue(a) {
        return Assert.check(a, true);
    }

    static isFalse(a) {
        return Assert.check(a, false);
    }


}

export { Assert }