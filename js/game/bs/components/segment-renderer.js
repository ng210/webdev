include('./ge.js');
include('/lib/math/segment.js');
(function() {
    function SegmentRenderer() {
        SegmentRenderer.base.constructor.call(this);
        this.segments = [];
        this.vertexBuffer = null;
        this.program = null;
        this.projection = new Float32Array(16);
    }
    extend(ge.Renderer, SegmentRenderer);

    SegmentRenderer.prototype.resize = function resize() {
        if (this.program) {
            M44.projection(gl.canvas.width, gl.canvas.height, 1, this.projection);
            //M44.identity(this.projection);
            this.program.uniforms.u_projection.value = this.projection;
        }
    };

    SegmentRenderer.prototype.initialize = async function initialize(engine) {
        // load resources
        var resources = await Promise.all([
            load({ url: `./components/flat.vs`, contentType: 'x-shader/x-vertex', shaderType:gl.VERTEX_SHADER }),
            load({ url: `./components/flat.fs`, contentType: 'x-shader/x-fragment', shaderType:gl.FRAGMENT_SHADER })
        ]);
        var errors = [];
        if (resources[0].error) errors.push(resources[0].error.message);
        if (resources[1].error) errors.push(resources[1].error.message);
        if (errors.length > 0) throw new Error(`Could not load resources: ${errors.join()}`);
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = resources[0].data;
        shaders[gl.FRAGMENT_SHADER] = resources[1].data;
        var bufferId = webGL.buffers.length;
        this.program = webGL.createProgram(shaders, { a_position: { buffer:bufferId } });
    };

    SegmentRenderer.prototype.prerender = function prerender() {
        var vertices = new Float32Array(this.segments.length*4);
        var j = 0;
        for (var i=0; i<this.segments.length; i++) {
            vertices[j++] = this.segments[i].a.x;
            vertices[j++] = this.segments[i].a.y;
            vertices[j++] = this.segments[i].b.x;
            vertices[j++] = this.segments[i].b.y;
        }
        // create VBO from segments
        this.vertexBuffer = webGL.createBuffer(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    };

    SegmentRenderer.prototype.render = function render() {
        webGL.useProgram(this.program, { 'u_projection': this.projection });
        //gl.activeTexture(gl.TEXTURE0);
        //gl.bindTexture(gl.TEXTURE_2D, this.map.texture);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawArrays(gl.LINES, 0, this.segments.length*4);
    };

    SegmentRenderer.prototype.clearSegments = function clearSegments() {
        this.segments = [];
    };

    SegmentRenderer.prototype.addSegment = function addSegment(x1,y1,x2,y2) {
        if (x1 instanceof Segment) {
            this.segments.push(x1);
        } else if (Array.isArray(x1) && Array.isArray(y1)) {
            this.segments.push(new Segment(x1, y1))
        } else if (x1 instanceof Float32Array && y1 instanceof Float32Array) {
            this.segments.push(new Segment(x1, y1));
        }        
    };

    SegmentRenderer.prototype.addSegments = function addSegments(segmentList) {
        for (var i=0; i<segmentList.length; i++) {
            this.addSegment(segmentList[i]);
        }        
    };

    publish(SegmentRenderer, 'SegmentRenderer', ge);
})();