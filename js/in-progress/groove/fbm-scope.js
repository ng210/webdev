include('./scope.js');
include('/lib/math/noise.js');
(function() {
    function FbmScope() {
        FbmScope.base.constructor.call(this);
        this.background = null;
        this.noise = new Noise();
        this.noise.transform3d = (x, y, z, v, data, ix) => {
            var fx = x;
            var fy = y;
            var f = Math.floor(10*(fx + fy))/10;
            v *= f;
            data[ix++] = v * Math.pow(fx, 1.4);
            data[ix++] = v * (1 - fy);
            data[ix++] = v * Math.pow(1 - fx, 1.6);
            data[ix++] = 1;
            return ix;
        };
    }
    extend(Scope, FbmScope);

    FbmScope.prototype.initialize = function initialize() {
        FbmScope.base.initialize.call(this);
        var f = '5.0';
        this.buffer.setShader(
    `#version 300 es
        precision highp float;

        in vec2 v_texcoord;
        uniform mediump usampler2D u_texture0;
        uniform sampler2D u_texture1;
        out vec4 color;

        // sharpen
        vec3 mf1[10] = vec3[](
            vec3( 0.0), vec3(-1.0), vec3( 0.0),
            vec3(-1.0), vec3(${f}), vec3( 1.0),
            vec3( 0.0), vec3( 1.0), vec3( 0.0),
            vec3( 1.0/${f})
        );

        // smoothen
        vec3 mf2[10] = vec3[](
            vec3(${f}), vec3( 0.5), vec3(${f}),
            vec3( 0.5), vec3(4.*${f}), vec3( 0.5),
            vec3(${f}), vec3( 0.5), vec3(${f}),
            vec3(1.0/(8.*${f}+2.))
        );

        void main(void) {
            ivec2 texSize = textureSize(u_texture0, 0);
            vec2 d = 1./vec2(texSize);
            vec2 dij = vec2(-d);
            vec3 c;
            int k = 0;
            for (int j=-1; j<2; j++)
            {
                dij.x = -d.x;
                for (int i=-1; i<2; i++)
                {
                    c += vec3(texture(u_texture0, v_texcoord + dij).xyz) * mf2[k++];
                    dij.x += d.x;
                }
                dij.y += d.y;
            }
            color = vec4(mix(c*mf2[9]/255., texture(u_texture1, v_texcoord).xyz, 0.2), 1.) ;
        }`);

        this.background = webGL.createTexture([this.buffer.width*this.scale, this.buffer.height*this.scale], 'float[4]');
        this.update(0);
        //this.createFbmData(this.background.width, this.background.height, 0, this.background.data);
        this.background.setTexture();
    };
    FbmScope.prototype.update = function update(frames) {
        if (frames % this.refreshRate == 0) {
            var buf = this.background;
            this.noise.createFbm2dFrom3d(buf.width, buf.height, frames/200, 16, 9, 5, 0.80, 1.00, 0.38, 2.52, buf.data);
            buf.setTexture();
        }

        // //FbmScope.base.update.call(this, frames);
        
        // this.background.setTexture();
    };
    FbmScope.prototype.render = function render(frames) {
        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // gl.clearColor(0, 0, 0, 0.2);
        // gl.clear(gl.COLOR_BUFFER_BIT);

        //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.buffer.updateTexture();

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.background.texture);
        this.buffer.render({ 'u_texture0': 0, 'u_texture1': 1 });

        FbmScope.base.render.call(this, frames);
    };

    publish(FbmScope, 'FbmScope');
})();