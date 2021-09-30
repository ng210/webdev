include('./constraint.js');
include('/lib/math/segment.js');
(function() {
    function SegmentCollider2d() {
        SegmentCollider2d.base.constructor.call(this);
    }
    extend(ge.Constraint, SegmentCollider2d);

    SegmentCollider2d.prototype.check = function check(obj, dt, segmentList) {
        var v = new Segment(obj.current.position, obj.next.position);
        for (var i=0; i<segmentList.length; i++) {
            var s = segmentList[i];
            var p = s.intersect(v);
            if (p != null) {
                // segment's normal vector
                var n = new V2(-s.d.y, s.d.x);
                // incident vector
                var i = new V2(v.d);
                var c = n.dot(i);
                if (c < 0) {
                    obj.resolveCollision(dt, p.diff(v.a), n.norm());
                    break;
                }
            }
        }
    };

    publish(SegmentCollider2d, 'SegmentCollider2d', ge);
})();