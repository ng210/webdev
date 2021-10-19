include('./constraint.js');
include('/lib/math/segment.js');
include('/lib/data/quadtree.js');
(function() {
    function SegmentCollider2d(engine, id) {
        SegmentCollider2d.base.constructor.call(this, engine, id);
        this.segments = null;
        this.quadtree = new Quadtree(4, null);
    }
    extend(ge.Constraint, SegmentCollider2d);

    SegmentCollider2d.prototype.initialize = async function initialize(segments) {
        this.segments = segments;
        //add segments to quadtree
        //this.quadtree.
    };

    SegmentCollider2d.prototype.check = function check(obj, dt) {
        var v = new Segment(obj.current.position, obj.next.position);
        for (var i=0; i<this.segments.length; i++) {
            var s = this.segments[i];
            var p = s.intersect(v);
            if (p != null) {
                // segment's normal vector
                var n = new V2(-s.d.y, s.d.x);
                // incident vector
                var i = new V2(v.d);
                var c = n.dot(i);
                if (c < 0) {
                    obj.mechanics.resolveCollision.call(obj.mechanics, obj, dt, p.sub(v.a), n.norm());
                    break;
                }
            }
        }
    };

    publish(SegmentCollider2d, 'SegmentCollider2d', ge);
})();