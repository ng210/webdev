include('/webgl/webgl.js');
// ********************************************************************************************
// 	Repository
// 	{
// 		"actor": {
// 			"actor1": {...},
// 			"actor2": {...}
// 		},
// 		"mesh": {
// 			"actor1-mesh1": {...},
// 			"actor1-mesh2": {...},
// 			"actor2-mesh1": {...}
// 		},
// 		"material": {
// 			"actor1-material1": {...},
// 			"actor1-material2": {...},
// 		},
// 		"processing": {
// 			"blur": {...}
// 		}
// 	}
// ********************************************************************************************
(function() {
    function Repository() {
        this.actor = {};
        this.mesh = {};
        this.material = {};
        this.processing = {};
    }

    Repository.registerClass = function registerClass(id, ctor) {
        if (Repository.Types[id]) throw new Error(`Type '${id} already registered!`);
        Repository.Types[id] = { id: id, ctor: ctor };
    }

    Repository.prototype.addResource = async function addResource(type, id, source) {
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

        return this[type][id] = Reflect.construct(typeInfo.ctor, [id, data]);
    };

    Repository.prototype.selectResources = function selectResources(type, ids) {
        var typeInfo = Repository.Types[type];
        if (typeInfo == undefined) throw new Error(`Resource type '${type}' is not supported!`);
        var set = [];
        for (var i=0; i<this.ids.length; i++) {
            set.push(type[ids[i]]);
        }
        return set;
    };

    Repository.Types = { };


    public(Repository, 'Repository', webGL);
})();