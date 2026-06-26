import IExtension from './iextension.js'
import SystemTypeDefinition from './system-type-definition.js'
import PresentationSystem from '../systems/presentation-system.js'
import PresentationFeature from '../features/presentation-feature.js'

export default class PresentationExtension extends IExtension {
    getDefinitions() {
        return [
            new SystemTypeDefinition('presentation', PresentationSystem, PresentationFeature)
        ]
    }
}