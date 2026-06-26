import Visual from "./visual.js"

export default class VisualFactory {
    static create(type, values = {}) {

        if (!(type.prototype instanceof Visual)) {
            throw new Error(
                `${type.name} is not a Visual`
            )
        }

        const instance = new type()
        instance.assign(values)

        return instance
    }
}