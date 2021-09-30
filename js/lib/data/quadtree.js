include('./graph.js');

(function() {
    function Quadtree(levels, vertexHandler) {
        this.level = levels;
        this.tree = this.build(levels, vertexHandler);
    }
    Object.defineProperties(Quadtree.prototype, {
        'vertices': { get: function() { return this.tree.vertices }},
        'edges': { get: function() { return this.tree.edges }},
        'root': { get: function() { return this.tree.root }},
    });

    Quadtree.prototype.build = function build(levels, vertexHandler) {
        var quadTree = Graph.createCompleteTree(4, levels, true, (vertex, level, i) => {
            vertex.items = [];
            var d = Math.pow(2, level);
            if (vertex.parent) {
                var n = i%4;
                vertex.x = vertex.parent.x + (n%2)/d;
                vertex.y = vertex.parent.y + Math.floor(n/2)/d;
            } else {
                vertex.x = 0;
                vertex.y = 0;
            }
            vertex.width = 1/d;
            vertex.height = 1/d;
            if (typeof vertexHandler === 'function') {
                vertexHandler(vertex, level, i);
            }
        });
        return quadTree;
    };

    Quadtree.prototype.getQuadAt = function getQuadAt(quadTree, x1, y1, x2, y2) {
        var v = quadTree.root;
        while (true) {
            if (v.edges.length > 0) {
                var next = 0;
                if (x1 < v.x+v.width/2 && x2 < v.x+v.width/2) next = 0;
                else if (x1 > v.x+v.width/2 && x2 > v.x+v.width/2) next = 1;
                else break;
                if (y1 < v.y+v.height/2 && y2 < v.y+v.height/2) next += 0;
                else if (y1 > v.y+v.height/2 && y2 > v.y+v.height/2) next += 2;
                else break;
                v = v.edges[next].to;
            } else {
                break;
            }
        }
        return v;
    };


    publish(Quadtree, 'Quadtree');
})();