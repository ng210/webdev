export default class AssetManager {
    #assets = new Map()
    #idCounter = 0

    /**
     * Creates and registers an explicit asset.
     * @param {string|null} id
     * @param {Asset} asset
     * @returns {Asset}
     */
    create(id, asset) {
        const finalId = id ?? this.#generateId()

        if (this.#assets.has(finalId)) {
            console.error(`Asset already exists: ${finalId}`)
        }

        asset.id = finalId
        this.#assets.set(finalId, asset)

        return asset
    }

    /**
     * Retrieves an asset by id.
     * @param {string} id
     * @returns {Asset|null}
     */
    get(id) {
        return this.#assets.get(id) ?? null
    }

    /**
     * Removes an asset by id.
     * @param {string} id
     * @returns {boolean}
     */
    remove(id) {
        return this.#assets.delete(id)
    }

    /**
     * Clears all assets.
     */
    clear() {
        this.#assets.clear()
    }

    /**
     * Resolves a value into an Asset.
     *
     * Supported inputs:
     * - object 
     * - string: asset id OR direct resource (heuristic: non-registered string becomes implicit asset)
     * - { ref: string }: asset reference
     * - literal value: wrapped into implicit asset
     *
     * @param {*} value
     * @returns {Asset}
     */
    resolve(value) {
        // Reference object: { ref: "assetId" }
        if (this.#isRefObject(value)) {
            const asset = this.get(value.ref)
            if (!asset) {
                console.error(`Asset not found: ${value.ref}`)
            }
            return asset
        }

        // Registered asset id
        if (typeof value === 'string' && this.#assets.has(value)) {
            return this.get(value)
        }

        // Direct resource or literal → implicit asset
        return this.#createImplicitAsset(value)
    }

    /**
     * Creates an implicit asset from raw resource.
     * @param {*} resource
     * @returns {Asset}
     */
    #createImplicitAsset(resource) {
        const id = this.#generateId()

        const asset = {
            id,
            resource,
            implicit: true
        }

        this.#assets.set(id, asset)

        return asset
    }

    /**
     * Generates a unique asset id.
     * @returns {string}
     */
    #generateId() {
        return `asset_${this.#idCounter++}`
    }

    /**
     * Checks whether a value is a reference object.
     * @param {*} value
     * @returns {boolean}
     */
    #isRefObject(value) {
        return (
            value &&
            typeof value === 'object' &&
            typeof value.ref === 'string'
        )
    }
}