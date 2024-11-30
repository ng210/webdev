class Entity {
    constructor(id) {
        this.id = id;
    }

    get label() {
        throw new Error('Not implemented!');
    }

    buildGrid() {
        throw new Error('Not implemented!');
    }
}

export { Entity }