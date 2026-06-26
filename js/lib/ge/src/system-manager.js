import TypeDefinition from "./extensions/type-definition.js"

export default class SystemManager {
    #systems = []
    #types = new Map()

    //#region system management
    /**
     * Registers a system instance.
     * @param {Object} system
     * @returns {Object}
     */
    add(system) {
        if (!system) {
            console.error('Cannot register null system')
            return null
        }

        if (this.#systems.includes(system)) {
            console.warn('System already registered')
            return system
        }

        this.#systems.push(system)
        return system
    }

    /**
     * Gets the first system matching the specified type.
     * @param {Function} systemConstructor
     * @returns {Object|null}
     */
    get(systemConstructor) {
        return this.#systems.find(
            system => system instanceof systemConstructor
        ) ?? null
    }

    /**
     * Checks whether a system of the specified type exists.
     * @param {Function} systemConstructor
     * @returns {boolean}
     */
    has(systemConstructor) {
        return this.get(systemConstructor) !== null
    }

    /**
     * Removes a system instance.
     * @param {Object} system
     * @returns {boolean}
     */
    remove(system) {
        const index = this.#systems.indexOf(system)

        if (index < 0) {
            console.warn('System not found')
            return false
        }

        this.#systems.splice(index, 1)
        return true
    }

    /**
     * Removes all registered systems.
     */
    clear() {
        this.#systems.length = 0
    }

    /**
     * Gets a copy of all registered systems.
     * @returns {Object[]}
     */
    getAll() {
        return [...this.#systems]
    }
    //#endregion

    //#region System registry
    /**
     * Registers a system type definition.
     * @param {TypeDefinition} definition
     * @returns {TypeDefinition|null}
     */
    registerType(definition) {
        if (!definition) {
            console.error('Cannot register null type definition')
            return null
        }

        if (this.#types.has(definition.alias)) {
            console.error(`Type already registered: ${definition.alias}`)
            return null
        }

        this.#types.set(definition.alias, definition)
        return definition
    }

    /**
     * Gets a registered type definition.
     * @param {string} alias
     * @returns {TypeDefinition|null}
     */
    getType(alias) {
        return this.#types.get(alias) ?? null
    }

    /**
     * Checks whether a type definition is registered.
     * @param {string} alias
     * @returns {boolean}
     */
    hasType(alias) {
        return this.#types.has(alias)
    }
    //#endregion
}