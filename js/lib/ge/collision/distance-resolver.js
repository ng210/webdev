import ICollisionResolver from './icollision-resolver.js'

export default class DistanceResolver extends ICollisionResolver {
    checkCollision(sprA, sprB) {
        // get center and "radius" for both sprite
        const cA = sprA.center
        const cB = sprB.center
        const rA = Math.min(sprA.width, sprA.height)
        const rB = Math.min(sprB.width, sprB.height)
        return new CollisionInfo(
                (rA + rB) - Math.abs(cA.x - cB.x),
                (rA + rB) - Math.abs(cA.y - cB.y)
            )
    }

    resolveCollision(info) {
        throw new Error('Not implemented!')
    }
}