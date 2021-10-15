include('./icomponent.js');
include('/lib/math/segment.js');
(function() {
    //#region SegmentManagerFactory
    function SegmentManagerFactory() {
        SegmentManagerFactory.base.constructor.call(this);
    };
    extend(ge.IComponentFactory, SegmentManagerFactory);

    SegmentManagerFactory.prototype.getDependencies = function getDependencies() {
        return ['segment-collider-2d.js', 'segment-renderer.js'];
    };
    SegmentManagerFactory.prototype.getTypes = function getTypes() {
        return [SegmentManager, ge.SegmentCollider2d, ge.SegmentRenderer];
    };
    SegmentManagerFactory.prototype.instantiate = async function instantiate(engine, componentName, id) {
        var inst = null;
        switch (componentName) {
            case 'SegmentManager': inst = new SegmentManager(engine, id); break;
            case 'SegmentCollider2d': inst = new ge.SegmentCollider2d(engine, id); break;
            case 'SegmentRenderer': inst = new ge.SegmentRenderer(engine, id); break;
        }
        return inst;
    };
    //#endregion

    //#region SegmentManager
    function SegmentManager(engine, id) {
        SegmentManager.base.constructor.call(this, engine, id);
        this.segments = [];
        this.collider = null;
        this.renderer = null;
    };
    extend(ge.IComponent, SegmentManager);

    SegmentManager.prototype.initialize = async function initialize() {
        this.collider = await ge.createInstance('SegmentCollider2d', this.id+'Collider1', this.segments);
        this.renderer = await ge.createInstance('SegmentRenderer', this.id+'Renderer1', this.segments);
    };

    SegmentManager.prototype.clearSegments = function clearSegments() {
        this.segments.length = 0;
    };
    SegmentManager.prototype.addSegment = function addSegment(x1,y1,x2,y2) {
        if (x1 instanceof Segment) {
            this.segments.push(x1);
        } else if (Array.isArray(x1) && Array.isArray(y1)) {
            this.segments.push(new Segment(x1, y1))
        } else if (x1 instanceof Float32Array && y1 instanceof Float32Array) {
            this.segments.push(new Segment(x1, y1));
        }        
    };

    SegmentManager.prototype.addSegments = function addSegments(segmentList) {
        for (var i=0; i<segmentList.length; i++) {
            this.addSegment(segmentList[i]);
        }
        return this.segments;
    };

    //#endregion

    publish(SegmentManagerFactory, 'SegmentManagerFactory', ge);
    publish(SegmentManager, 'SegmentManager', ge);
})();