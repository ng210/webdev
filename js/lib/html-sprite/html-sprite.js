import Sprite from './sprite.js'

export default class HtmlSprite extends Sprite {
    #div = null
    constructor() {
        super()
        // create div
        this.#div = document.createElement('div')
        this.#div.className = 'sprite'
        this.#div.style.position = 'absolute'
        this.#div.style.backgroundImage = `url()`
    }

    render(ctx) {
        if (!this.#div.parentNode) {
            ctx.appendChild(this.#div)
        }
        // update div
        this.#div.style.backgroundPosition = '0px 0px'
        this.#div.style.left = this.position.x + 'px'
        this.#div.style.top = this.position.y + 'px'
        this.#div.style.transform = `scale(${this.scale.x}, ${this.scale.y})`
    }
}