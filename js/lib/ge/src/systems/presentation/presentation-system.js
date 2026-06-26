import ISystem from '../isystem.js'
class PresentationSystem extends ISystem {
    #visuals = []

    get visuals() {
        return this.#visuals
    }

    init(scene, timestamp) {}

    update(scene, dt) {
        this.#visuals.length = 0
        const objList = scene.getRepository(PresentationSystem)
        for (const obj of objList) {
            const presentation = obj.getFeature(PresentationSystem)
            this.#visuals.push(...presentation.visuals)
        }
    }

    shutdown(scene) {}
}

export default PresentationSystem;