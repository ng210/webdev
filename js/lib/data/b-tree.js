include('/lib/data/graph.js');
(function() {
    function BTreeNode(id, parent, tree, size) {
        BTreeNode.base.constructor.call(this, id, parent, new Array(size));
        this.tree = tree;
        this.isLeaf = false;
        this.size = size;
        this.length = 0;
    }
    extend(Graph.Vertex, BTreeNode);
    // Object.defineProperty(BTreeNode.prototype, 'length', {
    //     get: function() {
    //         return this.length_;
    //     },
    //     set: function(v) {
    //         this.length_ = v;
    //         var count = this.data.reduce((acc, v) => v != null ? acc+1 : acc, 0);
    //         if (this.length_ > count) {
    //             console.log(`#${this.id}: ${this.length_} - ${count}  ${this.data.map((x,i) => x != null ? x.id : '-')}`);
    //             var stack = new Error().stack.split('\n').slice(2,4);
    //             console.log(stack.join('\n'));
    //         }
    //     }
    // });

    BTreeNode.prototype.add = function add(obj, index) {
        if (obj != undefined && this.length < this.size) {
            if (index == undefined) {
                index = this.length;
            }
            for (var i=this.length-1;i>=index;i--) this.data[i+1] = this.data[i];
            this.data[index] = obj;
            this.length++;
        }
        return this;
    };
    BTreeNode.prototype.addRange = function add(arr, index, start, count) {
        start = start || 0;
        end = count ? start + count : arr.length;
        for (var i=start; i<end; i++) {
            this.add(arr[i], index);
            if (index != undefined) index++;
        }
        return this;
    };
    
    function BTree(degree, pageSize, compare) {
        BTree.base.constructor.call(this);
        this.degree = degree;
        this.pageSize = pageSize;
        this.compare = typeof compare === 'function' ? { method:compare, context: this} : compare;
        this.count = 0;
        this.lastResult = { node: null, index: 0, path:null};
    }
    extend(Graph, BTree);

    BTree.prototype.maxHeight = function maxHeight() {
        var a = Math.ceil(this.degree/2);
        var b = Math.ceil(this.pageSize/2);
        var s = 1 + (this.vertices.length + 2*b)/(1/a + b);
        return Math.ceil(Math.log2(s)/Math.log2(a));
    };

    BTree.prototype.createVertex = function createVertex(obj, parent, isLeaf) {
        var id = this.vertices.length;
        var size = isLeaf ? this.pageSize : this.degree;
        var node = new BTreeNode(id, parent, this, size);
        node.isLeaf = isLeaf == true;
        if (!this.root) {
            this.root = node;
        }
        this.vertices.push(node);
        if (obj != null) node.add(obj);
        return node;
    };
    BTree.prototype.addEdge = function addEdge(from, to, data) {
        to.parent = from;
        return BTree.base.addEdge.call(this, from, to, data);
    };
    BTree.prototype.tryGet = function tryGet(item, result) {
        var node = this.root;
        result = result || this.lastResult;
        result.node = null;
        result.index = -1;
        result.path = [];
        while (node) {
            if (node.isLeaf) {
                // a leaf node storing data
                result.node = node;
                result.index = node.data.binSearch(item, this.compare);
                result.path.push(result.index);
                break;
            } else {
                // index node storing navigation info
                var edge = node.edges[node.length];
                var ei = 0;
                for (; ei<node.length; ei++) {
                    var c = this.compare.method.call(this.compare.context, item, node.data[ei]);
                    if (c < 0) {
                        edge = node.edges[ei];
                        break;
                    } if (c == 0) {
                        result.node = node;
                        result.index = ei;
                        break
                    }
                }
                result.path.push(ei);
                if (result.node) break;
                if (!edge) debugger;
                node = edge.to;
            }
        }
        this.lastResult.node = result.node;
        this.lastResult.index = result.index;
        this.lastResult.path = Array.from(result.path);
        return result.index >= 0;
    };
    BTree.prototype.first = function first() {
        var item = null;
        this.lastResult.node = this.root;
        this.lastResult.path = [];
        if (this.lastResult.node) {
            while (!this.lastResult.node.isLeaf) {
                // drill down to the left-most leaf
                this.lastResult.node = this.lastResult.node.edges[0].to;
                this.lastResult.path.push(0);
            }
            this.lastResult.index = 0;
            this.lastResult.path.push(0);
            item = this.lastResult.node.data[0];
        }
        return item;
    };
    BTree.prototype.next = function next(result) {
        var item = null;
        result = result || this.lastResult;
        var node = result.node;
        if (node) {
            var ix = ++result.index;
            if (node.isLeaf) {
                if (ix < node.length) {
                    item = node.data[ix];
                } else {
                    // get first leaf from right
                    var pn = node.parent;
                    while (pn) {
                        ix = 0;
                        while (ix <= pn.length && pn.edges[ix].to != node) ix++;
                        if (ix < pn.length) {
                            item = pn.data[ix];
                            result.node = pn.edges[ix+1].to;
                            result.index = -1;
                            break;
                        }
                        node = pn;
                        pn = pn.parent;
                    }
                }
            } else {
                result.node = node.edges[ix].to;
                while (!result.node.isLeaf) {
                    // drill down to left-most leaf
                    result.node = result.node.edges[0].to;
                }
                result.index = 0;
                item = result.node.data[0];
            }
        }
        return item;
    };
    BTree.prototype.add = function add(item) {
        var result = {};
        if (!this.tryGet(item, result)) {
            result = this.insertAt(item, result.node, -result.index-1);
            this.count++;
        }
        return result;
    };
    BTree.prototype.insertAt = function insertAt(item, nodeA, index, nodeC) {
        if (!nodeA) {
            // add root
            var root = this.root;
            nodeA = this.createVertex(null, null, root == null);
            if (root) {
                nodeA.add(item, 0);
                this.addEdge(nodeA, root, 0);
                if (nodeC) {
                    this.addEdge(nodeA, nodeC, 1);
                    nodeC.parent = nodeA;
                }
                root.parent = nodeA;
                this.root = nodeA;
                return { node:nodeA, index:0};
            }
        }
        var result = { node:nodeA, index:0};
        if (nodeA.length < nodeA.size) {
            // add item to node
            nodeA.add(item, index);
            if (nodeC) {
                // insert edge at index+1
                var ix = index+1;
                for (var i=nodeA.length; i>ix; i--) nodeA.edges[i] = nodeA.edges[i-1];
                nodeA.edges[ix] = this.createEdge(nodeA, nodeC);                
                nodeC.parent = nodeA;
            }
        } else {
            // split node
            var nodeB = this.createVertex(null, nodeA.parent, nodeA.isLeaf);
            var keys = new Array(nodeA.size+1);
            var edges = new Array(nodeA.size+1);
            for (var i=0; i<index; i++) keys[i] = nodeA.data[i];
            keys[index] = item;
            for (var i=index; i<nodeA.length; i++) keys[i+1] = nodeA.data[i];

            if (!nodeA.isLeaf) {
                // if index == 0 then edge[0] = createEdge, edge[1..n+1] = node.edges[0..n]
                // else edge[0..index] = node.edge[0..index], edge[index+1] = createEdge, edge[index+2..n] = node.edge[index+1..n]
                var ei = 0, ix = index+1;
                for (var i=0; i<ix; i++) edges[ei++] = nodeA.edges[i];
                edges[ei] = this.createEdge(nodeA, nodeC, ei); ei++;
                for (var i=ix; i<=nodeA.length; i++) edges[ei++] = nodeA.edges[i];
            }
// if (nodeA.isLeaf) console.log(keys.map(x => x.id));
// else console.log(edges.map((x,i) => `${i<keys.length ? keys[i].id : '-'}: ${x ? x.from.id+'=>'+x.to.id : '-'}`));
            var lengthA = Math.ceil(nodeA.size/2);
            var lengthB = nodeA.size - lengthA;
            var j = 0;
            for (var i=0; i<lengthA; i++) nodeA.data[i] = keys[j++];
            for (var i=lengthA; i<nodeA.size; i++) nodeA.data[i] = null;
            j++;
            for (var i=0; i<lengthB; i++) nodeB.data[i] = keys[j++];
            for (var i=lengthB; i<nodeB.size; i++) nodeB.data[i] = null;
            if (!nodeA.isLeaf) {
                j = 0;
                for (var i=0; i<=lengthA; i++) nodeA.edges[i] = edges[j++];
                for (var i=lengthA+1; i<lengthA+1; i++) nodeA.edges[i] = null;
                for (var i=0; i<=lengthB; i++) {
                    var edge = edges[j++];
                    nodeB.edges[i] = edge;
                    if (edge) {
                        edge.from = nodeB;
                        edge.to.parent = nodeB;
                    }
                }
                for (var i=lengthB+1; i<nodeB.size+1; i++) nodeB.edges[i] = null;
            }
            nodeA.length = lengthA;
            nodeB.length = lengthB;
// if (nodeA.isLeaf) {
//     console.log(nodeA.id, nodeA.data.map((x,i) => i<nodeA.length ? x.id : '-'));
//     console.log(nodeB.id, nodeB.data.map((x,i) => i<nodeB.length ? x.id : '-'));
// } else {
//     console.log(nodeA.id, nodeA.edges.map((x,i) => i<nodeA.length+1 ? `${i<nodeA.length ? nodeA.data[i].id : '-'}: ${x.from.id}=>${x.to.id}` : ''));
//     console.log(nodeB.id, nodeB.edges.map((x,i) => i<nodeB.length+1 ? `${i<nodeB.length ? nodeB.data[i].id : '-'}: ${x.from.id}=>${x.to.id}` : ''));
// }
            var ix = 0;
            var mid = keys[lengthA];
            if (nodeA.parent) {
                ix = nodeA.parent.data.binSearch(mid, this.compare);
                ix = -ix-1;
            }
            result = this.insertAt(mid, nodeA.parent, ix, nodeB);
        }
        return result;
    };
    BTree.prototype.range = function range(from, to, action, args) {
        var start = {};
        if (!this.tryGet(from, start)) start.index = -start.index-1;
        // build array simulating DFS traverse info at start.node
        var remaining = new Array(2*this.degree*this.maxHeight());
        var crs = 2*start.path.length-2;
        var node = start.node;
        for (var i=start.path.length-1; i>=0; i--) {
            remaining[2*i] = node;
            // index of next edge
            remaining[2*i+1] = start.path[i] + 1;
            node = node.parent;
        }
        // index of leaf must not be changed
        if (remaining[crs].isLeaf) remaining[crs+1]--;
        var isDone = false;
        while (!isDone && crs >= 0) {
            var node = remaining[crs];
            var index = remaining[crs+1];
            if (node.isLeaf) {
                for (var i=index; i<node.length; i++) {
                    var item = node.data[i];
                    if ((isDone = to && this.compare.method.call(this.compare.context, item, to) > 0 || action(item, i, args)) == true) break;
                }
            } else {
                remaining[crs+1]++;     // increase edge index
                if (index <= node.length) {
                    if (index > 0) {
                        var item = node.data[index-1];
                        if ((isDone = to && this.compare.method.call(this.compare.context, item, to) > 0 || action(item, index-1, args)) == true) break;
                    }
                    var edge = node.edges[index];
                    crs += 2;
                    remaining[crs] = edge.to;
                    remaining[crs+1] = 0;
                    continue;
                }
            }
            crs -= 2;
        }
    };

    publish(BTree, 'BTree');
})();