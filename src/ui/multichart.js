include('/ui/control.js');
include('/webgl/webgl.js');

(function() {
    var _supportedEvents = ['click', 'mousemove', 'mouseover', 'mouseout', 'mousedown', 'mouseup', 'keyup'];
    var _vertexShader = null;
    Ui.MultiChart = function(id, template, parent, path) {
        template = template || {};
        template.grid = template.grid || true;
        template.titlebar = template.titlebar || id;
        template['render-mode'] = template['render-mode'] || Object.keys(Ui.MultiChart.RenderModes)[0];
        template.type = template.type || 'multichart';
        template.unit = template.unit || [10, 10];
        template['grid-color'] = template['grid-color'] || [0.1, 0.2, 0.5];
        template['color'] = template['color'] || [0.8, 0.78, 0.5];
        template['line-width'] = template['line-width'] || 0.1;
        if (!template.events) template.events = [];
        for (var i=0; i<_supportedEvents.length; i++) {
            if (template.events.indexOf(_supportedEvents[i]) == -1) {
                template.events.push(_supportedEvents[i]);
            }
        }
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
        this.unit = [this.template.unit[0], this.template.unit[1]];
        this.zoom = [1.0, 1.0];

        this.selectedChannelId = 0;
        this.series = null;
        this.selection = [];

        this.program = null;
        this.uniforms = {
            uFrame: { type:webGL.FLOAT, value: 0 },
            uMaxX: { type:webGL.FLOAT, value: 0.0 },
            uSize: { type:webGL.FLOAT2V, value: new Float32Array(2) },
            uOffset: { type:webGL.FLOAT2V, value: new Float32Array([0.0, 0.0]) },
            uUnit: { type:webGL.FLOAT2V, value: new Float32Array(this.template.unit) },
            uGridColor: { type:webGL.FLOAT3V, value: new Float32Array(this.template['grid-color']) },
            uColor: { type:webGL.FLOAT3V, value: new Float32Array(this.template['color']) },
            uMousePos: { type:webGL.FLOAT2V, value: new Float32Array([0.0, 0.0]) },
            uDataLength:  { type:webGL.INT, value: 0 },
            uDataPoints:  { type:webGL.FLOATV, value: new Float32Array(1) },
            uRenderMode:  { type:webGL.INT, value: 0 },
            uLineWidth:  { type:webGL.FLOAT, value: this.template['line-width'] },
            uDrawingRect: { type:webGL.FLOAT2V, value: new Float32Array(4)  },
            uSelectionRect: { type:webGL.FLOAT2V, value: new Float32Array(4)  },
            uSelectedPoints: { type:webGL.INTV, value: new Int8Array(1)  },
            uSelectionLength: { type:webGL.INT, value: 0  }
        };
        this.the2triangles = null;
        this.path = path || '/ui/multichart/shaders';
        this.editState = 0;
        this.editMode = 0;
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
            if (this.series.data.length == 0) {
                this.uniforms.uDataLength.value = 0;
                this.program.updateUniform('uDataLength');
                return;
            }
            var max = this.series.getInfo().max;
            start = start || Math.floor(this.uniforms.uOffset.value[0]/this.uniforms.uUnit.value[0]);
            length = length || Math.floor(this.uniforms.uSize.value[0]/this.uniforms.uUnit.value[0]);
            var end = start + length;
            if (start > max[0] || end < 0) return;
            var prev = null, next = null;
            var values = [];
            var selection = [];
            var data = this.series.data;
            var x = NaN;
            var ix = 0;
            var pointCount = 0;
            for (var i=0; i<data.length; i++) {
                if (data[i][0] != x) {
                    if (data[i][0] >= start) {
                        break;
                    }
                    ix = i;
                    x = data[i][0];
                }
            }
            for (;ix < data.length; ix++) {
                values.push(...data[ix]);
                for (var j=0; j<this.selection.length; j++) {
                    if (this.selection[j] == ix) {
                        selection.push(pointCount);
                        break;
                    }
                }
                pointCount++;
                if (data[ix][0] > end) {
                    break;
                }
            }

            this.uniforms.uMaxX.value = max[0];
            this.program.updateUniform('uMaxX');
            this.uniforms.uDataLength.value = values.length;
            this.program.updateUniform('uDataLength');
            if (values.length > 0) {
//console.log('upload: ' + values);
                this.uniforms.uDataPoints.value = new Float32Array(values);
                this.program.updateUniform('uDataPoints');
                // update selection
                if (selection.length > 0) {
                    this.uniforms.uSelectedPoints.value = new Int8Array(selection);
                    this.program.updateUniform('uSelectedPoints');
                }
                this.uniforms.uSelectionLength.value = selection.length;
                this.program.updateUniform('uSelectionLength');
        
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
            modeName = Object.keys(Ui.MultiChart.RenderModes)[0];
            renderMode = Ui.MultiChart.RenderModes[modeName];
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
        this.gl = this.canvas.getContext('webgl'/*, { alpha: false }*/);
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
    Ui.MultiChart.prototype.erase = function(from, to, isComplete) {
        this.series.removeRange(from, to);
    };

    Ui.MultiChart.prototype.getRect = function(p1, p2) {
        var min = [p1[0], p1[1]];
        var max = [p2[0], p2[1]];
        if (min[0] > max[0]) {
            var temp = max[0]; max[0] = min[0]; min[0] = temp;
        }
        if (min[1] > max[1]) {
            var temp = max[1]; max[1] = min[1]; min[1] = temp;
        }
        return [min, max];
    };

    Ui.MultiChart.prototype.onSet = function(from, to) {
        console.log('set ' + to);
        this.series.set(to);
    };
    Ui.MultiChart.prototype.onDragging = function(from, to) {
        var deltaX = from[0] - to[0];
        var deltaY = from[1] - to[1];
        this.dragStart[0] = to[0];
        this.dragStart[1] = to[1];
        this.scroll(deltaX, deltaY);
        this.updateDataPoints();
    };
    Ui.MultiChart.prototype.onSelecting = function(rect) {
        this.uniforms.uSelectionRect.value[0] = rect[0][0] + this.uniforms.uOffset.value[0];
        this.uniforms.uSelectionRect.value[1] = rect[0][1] + this.uniforms.uOffset.value[1];
        this.uniforms.uSelectionRect.value[2] = rect[1][0] + this.uniforms.uOffset.value[0];
        this.uniforms.uSelectionRect.value[3] = rect[1][1] + this.uniforms.uOffset.value[1];
        this.program.updateUniform('uSelectionRect');
    };
    Ui.MultiChart.prototype.onSelect = function(from, to) {
        var rect = this.getRect(from, to);
        this.series.iterate(rect[0], rect[1], (value, it) => {
            this.selection.push(it.ix);
        });

        this.updateDataPoints();
        this.onSelecting([0,0], [0,0]);
    };
    Ui.MultiChart.prototype.onDrawing = function(rect) {
        this.uniforms.uDrawingRect.value[0] = rect[0][0] + this.uniforms.uOffset.value[0];
        this.uniforms.uDrawingRect.value[1] = rect[0][1] + this.uniforms.uOffset.value[1];
        this.uniforms.uDrawingRect.value[2] = rect[1][0] + this.uniforms.uOffset.value[0];
        this.uniforms.uDrawingRect.value[3] = rect[1][1] + this.uniforms.uOffset.value[1];
        this.program.updateUniform('uDrawingRect');
        this.canvas.style.cursor = 'pointer';
    };
    Ui.MultiChart.prototype.onDraw = function(from, to) {
        this.onSet(from, to);
        this.updateDataPoints();
        this.canvas.style.cursor = 'default';
        this.onDrawing([0,0], [0,0]);
    };
    Ui.MultiChart.prototype.onZoom = function(dx, dy) {
        var zx = this.zoom[0] + 0.005 * dx;
        var zy = this.zoom[1] + 0.005 * dy;
        if (zx < Ui.MultiChart.MinZoom) zx = Ui.MultiChart.MinZoom;
        if (zy < Ui.MultiChart.MinZoom) zy = Ui.MultiChart.MinZoom;
        if (zx > Ui.MultiChart.MaxZoom) zx = Ui.MultiChart.MaxZoom;
        if (zy > Ui.MultiChart.MaxZoom) zy = Ui.MultiChart.MaxZoom;
        this.uniforms.uUnit.value[0] = this.unit[0]*zx;
        this.uniforms.uUnit.value[1] = this.unit[1]*zy;
        this.program.updateUniform('uUnit');
        this.updateDataPoints();

        this.titleBar.innerHTML = `${this.template.titlebar} - (${(100*zx).toFixed(1)}%, ${(100*zy).toFixed(1)}%)`;
    };

    Ui.MultiChart.prototype.edit = function(pos, isComplete) {
        if (this.series) {
            var from = this.pointToData(this.dragStart);
            var to = this.pointToData(pos);
            switch (this.editState) {
                // default
                case Ui.MultiChart.EditStates.none:
                    var p = this.pointToData(pos);
                    if (p != null && this.series.get(p).length > 0) {
                        this.canvas.style.cursor = 'pointer';
                    } else {
                        this.canvas.style.cursor = 'default';
                    }
                    break;
                // dragging
                case Ui.MultiChart.EditStates.drag:
                    this.onDragging(this.dragStart, pos);
                    break;
                // selection
                case Ui.MultiChart.EditStates.reselect:
                    this.selection = [];
                    var rect = this.getRect(this.dragStart, pos);
                    if (this.editMode == Ui.MultiChart.EditModes.select) {
                        !isComplete ? this.onSelecting(rect) : this.onSelect(from, to);
                    } else if (this.editMode == Ui.MultiChart.EditModes.draw) {
                        !isComplete ? this.onDrawing(rect) : this.onDraw(from, to);
                    }
                    break;
                case Ui.MultiChart.EditStates.select:
                    var rect = this.getRect(this.dragStart, pos);
                    !isComplete ? this.onSelecting(rect) : this.onSelect(from, to);
                    break;
                case Ui.MultiChart.EditStates.deselect:
                    var rect = this.getRect(this.dragStart, pos);
                    !isComplete ? this.onSelecting(rect[0], rect[1], false) : this.onSelect(from, to, false);
                    break;
                case Ui.MultiChart.EditStates.zoom:
                    if (!isComplete) {
                        this.onZoom(pos[0] - this.dragStart[0], pos[1] - this.dragStart[1]);
                    } else {
                        this.zoom[0] = this.uniforms.uUnit.value[0]/this.unit[0];
                        this.zoom[1] = this.uniforms.uUnit.value[1]/this.unit[1];
                    }                    
                    break;
                case Ui.MultiChart.EditStates.draw:
                    //var rect = this.getRect(this.dragStart, pos);
                    !isComplete ? this.onDrawing(from, to) : this.onDraw(from, to);
                    break;
                default:
                    throw new Error('Illegal edit state!');
            }
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
        var x = Math.floor((point[0] + this.uniforms.uOffset.value[0]) / this.uniforms.uUnit.value[0]);
        var y = Math.floor((point[1] + this.uniforms.uOffset.value[1]) / this.uniforms.uUnit.value[1]);
        return [x, y];
    };
    // Event handlers
    Ui.MultiChart.prototype.onmousemove = function(e) {
        //var deltaX = e.screenX - Pot.dragPoint[0];
        //var deltaY = e.screenY - Pot.dragPoint[1];
        if (e.target == this.canvas) {
            var pos = [e.layerX, this.canvas.height - e.layerY];
            this.edit(pos);
            this.gl.uniform2fv(this.program.uniforms.uMousePos.ref, pos);
            return true;
        }
    };
    Ui.MultiChart.prototype.onmousedown = function(e) {
        var pos = [e.layerX, this.canvas.height - e.layerY];
        this.dragStart[0] = pos[0];
        this.dragStart[1] = pos[1];
        var keys = 0;
        if (e.altKey) keys |= 1;
        if (e.ctrlKey) keys |= 2;
        if (e.shiftKey) keys |= 4;
        switch (keys) {
            case 0: // select
                this.editState = Ui.MultiChart.EditStates.reselect;
                break;
            case 1: // alt only - zoom
                this.editState = Ui.MultiChart.EditStates.zoom;
                break;
            case 2: // ctrl only - drag
                this.editState = Ui.MultiChart.EditStates.drag;
                break;
            case 3: // alt + ctrl - drag
            this.editState = Ui.MultiChart.EditStates.drag;
                break;
            case 4: // shift only - add to select
                this.editState = Ui.MultiChart.EditStates.select;
                break;
            case 5: // alt + shift - ?
                this.editState = Ui.MultiChart.EditStates.none;
                break;
            case 6: // ctrl + shift - deselection
                this.editState = Ui.MultiChart.EditStates.deselect;
                break;
            case 7: // alt + ctrl + shift - ?
                break;
            default:
                this.editState = Ui.MultiChart.EditStates.draw;
                break;
        }
        this.edit(pos, false);
        return true;
    };
    Ui.MultiChart.prototype.onmouseup = function(e) {
        var pos = [e.layerX, this.canvas.height - e.layerY];
        this.edit(pos, true);
        this.editState = Ui.MultiChart.EditStates.none;
        var onclick = this.handlers['onclick'];
        if (onclick) {
            onclick.call(this, e);
        }
        return true;
    };
    Ui.MultiChart.prototype.onkeyup = function(e) {
        var key = e.keyCode || e.which;
        switch (key) {
            case 83:
                this.editMode = Ui.MultiChart.EditModes.select;
                break;
            case 68:
                this.editMode = Ui.MultiChart.EditModes.draw;
                break;
        }
        console.log(this.editMode);
        return true;
    };
    Ui.MultiChart.prototype.onfocus = function(e) {
        this.canvas.style.backgroundColor = '#101010';
    };
    Ui.MultiChart.prototype.onblur = function() {
        this.canvas.style.backgroundColor = '#000000';
    };

    // Statics
    Ui.MultiChart.resources = {};
    Ui.MultiChart.RenderModes = {
        'default': { 'shader': 'default', 'code': 0 },
        'bar': { 'shader': 'default', 'code': 1 },
        'dot': { 'shader': 'default', 'code': 2 },
        'line': { 'shader': 'default', 'code': 3 },
        'bar2': { 'shader': 'default', 'code': 4 },
        'area': { 'shader': 'default', 'code': 5 },
        'line2': { 'shader': 'default', 'code': 6 }
    };
    Ui.MultiChart.EditStates = {
        'none': 0,
        'draw': 1,
        'erase': 2,
        'drag': 3,
        'zoom': 4,
        'reselect': 5,
        'deselect': 6,
        'select': 7
    };
    Ui.MultiChart.EditModes = {
        'select': 0,
        'draw': 1,
        'erase': 2
    };

    Ui.MultiChart.MinZoom = 0.5;
    Ui.MultiChart.MaxZoom = 2.0;

    Ui.MultiChart.render = function(instance) {
        clearTimeout(instance.timer);
        if (instance.isRunning) {
            instance.paint();
            instance.timer = setTimeout(Ui.MultiChart.render, 60, instance);
        }
    };

})();
