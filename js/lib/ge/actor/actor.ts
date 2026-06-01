import Vec2 from '../../math/vec2.js'

export default class Actor {
    #lifeSpan:number = 0
    #time:number = 0

    mass:number = 1
    #position:Vec2 = new Vec2(0, 0)
    #velocity:Vec2 = new Vec2(0, 0)
    #acceleration:Vec2 = new Vec2(0, 0)
    #forces:[Object?] = []

    #renderer = null
    #constraints = []

    constructor() {
    }

    addForce(f:Object) {
        this.#forces.push(f)
    }

    update(dt:number) {
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

    render(dt:number) {
        this.#renderer.render(this)
    }
} 