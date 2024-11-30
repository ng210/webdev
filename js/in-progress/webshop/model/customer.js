import { Entity } from './entity.js'

class Customer extends Entity {
    constructor(id, name, address, rank) {
        super(id);
        this.name = name;
        this.address = address;
        this.rank = rank;
    }

    get label() {
        return this.name;
    }
}

export { Customer }