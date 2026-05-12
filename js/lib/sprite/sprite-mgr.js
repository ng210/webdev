import Sprite from './sprite.js'
import DistanceResolver from './distance-resolver.js'
import HtmlRenderer from './html-renderer.js'

export default class SpriteMgr {
    #pool = null
    #collisionResolver = new DistanceResolver()

    constructor(count = 100) {
        this.#pool = new Array(count)
    }

    allocate() {

    }

    free(spr) {

    }

    get(ix) {
        return this.#pool[ix] || null
    }

    checkCollision() {
        // broad phase

        // narrow phase
    }

    render() {

    }
}