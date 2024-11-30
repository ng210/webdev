include('./scope.js');
include('/lib/math/noise.js');
/*
    - textures: data (n*1), 2 heatmap (w*h)
    - draw samples into data texture
    - render heatmap using data texture and previous heatmap
*/

(function() {
    function FireScope() {
        FireScope.base.constructor.call(this);
        this.shaders.vs =
            `#version 300 es
            in float a_position;
            out float v_color;
            uniform float u_length;
    
            void main(void) {
                vec2 pos = vec2(2.*float(gl_VertexID)/u_length - 1., .6*a_position);
                v_color = a_position + .5;
                gl_Position = vec4(pos, 0., 1.);
            }`;
        this.shaders.fs =
            `#version 300 es
            precision highp float;
    
            in float v_color;
            out vec4 color;
    
            void main(void) {
                color = vec4(vec3(pow(v_color, 3.)), 1.);
            }`;
        this.dataTexture = null;
        this.heatMapShaders = [];

        this.noise = new Noise();
        this.noise.transform3d = (x, y, z, v, data, ix) => { data[ix++] = 5.0*v; return ix; };
    }
    extend(Scope, FireScope);
    
    FireScope.prototype.initialize = function initialize() {
        FireScope.base.initialize.call(this);
        this.heatMapShaders[0] = new webGL.ComputeShader();
        this.heatMapShaders[1] = new webGL.ComputeShader();
        var shader =
           `#version 300 es
            precision highp float;
    
            in vec2 v_texcoord;
            uniform sampler2D u_texture0;
            uniform sampler2D u_texture1;
            out float heat;
    
            // // smoothen
            float mf[10] = float[](
                1.0,  5.0,  1.0,
                0.5,  2.0,  0.5,
                0.2,  0.6,  0.2,
                1./11.3
            );

            void main(void) {
                ivec2 texSize = textureSize(u_texture0, 0);
                vec2 d = 1./vec2(texSize);
                vec2 dij = vec2(-d);
                heat = 0.;
                int k = 0;
                for (int j=-1; j<2; j++)
                {
                    dij.x = -d.x;
                    for (int i=-1; i<2; i++)
                    {
                        float f = mf[k++];
                        heat += texture(u_texture0, v_texcoord + dij).x * f;
                        dij.x += d.x;
                    }
                    dij.y += d.y;
                }
                heat *= mf[9];
                float h = texture(u_texture1, vec2(v_texcoord.x, 0.)).x;
                if (gl_FragCoord.y < 2.) heat += h;
            }`;
        this.heatMapShaders[0].setShader(shader);
        this.heatMapShaders[1].setShader(shader);
    };

    FireScope.prototype.resize = function resize() {
        FireScope.base.resize.call(this);
        this.dataTexture = webGL.createTexture([this.length, 1], 'float');
        var w = this.size;
        var h = Math.floor(w * gl.canvas.height/gl.canvas.width);
        this.heatMapShaders[0].setOutput([w, h], 'float');
        this.heatMapShaders[1].setOutput([w, h], 'float');
        // for (var i=0; i<this.heatMapShaders[0].output.data.length; i++) {
        //     this.heatMapShaders[0].output.data[i] = 0;
        //     this.heatMapShaders[1].output.data[i] = 0;
        // }
        this.heatMapShaders[0].input = webGL.Buffer.create(this.heatMapShaders[1].output);
        this.heatMapShaders[1].input = webGL.Buffer.create(this.heatMapShaders[0].output);
        var renderShader =
            `#version 300 es
            precision highp float;
    
            const int LEVEL_COUNT = 6;
            in vec2 v_texcoord;
            uniform sampler2D u_texture0;
            out vec4 color;

            float levels[LEVEL_COUNT] = float[] (
                0.00, 0.40, 0.58, 0.74, 0.95, 1.00
            );

            vec4 colors[LEVEL_COUNT+1] = vec4[](
                vec4(0.3, 0.3, 0.0, 0.00),
                vec4(0.4, 0.2, 0.1, 1.00),
                vec4(0.7, 0.3, 0.0, 0.70),
                vec4(0.8, 0.5, 0.0, 1.00),
                vec4(1.0, 1.0, 0.0, 0.80),
                vec4(1.0, 1.0, 1.0, 1.00),
                vec4(1.0, 1.0, 1.0, 1.00)
            );

            vec4 heatToColor(float h) {
                vec4 c = colors[LEVEL_COUNT];
                float l = clamp(2.*log(0.5+abs(h)), 0., 1.);
                for (int i=0; i<LEVEL_COUNT; i++) {
                    if (l < levels[i]) {
                        float f = (l - levels[i-1])/(levels[i] - levels[i-1]);
                        c = mix(colors[i-1], colors[i], f);
                        break;
                    }
                }
                return c;
            }
    
            void main(void) {
                color = heatToColor(texture(u_texture0, v_texcoord).x);
            }`;
        this.heatMapShaders[0].output.setShader(renderShader);
        this.heatMapShaders[1].output.setShader(renderShader);

        this.dataTexture.setShader(renderShader);

        var hm = this.heatMapShaders[1].output;
        this.noise.createFbm2dFrom3d(hm.width, hm.height, 0, 16, 9, 5, 0.80, 1.00, 0.38, 2.52, hm.data);
        // for (var i=0; i<hm.data.length; i++) {
        //     hm.data[i] = 0;  //6.5*(i % hm.width)/hm.width;
        // }
        hm.setTexture();
    };
    
    FireScope.prototype.update = function update(frames) {
        if (frames % this.refreshRate == 0) {
            // var hm = this.heatMapShaders[0].output;
            // this.noise.createFbm2dFrom3d(hm.width, hm.height, frames/200, 16, 9, 5, 0.80, 1.00, 0.38, 2.52, hm.data);
            // hm.setTexture();
            this.dataTexture.updateTexture(this.dataBuffer);
        }
    };
    FireScope.prototype.render = function render(frames) {
        var ix = frames%2;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        //this.heatMaps[0].render();
        //this.buffer.updateTexture();
    
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.dataTexture.texture);
        gl.disable(gl.BLEND);
        this.heatMapShaders[ix].compute(null, {'u_texture0':0, 'u_texture1':1});
        this.heatMapShaders[ix].output.setTexture();
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.enable(gl.BLEND);
        //this.dataTexture.render();
        this.heatMapShaders[ix].output.render();
    
        gl.lineWidth(8.0);
        FireScope.base.render.call(this, frames);
    };

    publish(FireScope, 'FireScope');
})();