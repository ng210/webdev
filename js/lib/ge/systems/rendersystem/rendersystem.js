import ISystem from '../isystem.js'

// “frame ownership” model
// beginFrame()
// submitCommand()
// endFrame()

export default class RenderSystem extends ISystem {
    // RenderSystem owns renderCommands
    // PresentationSystem writes via API
    // Renderer reads only
    #renderCommands = []

    addCommand(cmd) {
        this.#renderCommands.push(cmd)
    }

    clear() {
        this.#renderCommands.length = 0
    }

    getCommands() {
        return this.#renderCommands
    }

    // inherited by ISystem
    init(scene) {
        throw new Error('Not implemented!')
    }
    beginFrame() {
        throw new Error('Not implemented!')
    }
    render(scene) {
        throw new Error('Not implemented!')
    }
    endFrame() {
        throw new Error('Not implemented!')
    }
    shutdown() {
        throw new Error('Not implemented!')
    }

    get renderMethods() {
        throw new Error('Not implemented!')
    }
}