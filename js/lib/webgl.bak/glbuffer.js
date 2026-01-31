export default class glBuffer {
    get length() {
        return this.data.length;
    }

    constructor(webgl, type, tag) {
        this.webgl = webgl;
        this.id = -1;
        const gl = webgl.gl;
        this.type = type || gl.ARRAY_BUFFER;
        // this.usage = options.usage || gl.STATIC_DRAW;
        // this.format = options.format || gl.RGBA;
        // this.dataType = options.type || gl.UNSIGNED_BYTE;
        // this.data = options.data || null;
        // this.tag = options.tag;
        this.data = null;
        this.tag = tag;
        this.buffer = type == gl.FRAMEBUFFER ? gl.createFramebuffer() : gl.createBuffer();
    }

    // const framebuffer = gl.createFramebuffer();
    // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);


    uploadData(data, usage) {
        const gl = this.webgl.gl;
        this.data = data;
        gl.bindBuffer(this.type, this.buffer);
        gl.bufferData(this.type, data, usage);
    }

    // uploadToTexture(texture) {
    //     const gl = this.webgl.gl;

    //     if (!this.texture) {
    //         throw new Error('No texture to upload to!');
    //         //this.texture = new glTexture(gl, );
    //     }

    //     gl.bindTexture(gl.TEXTURE_2D, this.texture);
    //     gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.texture.width, this.texture.height, 0, this.format, this.dataType, data || null);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // }

    // createRenderTarget() {
    //     const gl = this.webgl.gl;
    //     if (!this.texture) {
    //         this.uploadToTexture();
    //     }

    //     if (!this.framebuffer) {
    //         this.framebuffer = gl.createFramebuffer();
    //     }

    //     gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    //     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // }

    bind(texture, options = {}) {
        const gl = this.webgl.gl;
        if (this.type == gl.FRAMEBUFFER) {
            options.attachment = options.attachment || gl.COLOR_ATTACHMENT0;
            options.textarget = options.textarget || gl.TEXTURE_2D;
            options.level = options.level || 0;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                options.attachment,
                options.textarget,
                texture,
                options.level);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        // gl.viewport(0, 0, this.texture.width, this.texture.height);
    }

    delete() {
        const gl = this.webgl.gl;
        if (this.type == gl.FRAMEBUFFER) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
            gl.deleteFramebuffer(this.buffer)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            gl.deleteBuffer(this.buffer);
        }
    }
}
