// Generic item with position and bounding box
include('../ge..js');
(function() {
    function Item2d() {
        this.position = new V2();
        this.aabb = [new V2(Infinity, Infinity), new V2(-Infinity, -Infinity)];
        this.segments = [];
    }

    Item2d.prototype.clearSegments = function clearSegments() {
        this.segments.length = 0;
    };

    Item2d.prototype.addSegment = function addSegment(s) {
        var minX = Math.min(this.aabb[0].x, s.a.x, s.b.x);
        var minY = Math.min(this.aabb[0].y, s.a.y, s.b.y);
        var maxX = Math.max(this.aabb[1].x, s.a.x, s.b.x);
        var maxY = Math.max(this.aabb[1].y, s.a.y, s.b.y);
        this.aabb[0].set([minX, minY]);
        this.aabb[1].set([maxX, maxY]);
    };

    Item2d.prototype.addSegments = function addSegments(segmentList) {
        var minX = this.aabb[0].x, minY = this.aabb[0].y;
        var maxX = this.aabb[1].x, maxY = this.aabb[1].y;
        for (var i=0; i<segmentList.length; i++) {
            minX = Math.min(minX, segmentList[i].a.x, segmentList[i].b.x);
            minY = Math.min(minY, segmentList[i].a.y, segmentList[i].b.y);
            maxX = Math.max(maxX, segmentList[i].a.x, segmentList[i].b.x);
            maxY = Math.max(maxY, segmentList[i].a.y, segmentList[i].b.y);
            this.segments.push(segmentList[i]);
        }
        this.aabb[0].set([minX, minY]);
        this.aabb[1].set([maxX, maxY]);
    };

    Item2d.prototype.updateAABB = function updateAABB() {
        var minX = this.aabb[0].x, minY = this.aabb[0].y;
        var maxX = this.aabb[1].x, maxY = this.aabb[1].y;
        for (var i=0; i<segmentList.length; i++) {
            minX = Math.min(minX, s[i].a.x, s[i].b.x);
            minY = Math.min(minY, s[i].a.y, s[i].b.y);
            maxX = Math.max(maxX, s[i].a.x, s[i].b.x);
            maxY = Math.max(maxY, s[i].a.y, s[i].b.y);
        }
        this.aabb[0].set([minX, minY]);
        this.aabb[1].set([maxX, maxY]);
    };

    publish(Item2d, 'Item2d', ge)
})();