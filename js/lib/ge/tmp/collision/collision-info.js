export default class CollisionInfo {
    isCollision = false

    // Minimum translation to resolve overlap (apply to e1)
    correction = { x: 0, y: 0 }

    // Surface normal pointing *out of e2*, relative to e1
    // One of: (-1,0), (1,0), (0,-1), (0,1)
    normal = { x: 0, y: 0 }

    // Multiplier for velocity components of e1
    // 0 = stop, -1 = reflect, 1 = unchanged
    velocityMask = { x: 1, y: 1 }

    constructor(dx, dy) {
        this.isCollision = dx > 0 && dy > 0
        this.correction.x = dx
        this.correction.y = dy
        this.normal.x = Math.sign(dx)
        this.normal.y = Math.sign(dy)
    }

}