import IRenderer from "./irenderer.js"
import ImageVisual from '../visuals/presentation/imagevisual.js'
import TextVisual from '../visuals/presentation/textvisual.js'
import RectVisual from '../visuals/presentation/rectvisual.js'
// import LineVisual from '../visuals/presentation/linevisual.js'

// import ButtonVisual from '../visuals/presentation/buttonvisual.js'
// import TextBoxVisual from '../visuals/presentation/textboxvisual.js'
// import CheckBoxVisual from '../visuals/presentation/checkboxvisual.js'
// import ProgressBarVisual from '../visuals/presentation/progressbarvisual.js'

export default class HtmlRenderer extends IRenderer {
    #root = null
    #elements = new Map()
    #renderMethods = new Map([
        [ImageVisual, this.renderImage],
        [TextVisual, this.renderText],
        [RectVisual, this.renderRect]
    ])

    constructor(rootElement) {
        super()
        this.#root = rootElement
    }

    init() {
    }

    shutdown() {
        this.#root.replaceChildren()
    }

    beginFrame() {
        throw new Error('Not implemented')
    }

    render(visuals) {
        for (const visual of visuals) {

            if (!visual.isVisible) {
                continue
            }

            const renderMethod = this.#renderMethods.get(visual.constructor)
            if (!renderMethod) {
                console.warn(`HtmlRenderer: unsupported visual ${visual.constructor.name}`)
                continue
            }

            renderMethod.call(this, visual)
        }
    }

    endFrame() {
        throw new Error('Not implemented')
    }

    #getOrCreateElement(id, tagName) {
        let element = this.#elements.get(id)
        if (!element) {
            element = document.createElement(tagName)
            this.#elements.set(id, element)
            this.#root.appendChild(element)
        }

        return element
    }

    applyPosition(element, visual) {
        element.style.position = 'absolute'
        element.style.left = `${visual.x}px`
        element.style.top = `${visual.y}px`
        element.style.display = visual.isVisible ? '' : 'none'
    }

    renderImage(visual) {
        const element = this.#getOrCreateElement(visual.id, 'img')
        element.src = visual.image
        this.applyPosition(element, visual)
        element.width = visual.width
        element.height = visual.height
    }

    renderText(visual) {
        const element = this.#getOrCreateElement(visual.id, 'div')
        element.textContent = visual.text
        this.applyPosition(element, visual)
    }

    renderRect(visual) {
        const element = this.#getOrCreateElement(visual.id, 'div')
        this.applyPosition(element, visual)
        element.style.border = 'solid 1px black'    // color?
        element.width = visual.width
        element.height = visual.height
    }
}