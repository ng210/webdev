(function() {
    function Vertex(id, parentVertex, vertexData) {
        this.id = id;
        this.parent = parentVertex || null;
        this.data = vertexData || null;
        this.edges = [];
        this.flag = 0;
    };
    function Edge(from, to, edgeData) {
        this.from = from;
        this.to = to;
        this.data = edgeData || null;
    };

    function Graph() {
        this.root = null;
        this.vertices = [];
        this.edges = [];
    }

    Graph.prototype.createVertex = function(vertexData) {
        var vertex = new Vertex(this.vertices.length, null, vertexData);
        this.vertices.push(vertex);
        return vertex;
    };

    Graph.prototype.addVertex = function(parentVertex, vertexData, edgeData) {
        var vertex = this.createVertex(vertexData);
        if (!this.root) {
            this.root = vertex;
        } else {
            this.addEdge(parentVertex || this.root, vertex, edgeData);
        }
        return vertex;
     };

    Graph.prototype.addEdge = function(from, to, edgeData) {
        var edge = new Edge(from, to, edgeData);
        from.edges.push(edge);
        this.edges.push(edge);
        return edge;
    };

    Graph.prototype.DFS = function(startVertex, preHandler, postHandler, args) {
        // reset flags
        for (var i=0; i<this.vertices.length; i++) {
            this.vertices[i].flag = 0;
        }
        var remaining = [startVertex];
        startVertex.flag = 1;
        while (remaining.length > 0) {
            var vertex = remaining[remaining.length-1];
            if (vertex.flag == 1) {
                if (typeof preHandler === 'function') {
                    preHandler.call(this, vertex, args);
                }
                vertex.flag = 2;
                for (var i=vertex.edges.length-1; i>=0; i--) {
                    var child = vertex.edges[i].to;
                    if (child.flag == 0) {
                        child.flag = 1;
                        remaining.push(child);
                    }
                }
            } else if (vertex.flag == 2) {
                if (typeof postHandler === 'function') {
                    postHandler.call(this, vertex, args);
                }
                vertex.flag = 3;
                remaining.pop();
            }
        }
    };

    Graph.createComplete = function(vertexCount, directed, vertexHandler, edgeHandler) {
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

    Graph.createCompleteTree = function(vertexDegree, levelCount, directed, vertexHandler, edgeHandler) {
        var graph = new Graph();
        var vertexCount = 1;
        var vertexId = 0;
        var label = '00000000';
        var digits = Math.ceil(Math.log10(Math.pow(vertexDegree, levelCount) - 1)/(vertexDegree - 1));
        var ei = 0;
        for (var i=0; i<levelCount; i++) {
            for (var n=0; n<vertexCount; n++) {
                var vertex = graph.createVertex('v' + (label + vertexId).slice(-digits));
                if (typeof vertexHandler === 'function') {
                    vertexHandler.call(graph, vertex, i);
                }
                if (i > 0) {
                    var parentId = Math.floor((vertexId-1)/vertexDegree);
                    var parentVertex = graph.vertices[parentId];
                    var edge = graph.addEdge(parentVertex, vertex, `${parentVertex.id}-${vertex.id}`);
                    if (typeof edgeHandler === 'function') {
                        edgeHandler.call(graph, edge, ei);
                    }
                    ei++;
                    if (!directed) {
                        edge = graph.addEdge(vertex, parentVertex, `${vertex.id}-${parentVertex.id}`)
                        if (typeof edgeHandler === 'function') {
                            edgeHandler.call(graph, edge, ei);
                        }
                        ei++;
                    }
                }
                vertexId++;
            }
            vertexCount *= vertexDegree;
        }
        return graph;
    }

    public(Graph, 'Graph');
})();
