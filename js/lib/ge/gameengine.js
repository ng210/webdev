import Scene from './scene.js'

export default class GameEngine {
    #systems = []
    #renderer = null
    #scene = null

    #renderCommands = []

    #running = false
    #lastTime = 0

    constructor(renderer) {
        // add systems
        // last system is the renderer
        this.#systems.push(renderer)
        this.#renderer = renderer

        this.#scene = new Scene()

        this.#running = false
        this.#lastTime = 0

        this.loop = this.loop.bind(this)
    }

    start() {
        if (this.#running) return

        this.#running = true
        this.#lastTime = performance.now()

        for (const system of this.#systems) {
            system.init(this.#scene, this.#lastTime)
        }

        this.bindRenderPipeline()

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

        this.processInputs()
        this.update(dt)
        this.render()

        requestAnimationFrame(this.loop)
    }

    processInputs() {
        // input system hook (later externalized)
    }

    update(dt) {
        for (const system of this.#systems) {
            system.update(this.#scene, dt)
        }
    }

    render() {
        this.#renderer.beginFrame()
        this.#renderer.render(this.#scene)
        this.#renderer.endFrame()
    }

    bindRenderPipeline() {
        // IMPORTANT: compile render functions ONCE

        for (const entity of this.#scene.entities) {
            const renderable = entity.render
            if (!renderable) continue

            renderable._renderFn = this.#renderer.resolve(renderable)
        }
    }
}