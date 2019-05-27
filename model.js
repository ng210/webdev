/******************************************************************************
 * 
 * Implementation of the search functionality
 * 
 *****************************************************************************/
(function() {
    module.exports = {
        data: null,
        types: null,
        index: null,
        _addType: function(list, typeName) {
            // add type name to items in the list
            for (var i in this.data[list]) {
                this.data[list][i]._type = typeName;
            }
        },
        _createMap: function(list) {
            // create a map UUID => item to accelerate search
            for (var i in this.data[list]) {
                var item = this.data[list][i];
                // UUID has to be unique
                if (this.index[item.id]) {
                    console.log('Ambiguity found!');
                }
                this.index[item.id] = item;
            }
        },
        _resolve: function(list, parentType, ref) {
            // resolve references via UUID
            for (var i in this.data[list]) {
                var item = this.data[list][i];
                type = item._type;
                // parent item is referenced by a dedicated attribute (ref)
                // fetch parent item from the index by UUID
                var parentItem = this.index[item[ref]];
                if (parentItem != undefined) {
                    // parent item has a cache of its children
                    if (parentItem.children == undefined) {
                        parentItem.children = {};
                    }
                    // children are stored by their type
                    if (parentItem.children[type] == undefined) {
                        parentItem.children[type] = [];
                    }
                    parentItem.children[type].push(item);
                    // item receives a link/relation to its parent
                    // the relation has 1 attribute: weights
                    item.parentLink = {
                        parent: parentItem,
                        weights: this.types[type][ref].weights
                    };
                } else {
                    // bad reference
                    console.log(`Could not resolve ${list}.${ref}=${item[ref]}!`);
                }
            }
        },
        prepare: function() {
            // load data
            this.data = require('./sv_lsm_data.json'),
            this.types = require('./resource-types.json'),
            this.index = {};

            // Prepare data
            // - index: map from UUID to object
            // - resolve references (UUID)

            // add type info
            this._addType('buildings', 'Building');
            this._addType('locks', 'Lock');
            this._addType('groups', 'Group');
            this._addType('media', 'Medium');

            // create maps
            this._createMap('buildings');
            this._createMap('locks');
            this._createMap('groups');
            this._createMap('media');

            // resolve UUIDs
            this._resolve('locks', 'Building', 'buildingId');
            this._resolve('media', 'Group', 'groupId');
            console.log('Data preparation done.');
        },
        search: function(expression) {
            // create the response object
            var results = { error:null, data: [] };
            // the search expression can consist of more words
            // seperated by white space
            var tokens = expression.split(' ');
            var hits = {};

            // search in data
            for (var t in this.data) {
                var items = this.data[t];
                console.log(`Searching in ${items.length} ${t}...`);
                for (var j in items) {
                    var item = items[j];
                    var type = item._type;
                    // weight is summed for every searched token
                    var totalWeight = 0;
                    for (var key in item) {
                        var attribute = item[key];
                        // only check the string attributes of the item
                        if (typeof attribute === 'string') {
                            for (var ti in tokens) {
                                var token = tokens[ti];
                                if (token) {
                                    var hit = attribute.indexOf(token);
                                    if (hit != -1) {
                                        // we found a match, get own weight
                                        var ownWeight = this.types[type][key].weights._default || 0;
                                        // calculate factor depending on match type: partial match 1, full match 10
                                        var factor = attribute.length == token.length ? 10 : 1;
                                        // sum total weight
                                        totalWeight += factor*ownWeight;
                                        console.log(`Hit: ${t}.${key}="${attribute}" ${factor == 1 ? '' : 'fully '}matches "${token}"`);
                                        // check children for transient weighting
                                        if (item.children) {
                                            // children are stored by type
                                            for (var childTypeName in item.children) {
                                                var children = item.children[childTypeName];
                                                var childType = this.types[childTypeName];
                                                // type of child has to be valid
                                                if (childType) {
                                                    // iterate through children
                                                    for (var ci in children) {
                                                        var childItem = children[ci];
                                                        var transWeight = childItem.parentLink.weights[key];
                                                        if (transWeight > 0) {
                                                            // add a new search hit
                                                            if (hits[childItem.id] == undefined) {
                                                                hits[childItem.id] = 0;
                                                            }
                                                            hits[childItem.id] += factor*transWeight;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (totalWeight > 0) {
                        if (hits[item.id] == undefined) {
                            hits[item.id] = 0;
                        }
                        hits[item.id] += totalWeight;
                    }
                }
            }
            for (var i in hits) {
                var item = this.index[i];
                results.data.push({resource:item._type, id:item.id, name:item.name, description:item.description, weight:hits[i]});
                console.log(`Added ${item._type}.${item.name} with weight ${hits[i]}`);

            }
            results.data.sort((a, b) => b.weight - a.weight);

            return JSON.stringify(results);
        }
    };
})();