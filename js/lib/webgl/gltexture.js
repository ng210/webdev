export default class glTexture {
    // get validTypes() {
    //     const gl = this.webgl.gl;
    //     return [
    //         gl.R8, gl.R8I, gl.R8UI,
    //         gl.R16I, gl.R16UI,
    //         gl.R32I, gl.R32UI,
    //         gl.R32F,

    //         gl.RG8, gl.RG8I, gl.RG8UI,
    //         gl.RG16I, gl.RG16UI,
    //         gl.RG32I, gl.RG32UI,
    //         gl.RG32F,

    //         gl.RGB8, gl.RGB8I, gl.RGB8UI,
    //         gl.RGB16I, gl.RGB16UI,
    //         gl.RGB32I, gl.RGB32UI,
    //         gl.RGB32F,

    //         gl.RGBA8, gl.RGBA8I, gl.RGBA8UI,
    //         gl.RGBA16I, gl.RGBA16UI,
    //         gl.RGBA32I, gl.RGBA32UI,
    //         gl.RGBA32F,
    //     ];
    // }
    constructor(webgl) {
        this.webgl = webgl;
        const gl = webgl.gl;
        if (arguments.length == 1) throw new Error('Not enough arguments!');
        if (arguments[1] instanceof glTexture) {
            let tex = arguments[1];
            let data = arguments[2] || tex.data
            this.width = tex.width;
            this.height = tex.height;
            this.typeName = tex.typeName;
            this.internalFormat = tex.internalFormat;
            this.format = tex.format;
            this.type = tex.type;
            this.minFilter = tex.minFilter;
            this.magFilter = tex.magFilter;
            this.wrapS = tex.wrapS;
            this.wrapT = tex.wrapT;
            this.useMipmaps = tex.useMipmaps;
            this.data = data;
            this.tag = tex.tag+'*';
        } else {
            let width = arguments[1];
            let height = arguments[2];
            let options = arguments[3] || {};
            this.width = width;
            this.height = height;
            // Default options
            this.typeName = options.typeName || 'float';
            this.internalFormat = options.internalFormat || gl.RGBA;
            this.format = options.format || gl.RGBA;
            this.type = options.type || gl.RGBA32F;
            // // validate type
            // if (options.type && !this.validTypes.includes(options.type)) {
            //     throw new Error(`Invalid texture type: ${options.type}`);
            // }
            this.minFilter = options.minFilter || gl.LINEAR;
            this.magFilter = options.magFilter || gl.LINEAR;
            this.wrapS = options.wrapS || gl.CLAMP_TO_EDGE;
            this.wrapT = options.wrapT || gl.CLAMP_TO_EDGE;
            this.useMipmaps = options.useMipmaps || false;
            this.data = options.data || null;
            this.tag = options.tag || null;
        }

        this.texture = gl.createTexture();
        this.unit = -1;
        this.initTexture();
    }

    initTexture() {
        const gl = this.webgl.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
        // Generate mipmaps if enabled
        if (this.useMipmaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    bind(unit = 0) {
        this.unit = unit;
        const gl = this.webgl.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }

    uploadImage(image) {
        const gl = this.webgl.gl;
        this.width = image.width;
        this.height = image.height;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, image);

        if (this.useMipmaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    uploadData(data) {
        this.data = data;
        this.update();
    }

    update() {
        const gl = this.webgl.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,                  // level
            0, 0,               // offset
            this.width, this.height,
            this.format,
            this.type,
            this.data);
        //gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.data);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    delete() {
        this.webgl.gl.deleteTexture(this.texture);
        this.texture = null;
    }
}
