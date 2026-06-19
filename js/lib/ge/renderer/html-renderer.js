import IRenderer from "./irenderer.js"
import ImageVisual from '../systems/presentation/visuals/image-visual.js'
import TextVisual from '../systems/presentation/visuals/text-visual.js'
import RectVisual from '../systems/presentation/visuals/rect-visual.js'
// import LineVisual from '../visuals/presentation/line-visual.js'

// import ButtonVisual from '../visuals/presentation/button-visual.js'
// import TextBoxVisual from '../visuals/presentation/textbox-visual.js'
// import CheckBoxVisual from '../visuals/presentation/checkbox-visual.js'
// import ProgressBarVisual from '../visuals/presentation/progressbar-visual.js'

export default class HtmlRenderer extends IRenderer {
    #root = null
    #visualStates = new Map()
    #visualDescriptors = new Map([
        [
            ImageVisual,
            {
                tagName: 'img',
                renderMethod: this.renderImage
            }
        ],

        [
            TextVisual,
            {
                tagName: 'div',
                renderMethod: this.renderText
            }
        ],

        [
            RectVisual,
            {
                tagName: 'div',
                renderMethod: this.renderRect
            }
        ]
    ])

    constructor(rootElement) {
        super()
        this.#root = rootElement
    }

    shutdown() {
        this.#root.replaceChildren()
        this.#visualStates.clear()
    }

    beginFrame() { }

    render(visuals) {
        for (const visual of visuals) {
            const descriptor = this.#visualDescriptors.get(visual.constructor)
            if (!descriptor) {
                console.warn(`HtmlRenderer: unsupported visual ${visual.constructor.name}`)
                continue
            }
            const state = this.#getOrCreateVisualState(visual, descriptor)
            if (!visual.isVisible && !state.visible) {
                continue
            }
            descriptor.renderMethod.call(this, visual, state)
        }
    }

    endFrame() { }

    #getOrCreateVisualState(visual, descriptor) {
        let state = this.#visualStates.get(visual.id)
        if (state) {
            return state
        }

        const element = document.createElement(descriptor.tagName)
        this.#root.appendChild(element)

        state = {
            element,
            visible: !visual.isVisible
        }
        this.#visualStates.set(visual.id, state)
        return state
    }

    #applyCommonProperties(visual, state) {
        state.element.style.position = 'absolute'
        state.element.style.left = `${visual.x}px`
        state.element.style.top = `${visual.y}px`

        if (visual.isVisible !== state.visible) {
            state.element.style.display =
                visual.isVisible ? '' : 'none'

            state.visible = visual.isVisible
        }
    }

    renderImage(visual, state) {
        this.#applyCommonProperties(visual, state)
        state.element.src = visual.image
        state.element.width = visual.width
        state.element.height = visual.height
    }

    renderText(visual, state) {
        this.#applyCommonProperties(visual, state)
        state.element.textContent = visual.text
    }

    renderRect(visual, state) {
        this.#applyCommonProperties(visual, state)
        state.element.style.border = 'solid 1px black'    // color?
        state.element.style.width = `${visual.width}px`
        state.element.style.height = `${visual.height}px`
    }
}