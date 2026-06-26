export default class FeatureData {
    assign(data) {
        for (const [key, value] of Object.entries(data)) {
            if (!(key in this)) {
                console.warn(`${this.constructor.name}: unknown property '${key}'`)
                continue
            }
            this[key] = value
        }
    }
}