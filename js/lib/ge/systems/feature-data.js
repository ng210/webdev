export default class FeatureData {
    constructor(data = {}) {
        this.assign(data)
    }

    assign(data) {
        for (const [key, value] of Object.entries(data)) {

            if (!(key in this)) {
                console.warn(`${this.constructor.name}: unknown property '${key}'`)
            }

            this[key] = value
        }
    }
}