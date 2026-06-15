export default class ISystem {
    init(scene, timeStamp) {
        throw new Error('Not implemented!')
    }

    update(scene, dt) {
        throw new Error('Not implemented!')
    }

    shutdown(scene) {
        throw new Error('Not implemented!')
    }
}

// Examples:
//  InputSystem
//  PhysicsSystem
//  CollisionSystem
//  AnimationSystem
//  SoundSystem
//  PresentationSystem
//  CanvasRenderer
//  WebGLRenderer
//  DomRenderer