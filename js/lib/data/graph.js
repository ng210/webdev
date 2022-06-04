(function() {
    function Vertex(id, parentVertex, vertexData) {
        this.id = id;
        this.graph = null;
        this.parent = parentVertex || null;
        this.data = vertexData;
        this.edges = [];
        this.flag = 0;
    };
    Vertex.prototype.destroy = function destroy() {
        this.parent = null;
        this.data = null;
        for (var i=0; i<this.edges.length; i++) {
            this.edges[i] = null;
        }
        this.edges = null;
        this.flag = 0;
    };
    function Edge(from, to, edgeData) {
        this.graph = null;
        this.from = from;
        this.to = to;
        this.data = edgeData;
    };
    Edge.prototype.destroy = function destroy() {
        this.from = null;
        this.to = null;
        this.data = null;
    };

    function Graph() {
        this.root = null;
        this.vertices = [];
        this.edges = [];
    }
    Graph.prototype.destroy = function destroy() {
        // delete edges
        for (var i=0; i<this.edges.length; i++) {
            this.edges[i].destroy();
        }
        this.edges = null;
        // delete vertices
        for (var i=0; i<this.vertices.length; i++) {
            this.vertices[i].destroy();
        }
        this.vertices = null;
        this.root = null;
    };
    Graph.prototype.createVertex = function createVertex(vertexData, parent) {
        var vertex = new Vertex(this.vertices.length, parent, vertexData);
        vertex.graph = this;
        if (!this.root) {
            this.root = vertex;
        }
        this.vertices.push(vertex);
        return vertex;
    };
    Graph.prototype.createEdge = function createEdge(from, to, edgeData) {
        var edge = new Edge(from, to, edgeData);
        edge.graph = this;
        this.edges.push(edge);
        return edge;
    };
    Graph.prototype.addVertex = function addVertex(parentVertex, vertexData, edgeData) {
        parentVertex = parentVertex || this.root;
        var vertex = this.createVertex(vertexData, parentVertex);
        if (vertex != this.root) {
            this.addEdge(parentVertex, vertex, edgeData);
        }
        return vertex;
    };
    Graph.prototype.removeVertex = function removeVertex(vertex) {
        if (this.vertices[vertex.id] != vertex) throw new Error(`Vertex ${vertex.id} invalid!`);
        var last = this.vertices.pop();
        last.id = vertex.id;
        this.vertices[vertex.id] = last;
    };
    Graph.prototype.addEdge = function addEdge(from, to, edgeData) {
        var edge = this.createEdge(from, to, edgeData);
        from.edges.push(edge);
        return edge;
    };
    Graph.prototype.removeEdge = function removeEdge(edge) {
        var ix = this.edges.findIndex(x => x == edge);
        if (ix != -1) {
            this.edges[ix] = this.edges.pop();
            ix = edge.from.edges.findIndex(x => x == edge);
            edge.from.edges.slice(ix, 1);
            ix = edge.to.edges.findIndex(x => x == edge);
            edge.to.edges.slice(ix, 1);
        }
    };
    Graph.prototype.DFS = function DFS(startVertex, preHandler, postHandler, edgehandler, args) {
        // reset flags
        for (var i=0; i<this.vertices.length; i++) {
            this.vertices[i].flag = 0;
        }
        startVertex = startVertex || this.root;
        var remaining = [startVertex];
        var stop = false;
        startVertex.flag = 1;
        while (!stop && remaining.length > 0) {
            var vertex = remaining[remaining.length-1];
            if (vertex.flag == 1) {
                if (typeof preHandler === 'function') {
                    if (preHandler.call(this, vertex, args)) break;
                }
                vertex.flag = 2;
                for (var i=vertex.edges.length-1; i>=0; i--) {
                    var edge = vertex.edges[i];
                    if (edge) {
                        var child = edge.to;
                        child.parent = vertex;
                        if (child.flag == 0) {
                            child.flag = 1;
                            remaining.push(child);
                            if (typeof edgehandler === 'function') {
                                if (edgehandler.call(this, edge, i, args)) {
                                    stop = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            } else if (vertex.flag == 2) {
                if (typeof postHandler === 'function') {
                    if (postHandler.call(this, vertex, args)) break;
                }
                vertex.flag = 3;
                remaining.pop();
            }
        }
    };
    Graph.prototype.BFS = function BFS(startVertex, preHandler, postHandler, edgeHandler, args) {
        // reset flags
        for (var i=0; i<this.vertices.length; i++) {
            this.vertices[i].flag = 0;
        }
        startVertex = startVertex || this.root;
        var level = 0;
        var remaining = [startVertex];
        startVertex.flag = 1;
        if (typeof preHandler === 'function' && preHandler.call(this, startVertex, level, args)) return;
        var isStopped = false;
        while (!isStopped && remaining.length > 0) {
            var vertex = remaining.pop();   //[remaining.length-1];
            if (typeof postHandler === 'function' && postHandler.call(this, vertex, level, args)) break;
            for (var i=0; i<vertex.edges.length; i++) {
                var edge = vertex.edges[i];
                if (edge) {
                    var child = edge.to;
                    child.parent = vertex;
                    if (child.flag == 0) {
                        if (typeof edgeHandler !== 'function' || !edgeHandler.call(this, edge, args)) {
                            child.flag = 1;
                            if (typeof preHandler !== 'function' || !preHandler.call(this, child, level + 1, args)) {
                                remaining.unshift(child);
                            } else {
                                isStopped = true;
                                break;
                            }
                        }
                    }
                }
            }
            level++;
        }
    };

    Graph.prototype.findPath = function findPath(start, end, checkEdge) {
        // distance(start, v)
        var links = new Array(this.vertices.length);
        links.fill(null);
        checkEdge = typeof checkEdge === 'function' ? checkEdge : e => true;
        this.BFS(start, vertex => vertex == end, null, e => {
            if (checkEdge.call(this, e)) {
                links[e.to.id] = e;
            } else return true;
        });
        var path = null;
        if (links[end.id] != null) {
            var path = [];
            var link = links[end.id];
            while (link != null) {
                path.push(link);
                link = links[link.from.id]
            }
            var j = path.length-1;
            for (var i=0; i<j; i++) {
                var tmp = path[i];
                path[i] = path[j];
                path[j] = tmp;
                j--;
            }
        }
// if (path) console.log(`Start:${start.id} ${path.map(e => `${e.from.id}-${e.to.id}`)} - End:${end.id}`);
// else console.log('No path');
        return path;
    };
    Graph.createComplete = function createComplete(vertexCount, directed, vertexHandler, edgeHandler) {
        var graph = new Graph();
        // add vertices
        var label = '00000000';
        var digits = Math.ceil(Math.log10(vertexCount));
        for (var i=0; i<vertexCount; i++) {
            var vertex = graph.createVertex('v' + (label + i).slice(-digits));
            if (typeof vertexHandler === 'function') {
                vertexHandler.call(graph, vertex, i);
            }
        }
        // add edges
        var ei = 0;
        for (var i=0; i<vertexCount; i++) {
            var from = graph.vertices[i];
            for (var j=i+1; j<vertexCount; j++) {
                var to = graph.vertices[j];
                var edge = graph.addEdge(from, to, `${i}-${j}`)
                if (typeof edgeHandler === 'function') {
                    edgeHandler.call(graph, edge, ei);
                }
                ei++;
                if (!directed) {
                    edge = graph.addEdge(to, from, `${j}-${i}`)
                    if (typeof edgeHandler === 'function') {
                        edgeHandler.call(graph, edge, ei);
                    }
                    ei++;
                }
            }
        }
        return graph;
    };
    Graph.createCompleteTree = function createCompleteTree(vertexDegree, levelCount, directed, vertexHandler, edgeHandler) {
        var tree = new Graph();
        var vertexCount = 1;
        var vertexId = 0;
        var label = '00000000';
        var digits = Math.ceil(Math.log10(Math.pow(vertexDegree, levelCount) - 1)/(vertexDegree - 1));
        var ei = 0;
        for (var i=0; i<levelCount; i++) {
            for (var n=0; n<vertexCount; n++) {
                var vertex = tree.createVertex('v' + (label + vertexId).slice(-digits));
                var parentId = Math.floor((vertexId-1)/vertexDegree);
                var parentVertex = tree.vertices[parentId];
                vertex.parent = parentVertex;
                if (typeof vertexHandler === 'function') {
                    vertexHandler.call(tree, vertex, i, n);
                }
                if (i > 0) {
                    var edge = tree.addEdge(parentVertex, vertex, `${parentVertex.id}-${vertex.id}`);
                    if (typeof edgeHandler === 'function') {
                        edgeHandler.call(tree, edge, ei);
                    }
                    ei++;
                    if (!directed) {
                        edge = tree.addEdge(vertex, parentVertex, `${vertex.id}-${parentVertex.id}`)
                        if (typeof edgeHandler === 'function') {
                            edgeHandler.call(tree, edge, ei);
                        }
                        ei++;
                    }
                } else {
                    tree.root = vertex;
                }
                vertexId++;
            }
            vertexCount *= vertexDegree;
        }
        return tree;
    }

    publish(Graph, 'Graph');
    publish(Edge, 'Edge', Graph);
    publish(Vertex, 'Vertex', Graph);
})();
