include('webgl/webgl.js');
/****************************************************************************************
* Repository of resources
* - partitioned by resource classes (Material, Mesh, Actor, ...)
* - stores constructor of the class to create new instances
* - stores indices of a class used to accelerate queries
* - the indices array in the type definition contains those attribute names
*   of the resource class that require indexing
* - thus, indices is an object with attribute names as keys
* - an index is a map between attribute value and list of resources
*
* Example
*  actor1.meshes = ['a1-mesh1', 'a-mesh1']
*  actor2.meshes = ['a2-mesh1', 'a-mesh1']
*  actor1.materials = ['wood', 'stone'];
*  actor2.materials = ['iron', 'stone'];
*  
*  Repository.Types = {
*     "actor": {
*         "actor1": {...},
*         "actor2": {...}
*     },
*     "mesh": {
*         "a-mesh1": {...},
*         "a1-mesh1": {...},
*         "a-mesh1": {...}
*     },
*     "material": {
*         "iron": {...},
*         "stone": {...},
*         "wood": {...},
*     },
*     "processing": {
*         "blur": {...}
*     }
*  }
****************************************************************************************/
(function() {
    var Repository = {
        registerClass: function registerClass(type, ctor, indices) {
            if (type == undefined || typeof ctor !== 'function') throw new Error(`Type and constructor must be valid!`);
            if (Repository.Types[type]) throw new Error(`Type '${type} already registered!`);
            Repository.Types[type] = { type: type, ctor: ctor, indices: {} };
            for (var i=0; i<indices.length; i++) {
                Repository.Types[type].indices[indices[i]] = {};
            }
        },
    
        updateIndices: function updateIndices(type, res) {
            var indices = Repository.Types[type].indices;
            var v = res[i];
            for (var i in indices) {
                if (indices[i][v] == undefined) {
                    indices[i][v] = [];
                }
                indices[i][v].push(res)
            }
        },
    
        addResource: async function addResource(type, id, source) {
            var typeInfo = Repository.Types[type];
            if (typeInfo == undefined) throw new Error(`Resource type '${type}' is not supported!`);
            var data = source;
            if (typeof source === 'string') {
                var resource = await load(source);
                if (resource.error) {
                    throw new Error(`Could not load '${source}'!`);
                }
                data = resource.data;
            }
    
            var res = Reflect.construct(typeInfo.ctor, [id, data]);
            this[type][id] = res;
    
            this.updateIndices(type, res);
    
            return res;
        },
    
        queryResources: function queryResources(attributes, values) {
            for (var i=0; i<attributes.length; i++) {
    
            }
        },
    
        selectResources: function selectResources(type, ids) {
            var typeInfo = Repository.Types[type];
            if (typeInfo == undefined) throw new Error(`Resource type '${type}' is not supported!`);
            var set = [];
            for (var i=0; i<this.ids.length; i++) {
                set.push(type[ids[i]]);
            }
            return set;
        },
    
        Types: { }
    };

    publish(Repository, 'Repository', webGL);
})();