include('/ui/control.js');
include('/webgl/webgl.js');

(function() {
    var _supportedEvents = ['click', 'mousemove', 'mouseover', 'mouseout', 'mousedown', 'mouseup'];
    var _vertexShader = null;
    Ui.MultiChart = function(id, template, parent, path) {
        template = template || {};
        template.grid = template.grid || true;
        template.titlebar = template.titlebar || id;
        template['render-mode'] = template['render-mode'] || 'bar';
        template.type = template.type || 'multichart';
        template.events = ['mousemove', 'mousedown', 'mouseup'];
        template.unit = template.unit || [10, 10];
        template['grid-color'] = template['grid-color'] || [0.1, 0.2, 0.5];
        template['color'] = template['color'] || [0.8, 0.78, 0.5];
        Ui.Control.call(this, id, template, parent);
        // template
        // - titlebar (bool|text): titlebar
        // - grid: bool
        // - stepX, stepY: number
        this.template = template;
        this.titleBar = null;
        this.canvas = null;
        this.gl = null;
        this.renderModeName = null;
        this.renderMode = null;

        this.selectedChannelId = 0;
        this.series = null;

        this.program = null;
        this.uniforms = {
            uFrame: { type:webGL.FLOAT, value: 0 },
            uMaxX: { type:webGL.FLOAT, value: 0.0 },
            uSize: { type:webGL.FLOAT2V, value: new Float32Array(2) },
            uOffset: { type:webGL.FLOAT2V, value: new Float32Array([0.0, 0.0]) },
            uZoom: { type:webGL.FLOAT2V, value: new Float32Array([1.0, 1.0])},
            uUnit: { type:webGL.FLOAT2V, value: new Float32Array(this.template.unit) },
            uGridColor: { type:webGL.FLOAT3V, value: new Float32Array(this.template['grid-color']) },
            uColor: { type:webGL.FLOAT3V, value: new Float32Array(this.template['color']) },
            uMousePos: { type:webGL.FLOAT2V, value: new Float32Array([0.0, 0.0]) },
            uPointCount:  { type:webGL.INT, value: 0 },
            uDataPoints:  { type:webGL.FLOAT2V, value: new Float32Array(2) },
            uRenderMode:  { type:webGL.INT, value: 0 },
            uLineWidth:  { type:webGL.FLOAT, value: this.template['line-width'] }
        };
        this.the2triangles = null;
        this.path = path || '/ui/multichart/shaders';
        this.editState = 0;
        this.dragStart = [0, 0];
        this.frame = 0;
        this.timer = null;
        this.isRunning = false;
    }
    Ui.MultiChart.base = Ui.Control.prototype;
    Ui.MultiChart.prototype = new Ui.Control();
    Ui.Control.Types['multichart'] = { ctor: Ui.MultiChart, tag: 'DIV' };

	Ui.MultiChart.prototype.dataBind = function(obj, field) {
		this.dataSource = obj;
        this.dataField = field;
        if (this.dataField === undefined) {
            this.dataField = field;
        }
        if (this.dataField === undefined) {
            this.dataField = Object.keys(this.dataSource)[0]
        }
        this.selectChannel(this.dataField);
		return this.dataSource;
    };
    Ui.MultiChart.prototype.selectChannel = function(id) {
        if (this.dataSource[id] != undefined) {
            this.series = this.dataSource[id];
            this.selectedChannelId = id;
        }
    }
    Ui.MultiChart.prototype.updateDataPoints = function(start, length) {
        if (this.series) {
            var max = this.series.getInfo().max;
            start = start || Math.floor(this.uniforms.uOffset.value[0]/this.uniforms.uUnit.value[0]);
            length = length || Math.floor(this.uniforms.uSize.value[0]/this.uniforms.uUnit.value[0]);
            var end = start + length;
            if (start > max.x || end < 0) return;
            // get lesser and greater neighbours
            var prev = start;
            var next = end;
            this.series.query(q => {
                var point = q.this.getAsPoint(q.ix);
                if (point.x < start) {
                    prev = point.x;
                } else if (point.x > end) {
                    next = point.x;
                    q.continue = false;
                }
                q.continue = true;
                return false;
            });
            var range = { start:prev, end:next, step:1.0 };
            var points = this.series.getRange(range);
            this.uniforms.uMaxX.value = max.x;
            this.program.updateUniform('uMaxX');
            if (range.count > 0) {
                this.uniforms.uPointCount.value = range.count;
                this.program.updateUniform('uPointCount');
console.log('upload ' + points);
                this.uniforms.uDataPoints.value = new Float32Array(points);
                this.program.updateUniform('uDataPoints');
            }
        }
    };
    Ui.MultiChart.prototype.registerHandler = function(event) {
        if (_supportedEvents.indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
    Ui.MultiChart.prototype.render = async function(node) {
        Ui.MultiChart.base.render.call(this, node);
        this.element.style.boxSizing = 'border-box';
        // create and initialize canvas for webgl rendering
        if (this.canvas === null) {
            this.canvas = document.createElement('canvas');
            this.template.width = this.template.width || this.canvas.width;
            this.template.height = this.template.height || this.canvas.height;
            this.canvas.width = this.template.width;
            this.canvas.height = this.template.height;
            this.canvas.id = this.id+'_canvas';
            this.element.appendChild(this.canvas);
            await this.initializeWebGL();
            this.resize();
            this.updateDataPoints();
        }
        // create titlebar
        if (this.titleBar === null && this.template.titlebar) {
            this.titleBar = document.createElement('div');
            this.titleBar.id = this.id + '#title';
            this.titleBar.className = this.cssText + 'titlebar';
            this.titleBar.innerHTML = this.template.titlebar;
            this.titleBar.control = this;
            this.titleBar.style.boxSizing = 'border-box';
            this.titleBar.style.width = this.canvas.width + 'px';
            this.element.insertBefore(this.titleBar, this.element.childNodes[0]);
        }
        this.element.style.width = this.template.width + 'px';
        //this.element.style.height = this.template.height + 'px';
        this.isRunning = true;
        Ui.MultiChart.render(this);
    };
    Ui.MultiChart.prototype.setMode = async function(modeName) {
        modeName = modeName || this.renderModeName || this.template['render-mode'];
        var renderMode = Ui.MultiChart.RenderModes[modeName];
        if (!renderMode) {
            console.log('Invalid render mode requested: ' + modeName)
            modeName = 'bar';
        }
        this.renderModeName = modeName;
        if (this.gl) {
            if (_vertexShader == null) {
                _vertexShader = await load({ url: `${this.path}/default.vs`, contentType: 'x-shader/x-vertex', shaderType: this.gl.VERTEX_SHADER });
                if (_vertexShader.error instanceof Error) {
                    throw new Error('Could not initialize v-shader!');
                }
            }
            if (renderMode != this.renderMode) {
                if (!this.renderMode || renderMode.shader != this.renderMode.shader) {
                    this.renderMode = renderMode;
                    var url = `${this.path}/${this.renderMode.shader}.fs`;
                    var resource = { url: url, contentType: 'x-shader/x-fragment', shaderType: this.gl.FRAGMENT_SHADER };
                    if (Ui.MultiChart.resources[url] == undefined) {
                        Ui.MultiChart.resources[url] = await load(resource);
                    }
                    if (Ui.MultiChart.resources[url] == undefined || Ui.MultiChart.resources[url].error instanceof Error) {
                        throw new Error('Could not initialize f-shader!');
                    }
                    var shaders = {};
                    shaders[this.gl.VERTEX_SHADER] = _vertexShader.data;
                    shaders[this.gl.FRAGMENT_SHADER] = Ui.MultiChart.resources[url].data;
                    this.program = webGL.createProgram(this.gl, shaders, { position:{type:this.gl.FLOAT, size:4} }, this.uniforms);
                    this.gl.useProgram(this.program.prg);
                }
                // inform shader about mode change
                this.uniforms.uRenderMode.value = this.renderMode.code;
                this.program.updateUniform('uRenderMode');
            }
        }
    };
    Ui.MultiChart.prototype.initializeWebGL = async function() {
        this.gl = this.canvas.getContext('webgl');
        await this.setMode();
        // create "canvas" of 2 triangles
        const positions = [-1.0,  1.0,  1.0,  1.0,  -1.0, -1.0,  1.0, -1.0];
        this.the2triangles = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.the2triangles);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        //this.gl.useProgram(this.program.prg);
        // set initial uniforms
        this.program.setUniforms();
    };
    Ui.MultiChart.prototype.paint = function() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.uniforms.uFrame.value++;
        this.program.updateUniform('uFrame');
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    };
    Ui.MultiChart.prototype.resize = function(width, height) {
        if (width != undefined) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.uniforms.uSize.value[0] = this.canvas.width;
        this.uniforms.uSize.value[1] = this.canvas.height;
        this.program.updateUniform('uSize');
    };

    Ui.MultiChart.prototype.draw = function(from, to, isComplete) {
        if (this.series && this.series.get(to[0]) != to[1]) {
            this.series.set(to[0], to[1]);
            this.canvas.style.cursor = 'pointer';
        }
    };
    Ui.MultiChart.prototype.erase = function(from, to, isComplete) {
        if (this.series) {
            var indices = this.series.query(q => {
                var point = q.this.getAsPoint(q.ix);
                q.continue = point.x <= to[0];
                return point.x >= from[0] && from[1] <= point.y && point.y <= to[1];
            });
            for (var ix=0; ix<indices.length; ix++) {
                this.series.removeAt(indices[ix]);
            }
        }
    };
    Ui.MultiChart.prototype.edit = function(pos, isComplete) {
        var from = this.pointToData(this.dragStart);
        var to = this.pointToData(pos);
        if (from[0] > to[0]) {
            var temp = from[0]; from[0] = to[0]; to[0] = temp;
        }
        if (from[1] > to[1]) {
            var temp = from[1]; from[1] = to[1]; to[1] = temp;
        }
        switch (this.editState) {
            case 1: // edit
                this.draw(from, to, isComplete);
                this.updateDataPoints();
                this.paint();
                break;
            case 4: // remove
                this.erase(from, to, isComplete);
                this.updateDataPoints();
                this.paint();
                break;
        }
    };

    Ui.MultiChart.prototype.onmousemove = function(ctrl, e) {
        var pos = [e.layerX, ctrl.canvas.height - e.layerY];
        switch (this.editState) {
            case 0:
                if (this.series) {
                    var p = this.pointToData(pos);
                    if (p != null && this.series.contains(p[0], p[1])) {
                        this.canvas.style.cursor = 'pointer';
                    } else {
                        this.canvas.style.cursor = 'default';
                    }
                }
                break;
            case 2: // scroll/drag
                var deltaX = this.dragStart[0] - pos[0];
                var deltaY = this.dragStart[1] - pos[1];
                this.dragStart[0] = pos[0];
                this.dragStart[1] = pos[1];
                this.scroll(deltaX, deltaY);
                // if (this.uniforms.uOffset[0] == this.uniforms.uUnit[0]) {
                this.updateDataPoints();
                this.paint();
                // }
                break;
            case 3: // select
                break;
            default: // edit
                this.edit(pos);
                break;
        }
        if (this.gl) {
            this.gl.uniform2fv(this.program.uniforms.uMousePos.ref, pos);
        }
    };
    Ui.MultiChart.prototype.onmousedown = function(ctrl, e) {
        var pos = [e.layerX, ctrl.canvas.height - e.layerY];
        this.dragStart[0] = pos[0];
        this.dragStart[1] = pos[1];
        //if (e.altKey) this.editState = 1; // 
        if (e.ctrlKey) this.editState = 2; // scroll/drag
        else if (e.shiftKey) this.editState = 3; // select
        else {
            var p = this.pointToData(pos);
            this.editState = this.series.contains(p[0], p[1]) ? 4 : 1; // erase : draw
            console.log(this.editState);
        }
        return false;
    };
    Ui.MultiChart.prototype.onmouseup = function(ctrl, e) {
        var pos = [e.layerX, ctrl.canvas.height - e.layerY];
        this.edit(pos, true);
        this.editState = 0;
        var onclick = this.handlers['onclick'];
        if (onclick) {
            onclick.fn.call(onclick.obj, ctrl, e);
        }
    };

    Ui.MultiChart.prototype.scroll = function(scrollX, scrollY) {
        var offsetX = this.uniforms.uOffset.value[0] + scrollX;
        var offsetY = this.uniforms.uOffset.value[1] + scrollY;
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        this.uniforms.uOffset.value[0] = offsetX;
        this.uniforms.uOffset.value[1] = offsetY;
        this.program.updateUniform('uOffset');
        this.updateDataPoints();
    };

    Ui.MultiChart.prototype.pointToData = function(point) {
        // apply offset and zoom
        var frame = Math.floor((point[0] + this.uniforms.uOffset.value[0]) / this.uniforms.uUnit.value[0]);
        var value = Math.floor((point[1] + this.uniforms.uOffset.value[1]) / this.uniforms.uUnit.value[1]);
        return [frame, value];
    };

    Ui.MultiChart.resources = {};

    Ui.MultiChart.RenderModes = {
        'bar': { 'shader': 'default', 'code': 0 },
        'area': { 'shader': 'default', 'code': 1 },
        'dot': { 'shader': 'default', 'code': 2 },
        'line': { 'shader': 'default', 'code': 3 }
    };

    Ui.MultiChart.render = function(instance) {
        clearTimeout(instance.timer);
        if (instance.isRunning) {
            instance.paint();
            instance.timer = setTimeout(Ui.MultiChart.render, 60, instance);
        }
    };

})();
