import Vec2 from '../math/vec2.js'
import Vec3 from '../math/vec3.js'

export default class Sprite {
    position = new Vec3(0, 0, 0)
    size = new Vec2(0, 0)
    scale = new Vec2(0, 0)
    rotation = 0
    frame = 0

    // collision
    boundingBox = [0, 0, 0, 0]

    // actor
    lifeSpan = 0
    time = 0

    mass = 1
    velocity = new Vec2(0, 0, 0)
    acceleration = new Vec2(0, 0, 0)
    forces = []

    render() {
        throw new Error('Not implemented!')
    }

    update(dt, ctx) {
        this.acceleration.set(0, 0, 0)
        this.forces.forEach(f => this.acceleration.add(f))
        this.acceleration.x /= this.mass
        this.acceleration.y /= this.mass

	    // integrate
		this.velocity.x += this.acceleration.x * dt
		this.velocity.y += this.acceleration.y * dt

		this.position.x += this.velocity.x * dt
		this.position.y += this.velocity.y * dt
        this.updateBoundingBox()
    }

    updateBoundingBox() {
        this.boundingBox[0] = this.position.x
        this.boundingBox[1] = this.position.y
        this.boundingBox[2] = this.position.x + this.size.x * this.scale.x
        this.boundingBox[3] = this.position.y + this.size.y * this.scale.y
    }
}