import Vec2 from '../../math/vec2.js'

export default class Actor {
    #lifeSpan = 0
    #time = 0

    mass = 1
    #position = new Vec2(0, 0)
    #velocity = new Vec2(0, 0)
    #acceleration = new Vec2(0, 0)
    #forces = []

    #renderer = null
    #constraints = []

    constructor(renderer, collider) {
    }

    addForce(f) {
        this.#forces.push(f)
    }

    update(dt) {
        this.#acceleration.set(0, 0)
        for (const f in this.#forces) {
            this.#acceleration.add(f)
            // vagy
            // this.#acceleration.add(f())
        }
        this.#acceleration.descale(this.mass)
        this.#velocity.inc(this.#acceleration.x.scale(dt))
        this.#position.inc(this.#velocity.x.scale(dt))
    }

    render(dt) {
        this.#renderer.render(this)
    }
} 