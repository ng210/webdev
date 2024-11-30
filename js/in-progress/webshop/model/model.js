import { Entity } from './entity.js'
import { Customer } from './customer.js'

class Model {
    construtor(json) {
        this.customers = [];
        this.readFromJson(json);
    }

    readFromJson(json) {

    }
}
export { Model }