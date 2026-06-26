import Scene from './scene.js'
import PresentationSystem from './systems/presentation/presentation-system.js'

export default class GameEngine {
    #renderer = null
    #scene = null

    #running = false
    #lastTime = 0

    constructor(renderer, scene = new Scene()) {
        this.#scene = scene
        this.#renderer = renderer
        this.loop = this.loop.bind(this)
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

        this.#renderer.shutdown()
    }

    loop(time) {
        if (!this.#running) return

        const dt = (time - this.#lastTime) / 1000
        this.#lastTime = time

        this.update(dt)
        this.render(dt)
        requestAnimationFrame(this.loop)
    }

    update(dt) {
        for (const system of this.#systems) {
            system.update(this.#scene, dt)
        }
    }

    render() {
        this.#renderer.beginFrame()
        this.#renderer.render(this.#presentationSystem.visuals)
        this.#renderer.endFrame()
    }
}