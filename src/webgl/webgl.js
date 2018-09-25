(function () {
    function webGL(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
    }

    webGL.prototype.createShader = function (id) {
        var node = document.getElementById(id);
        if (node != null) {
            var code = node.childNodes[0].nodeValue;
            var type = {
                'x-shader/x-vertex': this.gl.VERTEX_SHADER,
                'x-shader/x-fragment': this.gl.FRAGMENT_SHADER
            }[node.getAttribute('type')];
            var shader = this.gl.createShader(type);
            this.gl.shaderSource(shader, code);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw new Error('Error compiling shader:' + this.gl.getShaderInfoLog(shader));
            }
        } else {
            throw new Error('Shader id not found!');
        }
        return shader;
    }

    webGL.prototype.createProgram = function (shaderIds, attributes) {
        var prg = this.gl.createProgram();
        shaderIds.forEach(id => {
            var shader = this.createShader(id);
            gl.attachShader(prg, shader);
        });
        gl.linkProgram(prg);
        if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
            throw new Error('Error linking shader program: ' + gl.getProgramInfoLog(prg));
        }
        return prg;
    };

    //window.webGL = webGL;
    module.exports=webGL;
})();