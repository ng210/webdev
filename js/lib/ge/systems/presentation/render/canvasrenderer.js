import RenderSystem from "./rendersystem.js"

export default class CanvasRenderer extends RenderSystem {
    #renderMethods = [
        
    ]

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
        return this.#renderMethods
    }


    drawSprite(component, ctx) {
        // canvas drawImage logic
    }

    drawText(component, ctx) {
        // canvas text rendering
    }
}