export default class IRenderer {
    init() {
        throw new Error('Not implemented')
    }

    shutdown() {
        throw new Error('Not implemented')
    }

    beginFrame() {
        throw new Error('Not implemented')
    }

    render(commands) {
        throw new Error('Not implemented')
    }

    endFrame() {
        throw new Error('Not implemented')
    }
}