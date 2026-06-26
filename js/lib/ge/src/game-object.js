export default class GameObject {
    #id
    get id() {
        return this.#id
    }

    #features = new Map()
    get features() {
        return this.#features
    }

    constructor(id) {
        if (new.target === GameObject) {
            throw new Error(
                'GameObject is abstract'
            )
        }
        this.#id = id
    }

    addFeature(systemClass, data) {
        this.#features.set(systemClass, data)
    }

    getFeature(systemClass) {
        return this.#features.get(systemClass)
    }

    removeFeature(systemClass) {
        this.#features.delete(systemClass)
    }

    hasFeature(systemClass) {
        return this.#features.has(systemClass)
    }
}