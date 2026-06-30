import Test from '../../test/test.js'
import SystemManager from '../src/system-manager.js'
import PresentationSystem from '../src/systems/presentation/presentation-system.js'
import PresentationExtension from '../src/extensions/built-in/presentation-extension.js'
import SystemTypeDefinition from '../src/extensions/system-type-definition.js'

export default class GameEngineTests extends Test {
    systemManager = null

    /**
     * Creates a fresh test environment.
     */
    setup() {
        this.systemManager = new SystemManager()
    }

    /**
     * Cleans up the test environment.
     */
    teardown() {
        this.systemManager = null
    }

    /**
     * Tests creating a SystemManager instance.
     */
    testCreateSystemManager() {
        const manager = new SystemManager()
        this.isNotNull('SystemManager instance created', manager)
        this.isTrue('Created object is a SystemManager', manager instanceof SystemManager)
    }

    /**
     * Tests registering a system type.
     */
    testRegisterSystemType() {
        const extension = new PresentationExtension()
        let definition = null
        for (const def of extension.getDefinitions()) {
            if (def instanceof SystemTypeDefinition) {
                definition = def
                break
            }
        }

        this.isNotNull('Presentation system type found', definition)
        this.systemManager.registerType(definition)

        this.isTrue('Presentation system type registered', this.systemManager.hasType(definition.alias))
    }

    // /**
    //  * Tests looking up a registered system type.
    //  */
    // testLookupSystemType() {
    //     const extension = new PresentationExtension()

    //     let definition = null

    //     for (const def of extension.getDefinitions()) {
    //         if (def instanceof SystemTypeDefinition) {
    //             definition = def
    //             break
    //         }
    //     }

    //     this.systemManager.registerType(definition)

    //     const lookup =
    //         this.systemManager.getType(definition.alias)

    //     this.isEqual(
    //         'Lookup returns registered definition',
    //         lookup,
    //         definition)
    // }

    // /**
    //  * Tests creating a PresentationSystem instance.
    //  */
    // testCreatePresentationSystem() {
    //     const system = new PresentationSystem()

    //     this.isNotNull(
    //         'PresentationSystem created',
    //         system)

    //     this.isTrue(
    //         'Created object is a PresentationSystem',
    //         system instanceof PresentationSystem)
    // }

    // /**
    //  * Tests registering a runtime system.
    //  */
    // testRegisterPresentationSystem() {
    //     const system = new PresentationSystem()

    //     this.systemManager.add(system)

    //     this.isTrue(
    //         'PresentationSystem registered',
    //         this.systemManager.has(PresentationSystem))
    // }

    // /**
    //  * Tests looking up a registered runtime system.
    //  */
    // testLookupPresentationSystem() {
    //     const system = new PresentationSystem()

    //     this.systemManager.add(system)

    //     const lookup =
    //         this.systemManager.get(PresentationSystem)

    //     this.isEqual(
    //         'Lookup returns registered PresentationSystem',
    //         lookup,
    //         system)
    // }
}