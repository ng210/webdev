import TypeDefinition from './type-definition.js'

export default class AssetTypeDefinition extends TypeDefinition {
    assetType = null

    constructor(alias = '', assetType = null) {
        super(alias)
        this.assetType = assetType
    }
}