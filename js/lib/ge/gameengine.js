import Scene from './scene.js'

export default class GameEngine {
    #systems = []
    #scene = null

    #running = false
    #lastTime = 0

    constructor(scene = new Scene()) {
        this.#scene = scene
        this.loop = this.loop.bind(this)
    }

    addSystem(system) {
        this.#systems.push(system)
    }

    start() {
        if (this.#running) return

        this.#running = true
        this.#lastTime = performance.now()

        for (const system of this.#systems) {
            system.init(this.#scene, this.#lastTime)
        }

        requestAnimationFrame(this.loop)
    }

    stop() {
        this.#running = false

        for (const system of this.#systems) {
            system.shutdown(this.#scene)
        }
    }

    loop(time) {
        if (!this.#running) return

        const dt = (time - this.#lastTime) / 1000
        this.#lastTime = time

        for (const system of this.#systems) {
            system.update(this.#scene, dt)
        }

        requestAnimationFrame(this.loop)
    }
}