include('./constraint.js');
include('/lib/math/segment.js');
(function() {
    function SegmentCollider2d() {
        SegmentCollider2d.base.constructor.call(this);
    }
    extend(ge.Constraint, SegmentCollider2d);

    SegmentCollider2d.prototype.check = function check(obj, dt, segmentList) {
        var pos = obj.next.position;
        var v = new Segment(obj.current.position, obj.next.position);
        for (var i=0; i<segmentList.length; i++) {
            var s = segmentList[i];
            var p = s.intersect(v);
            if (p != null) {
                // segment's normal vector
                var n = new V2(-s.d.y, s.d.x);
                // normalized incident vector
                var i = new V2(v.d);
                var c = n.dot(i);
                if (c < 0) {
                    pos = this.resolveCollision(obj, n.norm(), v.b.diff(p), p);
                    break;
                }
            }
        }
        obj.current.position.set(pos);
    };

    SegmentCollider2d.prototype.resolveCollision = function resolveCollision(obj, n, i, p) {
        // r = i - 2*dot(n, i)*n
        var r = n.prodC(-2*n.dot(i)).add(i);
        obj.next.position.set(r).add(p);
        obj.current.velocity.set(r.norm().prodC(obj.current.velocity.len));
        return obj.next.position;
    };

    publish(SegmentCollider2d, 'SegmentCollider2d', ge);
})();