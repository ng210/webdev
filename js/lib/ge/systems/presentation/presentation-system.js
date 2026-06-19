import ISystem from '../isystem.js'
class PresentationSystem extends ISystem {
    #visuals = []

    get visuals() {
        return this.#visuals
    }

    update(scene, dt) {
        this.#visuals.length = 0
        const objList = scene.getRepository(PresentationSystem)
        for (const obj of objList) {
            const presentation = object.getFeature(PresentationSystem)
            this.#visuals.push(...presentation.visuals)
        }
    }
}

export default PresentationSystem;