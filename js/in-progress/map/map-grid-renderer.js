include('/lib/webgl/webgl.js');

(function() {
    function MapRenderer() {
        this.texture = null;
        this.vertices = null;
        this.vbo = null;
        this.ibo = null;
        this.program = null;
        this.size = null;
        this.count = 0;
    }

    MapRenderer.prototype.initialize = async function initialize(width, height, atlasUrl) {
        // create texture
        var res = await load(atlasUrl);
        if (res.error) throw res.error;
        this.atlas = res.data;
        var path = new Url(res.resolvedUrl).getPath();
        res = await load(this.atlas.image, path);
        if (res.error) throw res.error;
        this.atlas.texture = webGL.createTexture(res.node);
        this.size = new Float32Array([width, height]);
        // create vertex and index buffers
        this.vertices = new Float32Array(2*3*width*height);
        var ix = 0;
        this.count = 0;
        var wi = width-1, he = height-1;
        for (var j=0; j<height; j++) {
            for (var i=0; i<width; i++) {
                this.vertices[ix++] = 2*i/wi - 1;
                this.vertices[ix++] = 2*j/he - 1;
                this.vertices[ix++] = 0.5;
                // duplicate
                this.vertices[ix++] = 2*i/wi - 1;
                this.vertices[ix++] = 2*j/he - 1;
                this.vertices[ix++] = 0.5;
            }
            //console.log(this.vertices.slice(ix - 3*width, ix));
        }
        var indices = new Uint16Array(6*(width-1)*(height-1));
        ix = 0;
        var di = 0;
        for (var j=0; j<height-1; j++) {
            for (var i=0; i<width-1; i++) {
                indices[ix++] = 2*di; indices[ix++] = 2*(di+width+1); indices[ix++] = 2*(di+width);
                indices[ix++] = 2*di; indices[ix++] = 2*(di+1); indices[ix++] = 2*(di+width+1);
                di++;
            }
            di++;
        }
        this.count = indices.length;
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        this.ibo = webGL.createBuffer(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // create shader program
		var shaders = {};
		shaders[gl.VERTEX_SHADER] = 
		   `#version 300 es
			in vec2 a_position;
            in float a_shade;
			out float v_shade;
	
			void main(void) {
				gl_Position = vec4(.9*a_position, 0., 1.);
				v_shade = a_shade;
			}`;
        shaders[gl.FRAGMENT_SHADER] =
		   `#version 300 es
			precision highp float;

			//uniform sampler2D u_texture0;
			in float v_shade;
			out vec4 color;
	
			void main(void) {
				color = vec4(v_shade, v_shade, v_shade, 1.0);
			}`;
        this.program = webGL.createProgram(shaders, { 'a_position': { 'buffer': 1 }, 'a_shade': { 'buffer': 1 }});
        //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };

    MapRenderer.prototype.setData = function setData(data) {
        // update vertex colors
        var ix = 0;
        for (var j=0; j<this.size[1]; j++) {
            for (var i=0; i<this.size[0]; i++) {
                this.vertices[3*ix+2] = data[ix]/255;
                ix++;
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.ref);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    };

    MapRenderer.prototype.update = function update() {
    };

    MapRenderer.prototype.render = function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        webGL.useProgram(this.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture.texture);
        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    };
    publish(MapRenderer, 'MapRenderer');
})();