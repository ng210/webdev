import TypeDefinition from './type-definition.js'

export default class SystemTypeDefinition extends TypeDefinition {
    featureType = null

    constructor(alias = '', systemType = null, featureType = null) {
        super(alias, systemType)
        this.featureType = featureType
    }
}