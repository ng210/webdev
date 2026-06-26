export default class Scene {
    // -------------------------
    // Core storage
    // -------------------------
    #gameObjects = new Map()   // id -> GameObject
    #assets = new Map()        // id -> asset

    // systemClass -> GameObject[]
    #repositories = new Map()

    // -------------------------
    // GameObject management
    // -------------------------

    register(object) {
        // 1. store globally
        this.#gameObjects.set(object.id, object)

        // 2. index into system repositories
        for (const systemClass of object.features.keys()) {
            this.#getRepository(systemClass).push(object)
        }
    }

    unregister(object) {
        // 1. remove from global store
        this.#gameObjects.delete(object.id)

        // 2. remove from all repositories
        for (const systemClass of object.features.keys()) {
            const repo = this.#getRepository(systemClass)
            const index = repo.indexOf(object)

            if (index !== -1) {
                repo.splice(index, 1)
            }
        }
    }

    getObject(id) {
        return this.#gameObjects.get(id)
    }

    getAllObjects() {
        return this.#gameObjects.values()
    }

    // -------------------------
    // Asset management
    // -------------------------

    addAsset(id, asset) {
        this.#assets.set(id, asset)
    }

    getAsset(id) {
        return this.#assets.get(id)
    }

    removeAsset(id) {
        this.#assets.delete(id)
    }

    // -------------------------
    // System repositories
    // -------------------------

    getRepository(systemClass) {
        return this.#getRepository(systemClass)
    }

    #getRepository(systemClass) {
        let repo = this.#repositories.get(systemClass)

        if (!repo) {
            repo = []
            this.#repositories.set(systemClass, repo)
        }

        return repo
    }
}