import ISystem from "./isystem.js"

export default class IRenderer extends ISystem {
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