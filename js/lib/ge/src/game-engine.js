import Scene from './scene.js'
import SystemManager from './system-manager.js'
import PresentationSystem from './systems/presentation/presentation-system.js'

export default class GameEngine {
    #renderer = null
    #scene = null
    #systemManager = null
    #presentationSystem = null

    #running = false
    #lastTime = 0

    /**
     * Creates a new game engine.
     * @param {IRenderer} renderer
     * @param {Scene} scene
     * @param {SystemManager} systemManager
     */
    constructor(renderer, scene = new Scene(), systemManager = new SystemManager()) {
        this.#renderer = renderer
        this.#scene = scene
        this.#systemManager = systemManager

        this.loop = this.loop.bind(this)
    }

    /**
     * Starts the engine.
     */
    start() {
        if (this.#running) {
            return
        }

        this.#running = true
        this.#lastTime = performance.now()

        for (const system of this.#systemManager.getAll()) {
            system.init(this.#scene, this.#lastTime)
            if (system instanceof PresentationSystem) {
                this.#presentationSystem = system
            }
        }

        if (!this.#presentationSystem) {
            console.error('PresentationSystem missing')
            return
        }

        requestAnimationFrame(this.loop)
    }

    /**
     * Stops the engine.
     */
    stop() {
        this.#running = false

        for (const system of this.#systemManager.getAll()) {
            system.shutdown(this.#scene)
        }

        this.#renderer.shutdown()
    }

    /**
     * Executes one frame of the game loop.
     * @param {number} time
     */
    loop(time) {
        if (!this.#running) {
            return
        }

        const dt = (time - this.#lastTime) / 1000
        this.#lastTime = time

        this.update(dt)
        this.render()

        requestAnimationFrame(this.loop)
    }

    /**
     * Updates all systems.
     * @param {number} dt
     */
    update(dt) {
        for (const system of this.#systemManager.getAll()) {
            system.update(this.#scene, dt)
        }
    }

    /**
     * Renders the current frame.
     */
    render() {
        this.#renderer.beginFrame()
        this.#renderer.render(this.#presentationSystem.visuals)
        this.#renderer.endFrame()
    }
}