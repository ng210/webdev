include('glui/glui-lib.js');
include('webgl/webgl.js');

(function() {

    // internal variables and functions

    const VERTEX_SIZE = 7;

    var Demo = {
        // Member variables
        // required by the framework
        name: 'Morph',
        settings: {
            resolution: { label: 'Resolution', value: 3, min:2, max:20, step: 1, type: 'int', link: null },
            grid: { label: 'Grid', value: 1, min:0, max:1, step: 1, type: 'bool', link: null },
            image: { label: 'Image', value: 0, min:0, max:1, step: 1, type: 'bool', link: null },
            speed: { label: 'Speed', value: 1.0, min:0, max:2, step: 0.1, normalized:true, type: 'float', link: null },
            delta: { label: 'Delta', value: 0.0, min:0, max:2, step: 0.05, type: 'float', link: null },
        },
        uniforms: {
            u_factor:{type:webGL.FLOAT, size:1},
            u_grid:{type:webGL.FLOAT, size:1},
            u_texture1:{type:webGL.INT, size:1},
            u_texture2:{type:webGL.INT, size:1}
        },
        factor: 0,
        selected: 0,
        // custom variables
        canvas: null,
        vertices: null,
        indices1: null,
        indices2: null,
        positions: [null, null],
        image: 0,
        vertexData: null,
        trisCount: 0,
        lineCount: 0,

        texture1: null,
        texture2: null,
    
        // Member functions
        createVertices: function createBuffer() {
            var count = this.settings.resolution.value + 1;
            var width = count + 1;
            var p1 = new Float32Array(2*width*width);
            var p2 = new Float32Array(2*width*width);
            var vd = new Float32Array(VERTEX_SIZE*width*width);
            var k = 0, l = 0;

            for (var j=0; j<width; j++) {
                for (var i=0; i<width; i++) {
                    var vx = 2*i/count - 1, vy = 2*j/count - 1;
                    var tx = i/count, ty = 1 - j/count;
                    p1[l] = p2[l] = vd[k] = vx; k++; l++;
                    p1[l] = p2[l] = vd[k] = vy; k++; l++;
                    vd[k++] = tx; vd[k++] = ty;
                    vd[k++] = tx; vd[k++] = ty;
                    vd[k++] = 0.0;
                }
            }
            this.positions[0] = p1;
            this.positions[1] = p2;
            this.vertexData = vd;

            this.vertices = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
        },
        createIndices: function createIndices() {
            this.trisCount = 0;
            var count = this.settings.resolution.value + 1;
            var width = count + 1;
            var ib = new Uint16Array(2*3*count*count), k = 0;
            var l = 0;
            for (var i=0; i<count; i++) {
                for (var j=0; j<count; j++) {
                    var i1 = l+j, i2 = i1 + 1, i3 = i1+width, i4 = i2+width;
                    ib[k++] = i1; ib[k++] = i2; ib[k++] = i3;
                    this.trisCount++;
                    ib[k++] = i2; ib[k++] = i4; ib[k++] = i3;
                    this.trisCount++;
                }
                l += width;
            }
            this.indices1 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices1);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ib, gl.STATIC_DRAW);

            var count = this.settings.resolution.value + 1;
            var width = count + 1;
            ib = new Uint16Array(4*count*count), k = 0;
            this.lineCount = 0;

            var l = 0;
            for (var i=0; i<count; i++) {
                for (var j=0; j<count; j++) {
                    var i1 = l+j, i2 = i1 + 1, i3 = i2+width;
                    ib[k++] = i1; ib[k++] = i2; ib[k++] = i2; ib[k++] = i3;
                    this.lineCount += 4;
                }
                l += width;
            }
            this.indices2 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices2);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ib, gl.STATIC_DRAW);
        },
        createBuffers: function createBuffers() {
            this.createVertices();
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this.createIndices();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        },
        // required by the framework
        initialize: async function initialize() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = glui.canvas.width;
            this.canvas.height = glui.canvas.height;
            this.canvas.style.zIndex = 100;
            glui.canvas.style.zIndex = 1000;
            document.body.appendChild(this.canvas);
            this.originalBackgroundColor = glui.canvas.style.background;
            glui.canvas.style.background = 'transparent';
            glui.renderingContext2d.clearRect(0, 0, glui.width, glui.height)

            gl = this.canvas.getContext('webgl');
            if (gl == null) throw new Error('webGL not supported!');
        
            // create program
            var res = await load(['/demo/morph/default.vs', '/demo/morph/simple.fs']);
            if (res[0].error) throw new Error(res[0].error);
            if (res[1].error) throw new Error(res[1].error);
            var shaders = {};
            shaders[gl.VERTEX_SHADER] = res[0].data;
            shaders[gl.FRAGMENT_SHADER] = res[1].data;
            this.program = webGL.createProgram(shaders,
                {
                    a_position:{type:gl.FLOAT, size:2},
                    a_texcoord:{type:gl.FLOAT, size:4},
                    a_factor:{type:gl.FLOAT, size:1}
                }, this.uniforms);

            // create buffers
            this.createBuffers();

            // create texture1
            res = await load('/demo/morph/mrbean.png');
            if (res.error) throw new Error(res.error);
            this.texture1 = webGL.createTexture(res.node);
            // create texture2
            res = await load('/demo/morph/gollum.png');
            if (res.error) throw new Error(res.error);
            this.texture2 = webGL.createTexture(res.node);

            this.loadPositions('/demo/morph/beangollum.json');
        },
        getVertexIndexAt: function getVertexIndexAt(x, y) {
            var width = this.settings.resolution.value + 1;
            var d = 0.5*0.5/width/width;
            var ix = 0, k = 0;
            width++;
            for (var j=0; j<width; j++) {
                for (var i=0; i<width; i++) {
                    var dx = 0.5*(this.vertexData[k] + 1) - x;
                    var dy = 0.5*(this.vertexData[k+1] + 1) + y - 1;
                    if (dx*dx + dy*dy < d) break;
                    k += VERTEX_SIZE;
                    ix++;
                }
            }
            return ix;
        },
        destroy: function destroy() {
            document.body.removeChild(this.canvas);
            delete this.canvas;
            glui.canvas.style.background = this.originalBackgroundColor;
            gl.deleteBuffer(this.vertices);
            gl.deleteBuffer(this.indices1);
            gl.deleteBuffer(this.indices2);
        },
        resize: function resize(e) {
        },
        update: function update(frame, dt) {
            var delta = this.settings.delta.value + this.settings.speed.value * dt;
            if (delta > 2) delta -= 2;
            this.settings.delta.control.setValue(delta);
            var width = this.settings.resolution.value + 2;
            this.factor = 0.5 * (1 - Math.cos(delta * Math.PI));
            // update position of vertices
            var k = 0, l = 0;
            for (var j=0; j<width; j++) {
                for (var i=0; i<width; i++) {
                    var cx = this.factor*this.positions[1][l] + (1.0 - this.factor) * this.positions[0][l]; l++;
                    var cy = this.factor*this.positions[1][l] + (1.0 - this.factor) * this.positions[0][l]; l++;
                    this.vertexData[k] = cx;
                    this.vertexData[k+1] = cy;
                    k += VERTEX_SIZE;
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },
        render: function render(frame, dt) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            webGL.useProgram(this.program, {
                'u_texture1': 0,
                'u_texture2': 1,
                'u_factor': this.factor,
                'u_grid':0
            });

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.texture2);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices1);
            gl.drawElements(gl.TRIANGLES, 3*this.trisCount, gl.UNSIGNED_SHORT, 0);

            if (this.settings.grid.value) {
                this.program.setUniforms({'u_grid':1});
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices2);
                gl.drawElements(gl.LINES, this.lineCount, gl.UNSIGNED_SHORT, 0);
            }
        },
        refresh: function refresh() {
            var width = this.settings.resolution.value + 2;
            var k = 0, l = 0, offset = 2*this.image;
            for (var j=0; j<width; j++) {
                for (var i=0; i<width; i++) {
                    var cx = this.positions[this.image][l++];
                    var cy = this.positions[this.image][l++];
                    var tx = 0.5*(cx + 1);
                    var ty = 0.5*(1 - cy);
                    this.vertexData[k] = cx;
                    this.vertexData[k+1] = cy;
                    this.vertexData[offset+k+2] = tx;
                    this.vertexData[offset+k+3] = ty;
                    k += VERTEX_SIZE;
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this.render(0, 0);
        },
        loadPositions: async function loadPositions(url) {
            var file = await load(url);
            if (file.error instanceof Error) {
                alert(file.error);
            } else {
                if (file.data.resolution && Array.isArray(file.data.positions1) && Array.isArray(file.data.positions2)) {
                    var resolution = parseInt(file.data.resolution);
                    if (this.settings.resolution.value != resolution) {
                        this.settings.resolution.control.setValue(resolution);
                        this.createBuffers();
                    }
                    this.image = 1;
                    this.positions[1] = new Float32Array(file.data.positions2);
                    this.refresh();
                    this.image = 0;
                    this.positions[0] = new Float32Array(file.data.positions1);
                    this.refresh();
                } else {
                    alert('File corrupt!');
                }
            }
        },
        
		onchange: function onchange(e, setting) {
			switch (setting.parent.id) {
				case 'resolution':
					this.createBuffers();
                    break;
                case 'image':
                    this.factor = setting.value;
                    this.image = setting.value;
                    this.refresh();
                    break;
                case 'delta':
                    this.update(0, 0);
                    break;
			}
        },
        onmousedown: function onmousedown(x, y, e) {
            if (typeof x === 'number') {
                this.vertexData[VERTEX_SIZE * this.selected+VERTEX_SIZE-1] = 0.0;
                this.selected = this.getVertexIndexAt(x, y);
                var ix = VERTEX_SIZE * this.selected;
                this.vertexData[ix+VERTEX_SIZE-1] = 1.0;
                this.refresh();
            }
        },
        onmouseup: function onmouseup(x, y, e) {
        },
        ondragging: function ondragging(x, y, e) {
            if (typeof x === 'number') {
                this.positions[this.image][2*this.selected] = 2*x - 1;
                this.positions[this.image][2*this.selected+1] = 1 - 2*y;
                this.refresh();
            }
        }
        // custom functions

    };

    publish(Demo, 'Demo');
})();