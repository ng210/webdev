export default class IRenderer {
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