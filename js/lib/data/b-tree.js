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
    BTreeNode.prototype.remove = function remove(index) {
        var obj = null;
        if (index < this.length) {
            obj = this.data[index];
            this.length--;
            for (var i=index;i<this.length;i++) this.data[i] = this.data[i+1];
            this.data[this.length] = null;

            if (this.tree.root != this && this.length < Math.ceil(this.size/2)) {
                this.tree.rebalance(this);
            }
        }
        return obj;
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
                    // get first item from right
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
                nodeA.edges.splice(index+1, 0, this.createEdge(nodeA, nodeC));
                nodeC.parent = nodeA;
            }
        } else {
            // split node
            var nodeB = this.createVertex(null, nodeA.parent, nodeA.isLeaf);
            var keys = Array.from(nodeA.data); keys.splice(index, 0, item);
            var edges = null;
            if (!nodeA.isLeaf) {
                // insert edge at index+1
                edges = Array.from(nodeA.edges); edges.splice(index+1, 0, this.createEdge(nodeA, nodeC, index+1));
            } else {
                edges = new Array(nodeA.size+1);
            }

            var lengthA = Math.ceil(nodeA.size/2), lengthB = nodeA.size - lengthA;
            var j = 0;
            // distribute keys between the 2 nodes
            for (var i=0; i<lengthA; i++) nodeA.data[i] = keys[j++];
            for (var i=lengthA; i<nodeA.size; i++) nodeA.data[i] = null;
            j++;    // skip middle key
            for (var i=0; i<lengthB; i++) nodeB.data[i] = keys[j++];
            for (var i=lengthB; i<nodeB.size; i++) nodeB.data[i] = null;
            if (!nodeA.isLeaf) {
                j = 0;
                // distribute edges between the 2 nodes
                for (var i=0; i<=lengthA; i++) nodeA.edges[i] = edges[j++];
                for (var i=lengthA+1; i<nodeA.size+1; i++) nodeA.edges[i] = null;
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
            nodeA.length = lengthA, nodeB.length = lengthB;
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
    BTree.prototype.remove = function remove(item) {
        var obj = null;
        var result = {};
        if (this.tryGet(item, result)) {
            obj = this.removeAt(result.node, result.index);
            this.count--;
        }
        return obj;
    };
    BTree.prototype.removeAt = function removeAt(nodeA, index) {
        var obj = null;
        if (!nodeA.isLeaf) {
            obj = nodeA.data[index];
            // move last item of child
            var nodeB = nodeA.edges[index].to;
            while (!nodeB.isLeaf) {
                nodeB = nodeB.edges[nodeB.length].to;
            }
            nodeA.data[index] = nodeB.remove(nodeB.length-1);
        } else {
            obj = nodeA.remove(index);
        }
        return obj;
    };
    BTree.prototype.rebalance = function rebalance(node) {
        var parent = node.parent;
        var ei = parent.edges.findIndex(x => x.to == node);
        var left = ei > 0 ? parent.edges[ei-1].to : null;
        var right = ei < parent.length ? parent.edges[ei+1].to : null;
        if (left && left.length > Math.ceil(left.size/2)) {
            this.rotateRight(node, parent, ei, left);
        } else if (right && right.length > Math.ceil(right.size/2)) {
            this.rotateLeft(node, parent, ei, right);
        } else {
            if (left) {
                this.mergeLeft(left, parent, ei-1, node);
            } else if (right) {
                this.mergeRight(right, parent, ei, node);
            } else throw new Error('Could not process node ' + node.id);
            if (parent.length < Math.ceil(parent.size/2)) {
                this.rebalance(parent);
            }
        }
    };
    BTree.prototype.rotateLeft = function rotateLeft(node, parent, ei, right) {
        // move parent key to the end of node
        node.data[node.length] = parent.data[ei];
        node.length++;
        // move 1st key of right into parent
        parent.data[ei] = right.data[0];
        // shift keys of right to the left
        for (var i=1; i<right.length; i++) right.data[i-1] = right.data[i];
        right.data[right.length-1] = null;
        if (!right.isLeaf) {
            // shift edges of right to the left
            for (var i=1; i<right.length+1; i++) right.edges[i-1] = right.edges[i];
            right.edges[right.length] = null;
            // move 1st edge of right to end of node
            var edge = right.edges[0];
            edge.from = node;
            node.edges[node.length+1] = edge;
        }        
        right.length--;
    };
    BTree.prototype.rotateRight = function rotateRight(node, parent, ei, left) {
        // shift keys and edges of node to the right
        for (var i=node.length; i>0; i--) node.data[i] = node.data[i-1];
        if (!node.isLeaf) {
            // shift edges of node to the right
            for (var i=node.length+1; i>0; i--) node.edges[i] = node.edges[i-1];
            // move last edge of left to head of node
            var edge = left.edges[left.length+1];
            edge.from = node;
            node.edges[0] = edge;
            left.edges[left.length+1] = null;
        }
        // move parent key to the head of node
        node.data[0] = parent.data[ei];
        node.length++;
        // move last key of left into parent
        left.length--;
        parent.data[ei] = left.data[left.length];
        left.data[left.length] = null;
    };
    BTree.prototype.mergeLeft = function mergeLeft(left, parent, ei, node) {
        var ki = left.length, li = left.length+1;
        // move parent key at the end of left
        left.data[ki++] = parent.data[ei];
        parent.data[ei] = null;
        parent.edges.splice(ei+1, 1);
        parent.length--;
        // move all keys from node to the end of left
        for (var i=0; i<node.length; i++) left.data[ki++] = node.data[i];
        if (!left.isLeaf && !node.isLeaf) {
            // move all edges of node to the end of left
            for (var i=0; i<node.length+1; i++) {
                var edge = node.edges[i];
                edge.from = left;
                left.edges[li++] = node.edges[i];
            }
        } else if (left.isLeaf != node.isLeaf) {
            throw new Error('Cannot merge a leaf and a non-leaf node!');
        }
        left.length = ki;
        this.removeVertex(node);
    };
    BTree.prototype.mergeRight = function mergeLeft(right, parent, ei, node) {
        var ki = right.length, li = right.length+1;
        // shift keys of right to the right
        var off = node.length + 1;
        for (var i=ki; i>0; i--) right.data[ki+off] = right.data[ki];
        // shift edges of right to the right
        off++;
        for (var i=li; i>0; i--) right.edges[li+off] = right.data[li];
        // move parent key at the head of right
        left.data[node.length] = parent.data[ei];
        // move all keys from node to the head of right
        for (var i=0; i<node.length; i++) left.data[i] = node.data[i];
        if (!left.isLeaf && !node.isLeaf) {
            // move all edges of node to the head of left
            for (var i=0; i<node.length+1; i++) {
                var edge = node.edges[i];
                edge.from = left;
                left.edges[i] = node.edges[i];
            }
        } else if (left.isLeaf != node.isLeaf) {
            throw new Error('Cannot merge a leaf and a non-leaf node!');
        }
        left.length = ki;
        this.removeVertex(node);
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
    BTree.prototype.getAt = function getAt(ix) {
        var result = null;
        if (ix < this.count) {
            result = this.first();
            while (ix >= 0) {
                if (this.lastResult.node.isLeaf) {
                    if (ix < this.lastResult.node.length) {
                        result = this.lastResult.node.data[ix];
                        break;
                    } else {
                        ix -= this.lastResult.node.length;
                        this.lastResult.index = this.lastResult.node.length-1;
                    }
                }
                if (ix > 0) {
                    result = this.next();
                    ix--;
                }
            }
        }
        return result;
    };

    publish(BTree, 'BTree');
})();