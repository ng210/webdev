import ICollisionResolver from './icollision-resolver.js'
import Sprite from './sprite.js'

export default class SpriteMgr {
    #pool = null
    #spriteCount = 0
    #collisionResolver = null
    #spriteCtor = null

    constructor(collisionResolver, spriteCtor) {
        this.#pool = new Array()
        this.#spriteCount = 0
        this.#collisionResolver = collisionResolver
        this.#spriteCtor = spriteCtor
    }

    allocate(data) {
        const spr = this.#spriteCtor(data)
        this.#pool.push(spr)
        return spr
    }

    free(spr) {
        const ix = this.#pool.findIndex(spr)
        this.#pool.splice(ix, 1)
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