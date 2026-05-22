import DistanceResolver from './distance-resolver.js'
import HtmlSprite from './html-sprite.js'

export default class SpriteMgr {
    #pool = null
    #collisionResolver = new DistanceResolver()

    constructor(count = 100, ctor = HtmlSprite, collisionResolver = new DistanceResolver()) {
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

    update(dt) {

    }

    render(dt) {

    }
}