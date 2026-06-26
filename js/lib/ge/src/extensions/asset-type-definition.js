import TypeDefinition from './type-definition.js'

export default class AssetTypeDefinition extends TypeDefinition {
    constructor(alias = '', assetType = null) {
        super(alias, assetType)
    }
}