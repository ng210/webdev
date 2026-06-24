import TypeDefinition from './type-definition.js'

export default class SystemTypeDefinition extends TypeDefinition {
    systemType = null
    featureType = null

    constructor(alias = '', systemType = null, featureType = null) {
        super(alias)
        this.systemType = systemType
        this.featureType = featureType
    }
}