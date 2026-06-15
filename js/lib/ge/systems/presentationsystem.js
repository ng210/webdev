class PresentationSystem extends ISystem {
    #allPresentations = []
    #activePresentations = []

    addPresentation(entity) {}

    // RenderCommands
    createActorCommands(actor) {}

    createButtonCommands(button) {}

    createLabelCommands(label) {}

    createRectCommands(rect) {}

    // inherited from ISystem
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