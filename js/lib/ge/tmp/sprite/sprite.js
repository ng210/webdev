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

    render() {
        throw new Error('Not implemented!')
    }

    updateBoundingBox() {
        this.boundingBox[0] = this.position.x
        this.boundingBox[1] = this.position.y
        this.boundingBox[2] = this.position.x + this.size.x * this.scale.x
        this.boundingBox[3] = this.position.y + this.size.y * this.scale.y
    }
}