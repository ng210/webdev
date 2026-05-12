import Vec2 from '../math/vec2.js'

export default class Sprite {
    position = new Vec2(0, 0)
    z = 0
    size = new Vec2(0, 0)
    scale = new Vec2(0, 0)
    rotation = 0
    frame = 0

    boundingBox = [0, 0, 0, 0]
    lifeSpan = 0
    time = 0

    mass = 1
    velocity = new Vec2(0, 0)
    acceleration = new Vec2(0, 0)
    forces = []

    update(dt, ctx) {
        this.acceleration.set(0, 0)
        this.forces.forEach(f => this.acceleration.add(f))
        this.acceleration.x /= this.mass
        this.acceleration.y /= this.mass

	    // integrate
		this.velocity.x += this.acceleration.x * dt
		this.velocity.y += this.acceleration.y * dt

		this.position.x += this.velocity.x * dt
		this.position.y += this.velocity.y * dt
        this.boundingBox[0] = this.position.x
        this.boundingBox[1] = this.position.y
        this.boundingBox[2] = this.position.x + this.size.x * this.scale.x
        this.boundingBox[3] = this.position.y + this.size.y * this.scale.y
    }
}