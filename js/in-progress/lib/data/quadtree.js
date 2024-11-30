include('./graph.js');
include('/lib/math/v2.js');

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
                vertex.p1 = vertex.parent.p1.sum([(n%2)/d, Math.floor(n/2)/d]);
            } else {
                vertex.p1 = new V2(0);
            }
            vertex.p2 = vertex.p1.sum([0.5/d, 0.5/d]);
            vertex.size = new V2(1/d, 1/d);
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
                if (x1 < v.p2.x && x2 < v.p2.x) next = 0;
                else if (x1 > v.p2.x && x2 > v.p2.x) next = 1;
                else break;
                if (y1 < v.p2.y && y2 < v.p2.y) next += 0;
                else if (y1 > v.p2.y && y2 > v.p2.y) next += 2;
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