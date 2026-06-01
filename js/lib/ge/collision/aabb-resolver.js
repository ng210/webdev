import ICollisionResolver from './icollision-resolver.js'

export default class AABBResolver extends ICollisionResolver {
    checkCollision(sprA, sprB) {
        
    }

    resolveCollision(info) {
        throw new Error('Not implemented!')
    }
}